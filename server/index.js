// server/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./lib/mailer").verifyMailer?.();

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

// Rrugët
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();
const PORT = process.env.PORT || 8095;

/* ===================== Kontrolle bazike të env ===================== */
if (!process.env.BASE_URL) {
  console.warn("⚠️  BASE_URL mungon në .env (përdoret për CORS dhe redirect te front-end).");
}
if (!process.env.SERVER_URL) {
  console.warn("⚠️  SERVER_URL mungon në .env (përdoret për linkun e verifikimit në email).");
}

/* ===================== Rate limiter ===================== */
// Mbron nga brute-force / scraping të tepruar
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 1000,                // max 1000 kërkesa per IP / 15 min (rritur për development)
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});

/* ===================== Origins të lejuar për CORS ===================== */
const allowedOrigins = [
  process.env.BASE_URL,
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174", 
  "http://localhost:4173",
  "https://finman-app.com",
  "https://finman-app.pages.dev",
  /\.pages\.dev$/,  // Për të gjitha Cloudflare Pages subdomain-et
].filter(Boolean);

const finalAllowedOrigins = [...new Set(allowedOrigins)];

/* ===================== Middleware ===================== */
// 1) Body parsing (para rrugeve)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// 2) CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // lejo kërkesa pa Origin (p.sh. curl, Postman)
      if (!origin) return callback(null, true);
      
      // Kontrollo nëse origin-i është në listë ose përputhet me regex
      const isAllowed = finalAllowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      
      if (isAllowed) return callback(null, true);
      return callback(new Error(`CORS policy violation: origin ${origin} not allowed.`));
    },
    credentials: true,
  })
);

// 3) Siguri & logging
app.use(
  helmet({
    // API zakonisht s’ka nevojë për CSP strikte; lihet default
  })
);
app.use(limiter);
app.use(morgan("dev"));

// app.set("trust proxy", 1); // Për proxy (nginx, render, heroku, etj.)

/* ===================== Rrugët ===================== */
// Shënim: authRoutes përfshin edhe GET /verify → /api/auth/verify
app.use("/api/auth", authRoutes);                // register, login, verify, forgot/reset
app.use("/api/users", userRoutes);               // profile, change-password
app.use("/api/transactions", transactionRoutes); // CRUD transaksionesh

// Health check endpoints
app.get("/", (req, res) => {
  res.json({ 
    message: "FinMan API is running",
    timestamp: new Date().toISOString(),
    status: "healthy"
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/* ===================== 404 ===================== */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ===================== Error handler global ===================== */
app.use((err, req, res, next) => {
  console.error("🔥 Global error:", err.stack || err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

/* ===================== Unhandled rejections ===================== */
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  // Në dev mund të mbyllësh procesin; në prod përdor një supervisor (pm2 / systemd)
  // process.exit(1);
});

/* ===================== Start server ===================== */
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
  console.log("🌍 CORS allowed origins:", finalAllowedOrigins);
});
