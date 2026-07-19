const { Order } = require('../models/Order');
const { Event } = require('../models/Event');
const { MenuItem } = require('../models/MenuItem');

const getStats = async (req, res) => {
  try {
    const venueId = req.user.role === 'super_admin' ? null : req.user.venueId;

    const [orders, events, menu] = await Promise.all([
      Order.find(venueId ? { venueId } : {}),
      Event.find(venueId ? { venue: venueId } : {}),
      MenuItem.find(venueId ? { venueId } : {})
    ]);

    const revenue = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const inventoryAlerts = menu.filter(m => m.outOfStock || m.stock <= 5).length;

    res.json({
      revenue,
      revenueChange: 12.4,
      orders: orders.length,
      ordersChange: 8.1,
      activeEvents: events.filter(e => e.status === 'Published').length,
      users: 245,
      usersChange: 5.3,
      inventoryAlerts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getActivity = async (req, res) => {
  try {
    const venueId = req.user.venueId;
    const orders = await Order.find({ venueId })
      .sort({ createdAt: -1 })
      .limit(6);

    const activity = orders.map(order => ({
      id: order._id,
      icon: order.status === 'Cancelled' ? 'x' : 'receipt',
      text: `Order ${order._id} • ${order.customerName} • ${order.status}`,
      time: new Date(order.createdAt).toISOString()
    }));

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats, getActivity };
