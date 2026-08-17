const { randomUUID: uuidv4 } = require("crypto");
const { db } = require("../db");
const {
  users,
  verificationTokens,
  resetTokens,
  transactions,
} = require("../db/schema");
const { eq, and, gt, sql } = require("drizzle-orm");
const {
  hashPassword,
  verifyPassword,
  createToken,
  getUserFromToken,
  getTokenFromRequest,
} = require("../lib/auth");
const { validatePassword } = require("../lib/password");
const { sendPasswordResetEmail } = require("../lib/mail");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";

function setCookieOptions() {
  return {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "Password does not meet requirements",
        requirements: passwordValidation.errors,
      });
    }

    // Check if email exists (case-insensitive)
    const normalizedEmail = email.toLowerCase();
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: normalizedEmail,
        passwordHash,
        credits: 3,
      })
      .returning();

    // Create verification token (not consumed by any endpoint yet per spec)
    const verificationToken = uuidv4();
    await db.insert(verificationTokens).values({
      userId: newUser.id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Create welcome bonus transaction
    await db.insert(transactions).values({
      userId: newUser.id,
      type: "credit",
      amount: 3,
      description: "Welcome bonus — 3 free AI generations",
    });

    // Create JWT with tokenVersion for session revocation (#5)
    const token = createToken(newUser.id, newUser.tokenVersion || 0);

    // Set cookie
    res.cookie("token", token, setCookieOptions());

    return res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        credits: newUser.credits,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Google-only accounts have no password
    if (!user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken(user.id, user.tokenVersion || 0);
    res.cookie("token", token, setCookieOptions());

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        isVerified: user.isVerified,
        preferredLanguage: user.preferredLanguage,
        theme: user.theme,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function logout(req, res) {
  try {
    const token = getTokenFromRequest(req);
    if (token) {
      const user = await getUserFromToken(token);
      if (user) {
        await db
          .update(users)
          .set({ tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }
    }
  } catch (err) {
    console.error("Logout token revocation error:", err);
  }
  res.cookie("token", "", { ...setCookieOptions(), maxAge: 0 });
  return res.status(200).json({ success: true });
}

async function me(req, res) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const response = {
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link.",
    };

    if (!email) {
      return res.status(200).json(response);
    }

    const normalizedEmail = email.toLowerCase();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (user) {
      const token = uuidv4();
      await db.insert(resetTokens).values({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(normalizedEmail, resetUrl);

      if (process.env.EXPOSE_RESET_TOKENS === "true") {
        response.token = token;
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "Password does not meet requirements",
        requirements: passwordValidation.errors,
      });
    }

    // Find valid reset token
    const [resetToken] = await db
      .select()
      .from(resetTokens)
      .where(
        and(
          eq(resetTokens.token, token),
          eq(resetTokens.used, false),
          gt(resetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetToken) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password, update user, and bump tokenVersion to revoke existing sessions (#5)
    const passwordHash = await hashPassword(password);
    await db
      .update(users)
      .set({
        passwordHash,
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, resetToken.userId));

    // Mark token as used
    await db
      .update(resetTokens)
      .set({ used: true })
      .where(eq(resetTokens.id, resetToken.id));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function googleAuth(req, res) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

  if (!GOOGLE_CLIENT_ID) {
    return res.redirect(`${CLIENT_URL}/login?error=google_not_configured`);
  }

  // Generate and store state for CSRF protection
  const state = uuidv4();
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const redirectUri = `${process.env.CLIENT_URL || "http://localhost:5000"}/api/auth/google/callback`;
  const scope = encodeURIComponent("email profile");

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;

  return res.redirect(authUrl);
}

async function googleCallback(req, res) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${CLIENT_URL}/login?error=google_auth_failed`);
    }

    if (!code) {
      return res.redirect(`${CLIENT_URL}/login?error=no_code`);
    }

    // Verify state for CSRF protection
    const storedState = req.cookies?.oauth_state;
    if (!storedState || storedState !== state) {
      return res.redirect(`${CLIENT_URL}/login?error=auth_failed`);
    }

    // Clear state cookie
    res.cookie("oauth_state", "", { maxAge: 0 });

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${CLIENT_URL}/login?error=google_not_configured`);
    }

    const redirectUri = `${process.env.CLIENT_URL || "http://localhost:5000"}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return res.redirect(`${CLIENT_URL}/login?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Fetch user info
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      return res.redirect(`${CLIENT_URL}/login?error=auth_failed`);
    }

    const googleUser = await userInfoResponse.json();

    if (!googleUser.email) {
      return res.redirect(`${CLIENT_URL}/login?error=no_email`);
    }

    const normalizedEmail = googleUser.email.toLowerCase();

    // Check if user exists
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (user) {
      // Link Google ID if not already linked
      if (!user.googleId) {
        await db
          .update(users)
          .set({
            googleId: googleUser.id,
            isVerified: true,
            avatarUrl: user.avatarUrl || googleUser.picture,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));
      }
    } else {
      // Create new user
      [user] = await db
        .insert(users)
        .values({
          name: googleUser.name || googleUser.email.split("@")[0],
          email: normalizedEmail,
          googleId: googleUser.id,
          isVerified: true,
          avatarUrl: googleUser.picture,
          credits: 3,
        })
        .returning();

      // Create welcome bonus transaction
      await db.insert(transactions).values({
        userId: user.id,
        type: "credit",
        amount: 3,
        description: "Welcome bonus — 3 free AI generations",
      });
    }

    // Create JWT and set cookie
    const token = createToken(user.id, user.tokenVersion || 0);
    res.cookie("token", token, setCookieOptions());

    return res.redirect(`${CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error("Google callback error:", error);
    return res.redirect(`${CLIENT_URL}/login?error=auth_failed`);
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleCallback,
};


