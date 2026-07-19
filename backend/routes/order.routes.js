const express = require('express');
const { getOrders, updateOrderStatus } = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, getOrders);
router.patch('/:id/status', authenticate, updateOrderStatus);

module.exports = router;
