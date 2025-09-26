const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/authMiddleware');
const {
  getUserTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactionsAsPDF,
} = require('../controllers/transactionController');

// --------------------------------------
// 📦 Rrugë të mbrojtura për transaksionet
// --------------------------------------

/**
 * @route   GET /api/transactions
 * @desc    Merr të gjitha transaksionet e përdoruesit të kyçur
 * @access  Private
 */
router.get('/', requireAuth, getUserTransactions);

/**
 * @route   POST /api/transactions
 * @desc    Krijon një transaksion të ri
 * @access  Private
 */
router.post('/', requireAuth, createTransaction);

/**
 * @route   PATCH /api/transactions/:id
 * @desc    Përditëson një transaksion ekzistues
 * @access  Private
 */
router.patch('/:id', requireAuth, updateTransaction);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Fshin një transaksion sipas ID-së
 * @access  Private
 */
router.delete('/:id', requireAuth, deleteTransaction);

/**
 * @route   GET /api/transactions/export/pdf
 * @desc    Eksporton transaksionet në format PDF
 * @access  Private
 */
router.get('/export/pdf', requireAuth, exportTransactionsAsPDF);

module.exports = router;
