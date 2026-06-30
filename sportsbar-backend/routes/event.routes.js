const express = require('express');
const { 
  getEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} = require('../controllers/event.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, getEvents);
router.post('/', authenticate, authorizeRoles('admin'), createEvent);
router.patch('/:id', authenticate, authorizeRoles('admin'), updateEvent);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteEvent);

module.exports = router;
