// src/config/constants.js

// Rate limiting
const RATE_LIMIT = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minuta
    max: 5, // 5 përpjekje për IP
  },
  GENERAL: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
};

// JWT
const JWT_CONFIG = {
  expiresIn: '7d',
  algorithm: 'HS256',
};

// Email
const EMAIL_CONFIG = {
  verificationExpiry: 24 * 60 * 60 * 1000, // 24 orë
  resetPasswordExpiry: 1 * 60 * 60 * 1000, // 1 orë
};

module.exports = {
  RATE_LIMIT,
  JWT_CONFIG,
  EMAIL_CONFIG,
};
