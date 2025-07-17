const express = require("express");
const unirest = require("unirest");
const router = express.Router();

require("dotenv").config();

// Safaricom credentials
const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const shortCode = process.env.SHORTCODE;
const passkey = process.env.PASSKEY; // Lipa na MPESA passkey
const partyA = parseInt(process.env.PARTYA);

// Util to generate timestamp
function generateTimestamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

// POST /initiate-stk
router.post("/initiate-stk", async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone and amount are required" });
  }

  try {
    // Step 1: Generate base64 encoded credentials
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    // Step 2: Request access token
    unirest('GET', 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials')
      .headers({ 'Authorization': `Basic ${auth}` })
      .end(authRes => {
        if (authRes.error) {
          console.error("Auth error:", authRes.error);
          return res.status(500).json({ error: "Failed to authenticate with Safaricom" });
        }

        const accessToken = JSON.parse(authRes.raw_body).access_token;

        // Step 3: Generate timestamp and password
        const timestamp = generateTimestamp();
        const password = Buffer.from(shortCode + passkey + timestamp).toString('base64');

        // Step 4: STK Push request
        unirest('POST', 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest')
          .headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          })
          .send(JSON.stringify({
            "BusinessShortCode": shortCode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": `${partyA}`,
            "PartyB": shortCode,
            "PhoneNumber": phone,
            "CallBackURL": "https://yourdomain.com/api/mpesa/callback",
            "AccountReference": "CompanyXLTD",
            "TransactionDesc": "Payment of X"
          }))
          .end(stkRes => {
            if (stkRes.error) {
              console.error("STK Push Failed:", stkRes.error);
              return res.status(500).json({ error: "STK Push failed" });
            }

            console.log("STK Push Success:", stkRes.raw_body);
            const responseBody = JSON.parse(stkRes.raw_body);

            res.json({
              success: true,
              checkoutId: responseBody.CheckoutRequestID,
              response: responseBody
            });
          });
      });
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// POST /callback
router.post("/callback", (req, res) => {
  try {
    const result = req.body.Body?.stkCallback;

    if (!result) throw new Error("Invalid callback format");

    if (result.ResultCode === "0") {
      console.log("Payment successful:", {
        amount: result.CallbackMetadata?.Item.find(i => i.Name === "Amount")?.Value,
        receipt: result.CallbackMetadata?.Item.find(i => i.Name === "MpesaReceiptNumber")?.Value,
        phone: result.CallbackMetadata?.Item.find(i => i.Name === "PhoneNumber")?.Value,
        date: result.CallbackMetadata?.Item.find(i => i.Name === "TransactionDate")?.Value
      });

      // TODO: Save to DB
    } else {
      console.log("Payment failed:", result.ResultDesc);
    }

    res.status(200).json({ status: "received" });
  } catch (err) {
    console.error("Callback Error:", err);
    res.status(400).json({ error: "Bad callback data" });
  }
});

module.exports = router;
