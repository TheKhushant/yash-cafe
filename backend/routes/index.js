const express = require('express');
const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');
const eventRoutes = require('./event.routes');
const menuRoutes = require('./menu.routes');
const orderRoutes = require('./order.routes');
const bookingRoutes = require('./booking.routes');
const gameRoutes = require('./game.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/events', eventRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/bookings', bookingRoutes);
router.use('/games', gameRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
