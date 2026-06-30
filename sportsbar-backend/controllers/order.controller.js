const { Order } = require('../models/Order');

const getOrders = async (req, res) => {
  try {
    const venueId = req.user.venueId;
    const orders = await Order.find({ venueId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getOrders, updateOrderStatus };
