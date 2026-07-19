const { Booking } = require('../models/Booking');

const scanQR = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const booking = await Booking.findOne({ qrCode }).populate('user');

    if (!booking) {
      return res.status(404).json({ ok: false, reason: "Invalid QR Code" });
    }

    if (booking.bookingStatus === 'CheckedIn') {
      return res.status(400).json({ ok: false, reason: "Already Checked In" });
    }

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ ok: false, reason: "Booking Cancelled" });
    }

    booking.bookingStatus = 'CheckedIn';
    booking.scannedAt = new Date();
    booking.scannedBy = req.user.name;
    await booking.save();

    res.json({
      ok: true,
      booking: {
        customerName: booking.user?.name || "Guest",
        eventTitle: "Live Match",
        tableNumber: booking.tableNumber
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, reason: "Scan failed" });
  }
};

module.exports = { scanQR };
