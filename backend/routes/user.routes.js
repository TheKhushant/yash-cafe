// backend/routes/user.routes.js
const express = require("express");
const { authenticate } = require("../middlewares/auth"); // ← Add this
const { getUsers } = require("../controllers/user.controller");

const router = express.Router();

router.use(authenticate);           // ← Protect this route
router.get("/", getUsers);

module.exports = router;