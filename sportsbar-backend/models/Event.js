const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  title: { type: String, required: true },
  description: String,
  bannerImage: String,
  date: { type: Date, required: true },
  ticketPrice: { type: Number, required: true },
  capacity: { type: Number, required: true },
  attendance: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Draft', 'Published', 'Cancelled'], 
    default: 'Draft' 
  }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
module.exports = { Event };
