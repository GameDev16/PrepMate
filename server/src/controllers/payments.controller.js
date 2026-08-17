const crypto = require("crypto");
const { db } = require("../db");
const { users, payments, transactions } = require("../db/schema");
const { eq, and, sql } = require("drizzle-orm");

const CREDIT_PACKS = {
  starter: { id: "starter", name: "Starter Pack", priceINR: 49, amountPaise: 4900, credits: 10 },
  popular: { id: "popular", name: "Popular Pack", priceINR: 99, amountPaise: 9900, credits: 25 },
  power: { id: "power", name: "Power Pack", priceINR: 199, amountPaise: 19900, credits: 60 },
};

async function createOrder(req, res) {
  try {
    const user = req.user;
    const { packId } = req.body;

    const pack = CREDIT_PACKS[packId];
    if (!pack) {
      return res.status(400).json({ error: "Invalid credit pack selected" });
    }

    const isMockMode = process.env.MOCK_MODE === "true" || !process.env.RAZORPAY_KEY_ID;

    if (isMockMode) {
      const mockOrderId = `order_mock_${Date.now()}`;
      await db.insert(payments).values({
        userId: user.id,
        razorpayOrderId: mockOrderId,
        amount: pack.amountPaise,
        creditsPurchased: pack.credits,
        status: "created",
      });

      return res.status(200).json({
        orderId: mockOrderId,
        amount: pack.amountPaise,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
        packId: pack.id,
      });
    }

    const Razorpay = require("razorpay");
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await rzp.orders.create({
      amount: pack.amountPaise,
      currency: "INR",
      receipt: `rcpt_${user.id.slice(0, 8)}_${Date.now()}`,
    });

    await db.insert(payments).values({
      userId: user.id,
      razorpayOrderId: order.id,
      amount: pack.amountPaise,
      creditsPurchased: pack.credits,
      status: "created",
    });

    return res.status(200).json({
      orderId: order.id,
      amount: pack.amountPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      packId: pack.id,
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function verifyPayment(req, res) {
  try {
    const user = req.user;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({ error: "Missing razorpay_order_id" });
    }

    const [paymentRow] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.razorpayOrderId, razorpay_order_id), eq(payments.userId, user.id)))
      .limit(1);

    if (!paymentRow) {
      return res.status(404).json({ error: "Order record not found" });
    }

    if (paymentRow.status === "paid") {
      const [currentUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      return res.status(200).json({ success: true, credits: currentUser.credits });
    }

    const isMockMode = process.env.MOCK_MODE === "true" || razorpay_order_id.startsWith("order_mock_");

    if (!isMockMode) {
      if (!razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing verification parameters" });
      }

      if (!process.env.RAZORPAY_KEY_SECRET) {
        console.error("Verify payment error: RAZORPAY_KEY_SECRET is not configured.");
        return res.status(500).json({ error: "Payment verification is not configured." });
      }

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      // Constant-time comparison — a plain !== leaks timing information about
      // how many leading bytes of the signature matched, which in principle
      // helps an attacker forge a valid signature byte-by-byte. Buffers must
      // be equal length before timingSafeEqual is called, or it throws.
      const expectedBuf = Buffer.from(expectedSignature, "hex");
      const providedBuf = Buffer.from(String(razorpay_signature), "hex");
      const signatureMatches =
        expectedBuf.length === providedBuf.length &&
        crypto.timingSafeEqual(expectedBuf, providedBuf);

      if (!signatureMatches) {
        await db.update(payments).set({ status: "failed" }).where(eq(payments.id, paymentRow.id));
        return res.status(400).json({ error: "Payment verification failed" });
      }
    }

    // Mark as paid only if currently in created state (atomic claim preventing double-crediting race #2)
    const [claimedPayment] = await db
      .update(payments)
      .set({
        status: "paid",
        razorpayPaymentId: razorpay_payment_id || `pay_mock_${Date.now()}`,
      })
      .where(and(eq(payments.id, paymentRow.id), eq(payments.status, "created")))
      .returning();

    if (!claimedPayment) {
      return res.status(400).json({ error: "Payment already processed or not in created state." });
    }

    // NOTE: this update targeting eq(users.id, user.id) should always find a
    // row — the caller is authenticated as that exact user. If it somehow
    // returns nothing (row deleted mid-request), that's a genuine data
    // integrity problem, not something to paper over with a fallback value
    // computed from an undefined variable (the previous bug here). Fail loudly
    // instead: the payment is already claimed as "paid" above, so the credits
    // can be reconciled manually from the payments/transactions tables.
    const [updatedUser] = await db
      .update(users)
      .set({
        credits: sql`${users.credits} + ${paymentRow.creditsPurchased}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({ credits: users.credits });

    if (!updatedUser) {
      console.error(
        `Verify payment error: user ${user.id} not found when crediting payment ${paymentRow.id}. Payment is marked paid but credits were not applied — needs manual reconciliation.`,
      );
      return res.status(500).json({
        error: "Payment recorded but crediting failed. Please contact support with your order ID.",
      });
    }

    await db.insert(transactions).values({
      userId: user.id,
      type: "credit",
      amount: paymentRow.creditsPurchased,
      description: `Purchased ${paymentRow.creditsPurchased} credits (${razorpay_order_id})`,
    });

    return res.status(200).json({ success: true, credits: updatedUser.credits });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getPacks(req, res) {
  return res.status(200).json({ packs: Object.values(CREDIT_PACKS) });
}

module.exports = {
  createOrder,
  verifyPayment,
  getPacks,
};
