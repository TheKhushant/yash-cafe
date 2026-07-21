// backend/controllers/platformUser.controller.js
const User = require("../models/User");

const getPlatformUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ['admin', 'super_admin'] }
    }).select('-password -__v');

    const formattedUsers = users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        venueId: u.venueId,
        joinedAt: u.createdAt,
        status: u.isActive ? "Active" : "Blocked",
    }));

    res.json({
        success: true,
        users: formattedUsers,
    });
  } catch (error) {
    console.error("Platform Users Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch platform users'
    });
  }
};

const createPlatformUser = async (req, res) => {
  try {
    const { name, email, role, password = "TempPass123!" } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: "Name, email and role are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      isActive: true,
      venueId: null
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        joinedAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Create Platform User Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePlatformUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: status === 'Active' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlatformUsers,
  createPlatformUser,
  updatePlatformUserStatus
};