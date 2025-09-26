// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token mungon ose është i pasaktë' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.split('.').length !== 3) {
      return res.status(401).json({ message: 'Token i dëmtuar ose jo i vlefshëm' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET mungon në .env');
      return res.status(500).json({ message: 'Konfigurim i brendshëm mungon' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Token i pavlefshëm' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role || 'user',
    };

    next();
  } catch (err) {
    console.error('🛑 Gabim gjatë verifikimit të tokenit:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token ka skaduar' });
    }
    return res.status(401).json({ message: 'Autentikim i pasuksesshëm' });
  }
};

module.exports = requireAuth;
