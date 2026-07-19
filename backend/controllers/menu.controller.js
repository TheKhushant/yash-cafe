const { MenuItem } = require('../models/MenuItem');

const getMenu = async (req, res) => {
  try {
    const venueId = req.query.venueId || req.user.venueId;
    const items = await MenuItem.find(venueId ? { venueId } : {});
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.create({
      ...req.body,
      venueId: req.user.venueId
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMenu, createMenuItem, updateMenuItem, deleteMenuItem };
