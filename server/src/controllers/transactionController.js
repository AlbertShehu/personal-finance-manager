const prisma = require('../lib/prisma');
const PDFDocument = require('pdfkit');

/**
 * 📥 Merr të gjitha transaksionet e përdoruesit
 * @route   GET /api/transactions
 * @access  Private
 */
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    res.json(transactions);
  } catch (error) {
    console.error('🛑 Gabim gjatë marrjes së transaksioneve:', error);
    res.status(500).json({
      error: 'Gabim gjatë marrjes së transaksioneve',
      details: error.message,
    });
  }
};

/**
 * ➕ Krijon një transaksion të ri
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = async (req, res) => {
  try {
    const { category, description, amount, type, date } = req.body;
    const userId = req.user.id;

    if (!amount || !type || !category) {
      return res.status(400).json({ error: 'Të dhënat kryesore mungojnë.' });
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({ error: 'Lloji i transaksionit është i pavlefshëm.' });
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        category,
        description,
        amount,
        type,
        date: date ? new Date(date) : new Date(),
        userId,
      },
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('🛑 Gabim gjatë krijimit të transaksionit:', error);
    res.status(500).json({
      error: 'Gabim gjatë krijimit të transaksionit',
      details: error.message,
    });
  }
};

/**
 * 📝 Përditëson një transaksion ekzistues
 * @route   PATCH /api/transactions/:id
 * @access  Private
 */
const updateTransaction = async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    const { amount, type, category, description, date } = req.body;
    const userId = req.user.id;

    if (!transactionId || isNaN(transactionId)) {
      return res.status(400).json({ error: 'ID e transaksionit është e pavlefshme.' });
    }

    const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });

    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ error: 'Nuk keni qasje në këtë transaksion.' });
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...(amount !== undefined && { amount }),
        ...(type && { type }),
        ...(category && { category }),
        ...(description && { description }),
        ...(date && { date: new Date(date) }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('🛑 Gabim gjatë përditësimit:', error);
    res.status(500).json({
      error: 'Gabim gjatë përditësimit të transaksionit',
      details: error.message,
    });
  }
};

/**
 * ❌ Fshin një transaksion sipas ID-së
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
const deleteTransaction = async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    const userId = req.user.id;

    if (!transactionId || isNaN(transactionId)) {
      return res.status(400).json({ error: 'ID e pavlefshme për fshirje.' });
    }

    const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });

    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ error: 'Nuk keni të drejtë të fshini këtë transaksion.' });
    }

    await prisma.transaction.delete({ where: { id: transactionId } });

    res.json({ message: 'Transaksioni u fshi me sukses.' });
  } catch (error) {
    console.error('🛑 Gabim gjatë fshirjes:', error);
    res.status(500).json({
      error: 'Gabim gjatë fshirjes së transaksionit',
      details: error.message,
    });
  }
};

/**
 * 📄 Eksporton transaksionet si PDF
 * @route   GET /api/transactions/export/pdf
 * @access  Private
 */
const exportTransactionsAsPDF = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=transactions.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('🧾 Transaksionet Financiare', { align: 'center' });
    doc.moveDown();

    transactions.forEach((tx) => {
      doc
        .fontSize(12)
        .text(`📅 Data: ${new Date(tx.date).toLocaleDateString()}`)
        .text(`💰 Shuma: ${tx.amount}`)
        .text(`🔸 Lloji: ${tx.type}`)
        .text(`🏷️ Kategoria: ${tx.category}`)
        .text(`🗒️ Përshkrimi: ${tx.description || '—'}`)
        .moveDown();
    });

    doc.end();
  } catch (error) {
    console.error('🛑 Gabim gjatë krijimit të PDF:', error);
    res.status(500).json({
      error: 'Gabim gjatë eksportit të PDF',
      details: error.message,
    });
  }
};

module.exports = {
  getUserTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactionsAsPDF,
};
