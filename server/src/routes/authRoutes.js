// server/routes/authRoutes.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const {
  login,
  register,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleSignIn,
} = require("../controllers/authController");

const { validateGmailEmail } = require("../utils/emailValidator");

// const requireAuth = require("../middleware/authMiddleware"); // Për rruge private

// Limiter specifik për resend (p.sh. max 10 kërkesa / 10 min per IP)
const resendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Tejkalove limitin e kërkesave. Provo më vonë.",
});

/**
 * @route   POST /api/auth/register
 * @desc    Regjistron përdorues (vetëm Gmail) dhe dërgon link verifikimi
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Autentifikon dhe kthen JWT (refuzon nëse email-i s’është verifikuar)
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   GET /api/auth/verify?token=...
 * @desc    Verifikon email-in dhe bën redirect te BASE_URL/login?verified=1|0
 * @access  Public
 */
router.get("/verify", verifyEmail);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Dërgon link për rivendosje (vetëm për llogari të verifikuara)
 * @access  Public
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Rivendos fjalëkalimin me token
 * @access  Public
 */
router.post("/reset-password", resetPassword);

/**
 * @route   POST /api/auth/google
 * @desc    Sign in / Sign up me Google (ID token)
 * @access  Public
 */
router.post("/google", googleSignIn);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Ridërgon linkun e verifikimit (me rate limit)
 * @access  Public
 */
router.post("/resend-verification", resendLimiter, resendVerification);

/**
 * @route   POST /api/auth/validate-email
 * @desc    Validon nëse një email Gmail është i vlefshëm
 * @access  Public
 */
router.post("/validate-email", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email është i detyrueshëm." });
    }
    
    const validation = await validateGmailEmail(email);
    
    if (validation.isValid) {
      return res.status(200).json({ 
        message: "Email-i është i vlefshëm.", 
        isValid: true 
      });
    } else {
      return res.status(400).json({ 
        message: validation.error, 
        isValid: false 
      });
    }
  } catch (error) {
    console.error("❌ [VALIDATE_EMAIL] Gabim:", error);
    return res.status(500).json({ 
      message: "Verifikimi i email-it dështoi.", 
      isValid: false 
    });
  }
});

module.exports = router;
