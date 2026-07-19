const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  latitude: Number,
  longitude: Number,
  capacity: { type: Number, default: 100 },
  sports: [{ type: String }],
  photos: [{ type: String }],
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Venue = mongoose.model('Venue', venueSchema);
module.exports = { Venue };
