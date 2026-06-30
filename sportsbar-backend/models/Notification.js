const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
  type: { type: String, enum: ['Announcement', 'Match Reminder', 'Order Ready'] },
  title: String,
  message: String,
  audience: String,
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = { Notification };
