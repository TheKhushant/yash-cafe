// backend/controllers/user.controller.js
const User = require("../models/User");

const getUsers = async (req, res) => {
  try {
    const venueId = req.user?.venueId; // from auth middleware

    // Only fetch regular customers (role: "user")
    const filter = { role: "user" };

    // If venue admin, show only their venue's users
    if (venueId) {
      filter.venueId = venueId;
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getUsers,
};