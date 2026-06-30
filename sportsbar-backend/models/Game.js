const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  title: String,
  league: String,
  schedule: Date,
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);
module.exports = { Game };
