// backend/routes/platformUser.routes.js
const express = require("express");
const { authenticate, authorizeRoles } = require("../middlewares/auth");
const {
  getPlatformUsers,
  createPlatformUser,
  updatePlatformUserStatus,
} = require("../controllers/platformUser.controller");

const router = express.Router();

// Only super_admin can access these routes
router.use(authenticate);
router.use(authorizeRoles('super_admin'));

router.get("/", getPlatformUsers);
router.post("/", createPlatformUser);
router.patch("/:id/status", updatePlatformUserStatus);

module.exports = router;