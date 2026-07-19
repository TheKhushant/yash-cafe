const express = require('express');
const { scanQR } = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/scan', authenticate, scanQR);

module.exports = router;
