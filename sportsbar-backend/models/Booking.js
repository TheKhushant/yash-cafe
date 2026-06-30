const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  tableNumber: String,
  totalAmount: Number,
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  bookingStatus: { 
    type: String, 
    enum: ['Confirmed', 'Cancelled', 'CheckedIn', 'Expired'],
    default: 'Confirmed' 
  },
  qrCode: String,
  scannedAt: Date,
  scannedBy: String
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = { Booking };
