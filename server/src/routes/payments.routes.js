const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const paymentsController = require("../controllers/payments.controller");

router.get("/packs", requireAuth, paymentsController.getPacks);
router.post("/create-order", requireAuth, paymentsController.createOrder);
router.post("/verify", requireAuth, paymentsController.verifyPayment);

module.exports = router;
