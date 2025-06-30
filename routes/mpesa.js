// routes/mpesa.js
const express = require("express");
const unirest = require("unirest");
const router = express.Router();

const CONSUMER_KEY = "3YIeD5pf1zxQjR9KiqMlndHoetQzYgiO4DWqZrMcbd5TnHsb";
const CONSUMER_SECRET =
  "y6AGHi37u2THtfGX14w8lUgFg8Y73AlwS0mAdelxQ4adNXEIORgNjgTl9b7WTP8r";

// Generate access token
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const req = unirest(
      "GET",
      "https://sandbox.safaricom.co.ke/oauth/v1/generate",
    );

    req.query({ grant_type: "client_credentials" });

    req.headers({
      Authorization: `Basic ${Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64")}`,
    });

    req.end((res) => {
      if (res.error) return reject(res.error);
      resolve(res.body.access_token);
    });
  });
}

// Initiate M-Pesa STK Push
router.post("/initiate-stk", async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const accessToken = await getAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3);

    const password = Buffer.from(
      `174379${timestamp}`,
    ).toString("base64");

    const stkRequest = await unirest(
      "POST",
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    )
      .headers({
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      })
      .send({
        BusinessShortCode: "174379",
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: "174379",
        PhoneNumber: phone,
        CallBackURL: "YOUR_CALLBACK_URL",
        AccountReference: "SAVINGS",
        TransactionDesc: "FastCash Savings Deposit",
      });

    res.json({
      success: true,
      checkoutId: stkRequest.body.CheckoutRequestID,
    });
  } catch (error) {
    console.error("STK Push Error:", error);
    res.status(500).json({ error: "Payment processing failed" });
  }
});

// Handle M-Pesa callback
router.post("/callback", (req, res) => {
  const result = req.body.Body.stkCallback;

  if (result.ResultCode === 0) {
    // Payment successful
    // Save to database here
    console.log("Payment successful:", result);
  } else {
    console.log("Payment failed:", result.ResultDesc);
  }

  res.status(200).end();
});

module.exports = router;
