const { Event } = require('../models/Event');

const getEvents = async (req, res) => {
  try {
    const venueId = req.query.venueId || req.user.venueId;
    const events = await Event.find(venueId ? { venue: venueId } : {})
      .sort({ date: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createEvent = async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      venue: req.user.venueId
    });

    res.status(201).json(event);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(event);
  } catch (error) {
      console.error(error);

      res.status(500).json({
          message: error.message,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      });
  }
};

const deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
