const express = require('express');
const { login, getMe, register } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getMe);

module.exports = router;
