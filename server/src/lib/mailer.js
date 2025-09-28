// CJS
const nodemailer = require("nodemailer");

let transporter;

/**
 * Krijon transporter një herë (singleton).
 * Përdor Gmail me App Password (2FA duhet të jetë ON tek llogaria).
 */
function getMailer() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Mungon EMAIL_USER ose EMAIL_PASS në .env");
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true për 465, false për 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

/**
 * Opsionale: thirre në start për health-check.
 */
async function verifyMailer() {
  try {
    await getMailer().verify();
    console.log("📧 Mailer OK");
  } catch (err) {
    console.error("❌ Mailer NOT OK:", err?.message || err);
  }
}

module.exports = { getMailer, verifyMailer };
