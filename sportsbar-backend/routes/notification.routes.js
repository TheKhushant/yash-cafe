const express = require('express');
const { Notification } = require('../models/Notification');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const notifications = await Notification.find({ venueId: req.user.venueId });
  res.json(notifications);
});

router.post('/', authenticate, async (req, res) => {
  const notification = await Notification.create({
    ...req.body,
    venueId: req.user.venueId
  });
  res.status(201).json(notification);
});

module.exports = router;
