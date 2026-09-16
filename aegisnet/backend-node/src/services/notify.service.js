// notify.service.js — console mock in dev; real Twilio/FCM in prod
const USE_REAL = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;

let twilioClient;
if (USE_REAL) {
  const twilio = require('twilio');
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendSms(to, message) {
  if (USE_REAL) {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_FROM_NUMBER,
      to,
    });
    console.log(`[SMS] Sent to ${to}`);
  } else {
    console.log(`[SMS MOCK] To: ${to} | ${message}`);
  }
  return { mock: !USE_REAL, to, message };
}

async function sendPush(topic, title, body) {
  if (process.env.FCM_SERVER_KEY) {
    // FCM HTTP v1 — plug real implementation here
    console.log(`[PUSH] Topic: ${topic} | ${title}`);
  } else {
    console.log(`[PUSH MOCK] Topic: ${topic} | ${title}: ${body}`);
  }
  return { mock: !process.env.FCM_SERVER_KEY, topic, title, body };
}

module.exports = { sendSms, sendPush };
