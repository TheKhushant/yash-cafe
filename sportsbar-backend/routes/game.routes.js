const express = require('express');
const { Game } = require('../models/Game');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const games = await Game.find({ venueId: req.user.venueId });
  res.json(games);
});

router.post('/', authenticate, authorizeRoles('admin'), async (req, res) => {
  const game = await Game.create({ ...req.body, venueId: req.user.venueId });
  res.status(201).json(game);
});

module.exports = router;
