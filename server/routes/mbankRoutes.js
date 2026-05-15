const express = require('express');
const router = express.Router();
const { handleMBank } = require('../controllers/mbankController');

// MBank sends XML as text/xml or application/xml
router.post('/', express.text({ type: ['text/xml', 'application/xml', 'text/plain'] }), handleMBank);

module.exports = router;
