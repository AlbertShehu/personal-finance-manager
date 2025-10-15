const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Log environment variables (pa sensitive data)
console.log('🔧 Environment check:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ MISSING');

const app = express();

// Trust proxy for Railway/Cloudflare (fixes rate limiting)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true); // Trust all proxies (Railway + Cloudflare)
  console.log('🔒 [PROXY] Trust proxy enabled for production');
}

// Prisma client with production-optimized settings
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
});

const PORT = process.env.PORT || 8095;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting with Cloudflare support
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Shumë kërkesa nga ky IP, provo përsëri më vonë.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use Cloudflare IP if available, otherwise use Express IP
  keyGenerator: (req) => req.headers['cf-connecting-ip'] || req.ip,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs (increased for testing)
  message: 'Shumë përpjekje hyrjeje, provo përsëri pas 15 minutash.',
  standardHeaders: true,
  legacyHeaders: false,
  // Use Cloudflare IP if available, otherwise use Express IP
  keyGenerator: (req) => req.headers['cf-connecting-ip'] || req.ip,
});

// CORS configuration with proper headers
const ALLOWED_ORIGINS = [
  'https://finman-app.com',
  'https://finman-app.pages.dev',
  /https:\/\/.*\.pages\.dev$/,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // lejo kërkesa pa Origin (p.sh. health checks)
    const ok = ALLOWED_ORIGINS.some(o => o instanceof RegExp ? o.test(origin) : o === origin);
    return ok ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-Id',       // ✅ KJO ËSHTË THELBËSORE
    'CF-Connecting-IP',
    'X-Forwarded-For'
  ],
  exposedHeaders: ['X-Request-Id'],
  credentials: true,        // lëre true vetëm nëse përdor cookies/cred
  maxAge: 86400             // cache i preflight
}));

// Lejo preflight për çdo rrugë
app.options('*', cors());

// Middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      if (buf && buf.length > 0) {
        JSON.parse(buf);
      }
    } catch (e) {
      console.error('🛑 [JSON PARSE ERROR] Invalid JSON received:', buf?.toString() || 'empty buffer');
      throw new Error('Invalid JSON');
    }
  }
}));

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('🛑 [JSON ERROR] Syntax error in JSON:', error.message);
    return res.status(400).json({ message: 'Invalid JSON format' });
  }
  next(error);
});

// Apply rate limiting
app.use(limiter);

// Mount routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'FinMan API is running', status: 'healthy' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🛑 [ERROR]', err.stack);
  res.status(500).json({ message: 'Gabim në server' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Cleanup job for expired tokens (runs every 24 hours)
const cleanupExpiredTokens = async () => {
  try {
    const result = await prisma.emailVerificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    
    if (result.count > 0) {
      console.log(`🧹 [CLEANUP] Fshinë ${result.count} token-e të skaduara`);
    }
  } catch (error) {
    console.error('❌ [CLEANUP] Gabim gjatë pastrimit të token-ave:', error);
  }
};

// Run cleanup after a delay to ensure Prisma is initialized, then every 24 hours
setTimeout(cleanupExpiredTokens, 5000); // Wait 5 seconds for Prisma to initialize
setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000); // 24 hours

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 [SHUTDOWN] Duke mbyllur serverin...');
  await prisma.$disconnect();
  process.exit(0);
});
