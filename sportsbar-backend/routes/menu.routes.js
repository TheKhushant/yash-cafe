const express = require('express');
const { 
  getMenu, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem 
} = require('../controllers/menu.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, getMenu);
router.post('/', authenticate, authorizeRoles('admin'), createMenuItem);
router.patch('/:id', authenticate, authorizeRoles('admin'), updateMenuItem);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteMenuItem);

module.exports = router;
