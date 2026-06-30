const express = require('express');
const { getStats, getActivity } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.get('/stats', authenticate, getStats);
router.get('/activity', authenticate, getActivity);

module.exports = router;
