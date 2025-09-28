const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
require('dotenv').config();

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

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        emailVerifiedAt: new Date() // Skip email verification for now
      }
    });

    res.status(201).json({ 
      message: 'Përdoruesi u krijua me sukses',
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Gabim në server' });
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