const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 50 },
  outOfStock: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  description: String
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
module.exports = { MenuItem };
