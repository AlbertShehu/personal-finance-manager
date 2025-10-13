const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();
const { sendVerificationEmail, sendResetPasswordEmail } = require('./src/lib/resend');
const { OAuth2Client } = require('google-auth-library');

// Log environment variables (pa sensitive data)
console.log('🔧 Environment check:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ SET (length: ' + process.env.RESEND_API_KEY.length + ')' : '❌ MISSING');
console.log('   EMAIL_FROM:', process.env.EMAIL_FROM || '❌ MISSING');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ MISSING');

// Google OAuth Client
const googleClient = process.env.GOOGLE_CLIENT_ID 
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8095;

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'https://finman-app.com',
    'https://finman-app.pages.dev',
    'http://localhost:5173',
    'http://localhost:4173'
  ],
  credentials: true
}));

// Email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'FinMan API is running', status: 'healthy' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Të gjitha fushat janë të detyrueshme' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Përdoruesi ekziston tashmë' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        emailVerificationToken,
        emailVerifiedAt: null // User must verify email first
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: emailVerificationToken
      });
      console.log('✅ [REGISTER] Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ [REGISTER] Failed to send verification email:', emailError.message);
      // Don't fail registration if email fails
    }

    res.status(201).json({ 
      message: 'Përdoruesi u krijua me sukses. Kontrollo email-in për verifikimin.',
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('🛑 [REGISTER] Gabim i plotë:', error);
    console.error('🛑 [REGISTER] Stack:', error.stack);
    res.status(500).json({ message: 'Gabim në server', error: error.message });
  }
});

// Verify email
app.get('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Token i verifikimit është i detyrueshëm' });
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token i verifikimit është i pavlefshëm' });
    }

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null // Clear the token
      }
    });

    console.log('✅ [VERIFY] Email verified for user:', user.email);

    res.json({ 
      message: 'Email-i u verifikua me sukses! Tani mund të hysh në llogarinë tënde.',
      verified: true
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Gabim në server' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email është i detyrueshëm' });
    }

    // Uniformizoj përgjigjen për sigurinë
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (user && user.emailVerifiedAt) {
      // Gjenero token për rivendosje
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 orë

      // Ruaj token-in në DB (përdor emailVerificationToken për tani)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: tokenHash + ':' + expiresAt.getTime()
        }
      });

      // Fire-and-forget: dërgo emailin në sfond pa pritur
      sendResetPasswordEmail({
        to: user.email,
        token: resetToken
      })
        .then(() => {
          console.log('✅ [FORGOT] Email reset u dërgua:', user.email);
        })
        .catch((emailErr) => {
          console.error('❌ [FORGOT] sendResetEmail:', emailErr);
        });
    }

    // Përgjigje uniforme për sigurinë
    res.status(200).json({
      message: 'Nëse email ekziston, është dërguar udhëzimi për rivendosje.'
    });

  } catch (error) {
    console.error('🛑 [FORGOT] Gabim:', error);
    res.status(500).json({ message: 'Gabim në server' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token dhe fjalëkalimi janë të detyrueshëm' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Gjej përdoruesin me këtë token
    const users = await prisma.user.findMany();
    const user = users.find(u => {
      if (!u.emailVerificationToken || !u.emailVerificationToken.includes(':')) return false;
      const [storedHash, expiry] = u.emailVerificationToken.split(':');
      return storedHash === tokenHash && parseInt(expiry) > Date.now();
    });

    if (!user) {
      return res.status(400).json({ message: 'Token i pavlefshëm ose ka skaduar' });
    }

    // Hash fjalëkalimin e ri
    const hashedPassword = await bcrypt.hash(password, 10);

    // Përditëso fjalëkalimin
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerificationToken: null
      }
    });

    console.log('✅ [RESET] Fjalëkalimi u rivendos për:', user.email);
    res.status(200).json({ message: 'Fjalëkalimi u rivendos me sukses' });

  } catch (error) {
    console.error('🛑 [RESET] Gabim:', error);
    res.status(500).json({ message: 'Gabim në server' });
  }
});

// Google Sign-In
app.post('/api/auth/google', async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(500).json({ message: 'GOOGLE_CLIENT_ID mungon në konfigurim.' });
    }

    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing credential' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = (payload?.email || '').toLowerCase();
    const emailVerified = !!payload?.email_verified;

    if (!emailVerified) {
      return res.status(400).json({ message: 'Google email nuk është verifikuar.' });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const randomPwd = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPwd, 10);
      
      user = await prisma.user.create({
        data: {
          name: payload?.name || email.split('@')[0],
          email,
          password: hashedPassword,
          emailVerifiedAt: new Date(),
        },
      });
    } else if (!user.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    console.log('✅ [GOOGLE] Login successful:', user.email);

    return res.json({
      message: 'Login me Google i suksesshëm',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('🛑 [GOOGLE] Gabim:', error?.stack || error);
    return res.status(401).json({ message: 'Verifikimi i Google dështoi.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dhe fjalëkalimi janë të detyrueshëm' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Kredencialet janë gabim' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Kredencialet janë gabim' });
    }

    // Check if email is verified
    if (!user.emailVerifiedAt) {
      return res.status(400).json({ 
        message: 'Email-i nuk është verifikuar. Kontrollo email-in për linkun e verifikimit.',
        needsVerification: true
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login i suksesshëm',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Gabim në server' });
  }
});

// Resend Email Verification
app.post('/api/auth/resend', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email është i detyrueshëm' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({ message: 'Përdoruesi nuk u gjet' });
    }

    // Check if already verified
    if (user.emailVerifiedAt) {
      return res.status(400).json({ message: 'Email-i është tashmë i verifikuar' });
    }

    // Generate new verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    const tokenWithExpiry = `${tokenHash}:${expiry}`;

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: tokenWithExpiry }
    });

    // Send verification email
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: rawToken
      });
      console.log('✅ [RESEND] Email verification u dërgua përsëri:', user.email);
    } catch (emailError) {
      console.error('❌ [RESEND] Email sending failed:', emailError);
      // Don't fail the request if email sending fails
    }

    res.json({ 
      message: 'Email verifikimi u dërgua përsëri. Kontrollo email-in.',
      ok: true 
    });

  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ message: 'Gabim në server' });
  }
});

// Get user transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token i detyrueshëm' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userId = decoded.userId;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    res.json(transactions);

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Gabim në server' });
  }
});

// Create transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token i detyrueshëm' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userId = decoded.userId;

    const { category, description, amount, type } = req.body;

    if (!category || !description || !amount || !type) {
      return res.status(400).json({ message: 'Të gjitha fushat janë të detyrueshme' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        category,
        description,
        amount: parseFloat(amount),
        type,
        userId
      }
    });

    res.status(201).json(transaction);

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Gabim në server' });
  }
});

// Change Password
app.patch('/api/users/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token i detyrueshëm' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userId = decoded.userId;

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Të gjitha fushat janë të detyrueshme' });
    }

    // Gjej përdoruesin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'Përdoruesi nuk u gjet' });
    }

    // Verifiko fjalëkalimin aktual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Fjalëkalimi aktual është gabim' });
    }

    // Hash fjalëkalimin e ri
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Përditëso fjalëkalimin
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    console.log('✅ [CHANGE_PASSWORD] Password updated for user:', user.email);
    res.json({ message: 'Fjalëkalimi u ndryshua me sukses' });

  } catch (error) {
    console.error('❌ [CHANGE_PASSWORD] Error:', error);
    res.status(500).json({ message: 'Gabim në server' });
  }
});

// Delete user account
app.delete('/api/users/me', async (req, res) => {
  try {
    console.log('🔍 [DELETE ACCOUNT] Request received');
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('🔍 [DELETE ACCOUNT] Token present:', !!token);
    
    if (!token) {
      console.log('❌ [DELETE ACCOUNT] No token provided');
      return res.status(401).json({ message: 'Token i detyrueshëm' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userId = decoded.userId;
    console.log('🔍 [DELETE ACCOUNT] User ID from token:', userId);

    const { password } = req.body;
    console.log('🔍 [DELETE ACCOUNT] Password provided:', !!password);

    if (!password) {
      console.log('❌ [DELETE ACCOUNT] No password provided');
      return res.status(400).json({ message: 'Fjalëkalimi është i detyrueshëm' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    console.log('🔍 [DELETE ACCOUNT] User found:', !!user);

    if (!user) {
      console.log('❌ [DELETE ACCOUNT] User not found');
      return res.status(404).json({ message: 'Përdoruesi nuk u gjet' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('🔍 [DELETE ACCOUNT] Password valid:', validPassword);

    if (!validPassword) {
      console.log('❌ [DELETE ACCOUNT] Invalid password');
      return res.status(400).json({ message: 'Fjalëkalimi është gabim' });
    }

    // Delete user and related data in transaction
    console.log('🔍 [DELETE ACCOUNT] Starting deletion process...');
    
    await prisma.$transaction(async (tx) => {
      // Delete transactions first
      console.log('🔍 [DELETE ACCOUNT] Deleting transactions...');
      await tx.transaction.deleteMany({
        where: { userId }
      });
      console.log('✅ [DELETE ACCOUNT] Transactions deleted');

      // Delete user
      console.log('🔍 [DELETE ACCOUNT] Deleting user...');
      await tx.user.delete({
        where: { id: userId }
      });
      console.log('✅ [DELETE ACCOUNT] User deleted');
    });

    console.log('✅ [DELETE ACCOUNT] Account deleted successfully');
    res.json({ message: 'Llogaria u fshi me sukses' });

  } catch (error) {
    console.error('❌ [DELETE ACCOUNT] Error:', error);
    res.status(500).json({ message: 'Gabim në server' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Gabim në server' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});