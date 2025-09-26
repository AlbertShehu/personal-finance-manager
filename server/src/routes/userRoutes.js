// server/routes/userRoutes.js
const express = require("express");
const router = express.Router();

const requireAuth = require("../middleware/authMiddleware");
const {
  getUserProfile,
  updatePassword,
  updateProfile,
  deleteAccount, // ⬅️ SHTUAR: fshirja e llogarisë
} = require("../controllers/userController");

// 👤 Profile – GET /api/users/profile
router.get("/profile", requireAuth, getUserProfile);

// 🔒 Ndrysho fjalëkalimin – PATCH (kanonike) dhe PUT (kompatibilitet)
router.patch("/change-password", requireAuth, updatePassword);
router.put("/change-password", requireAuth, updatePassword);

// ✏️ Përditëso profilin – kanonike /profile; alias /update-profile për mbrapsht-kompatibilitet
router.patch("/profile", requireAuth, updateProfile);
router.patch("/update-profile", requireAuth, updateProfile);

// 🗑️ Fshi llogarinë – DELETE /api/users/me (kërkon JWT + { password } në body)
router.delete("/me", requireAuth, deleteAccount);

module.exports = router;
