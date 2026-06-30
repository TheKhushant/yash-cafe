const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const dns = require('dns');

dns.setServers([
    '0.0.0.0',
    '1.1.1.1'
])
dotenv.config();

console.log("JWT_SECRET =", process.env.JWT_SECRET);
console.log("JWT_EXPIRES_IN =", process.env.JWT_EXPIRES_IN);
console.log("typeof =", typeof process.env.JWT_EXPIRES_IN);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Error Handling
app.use(errorHandler);

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinVenue', (venueId) => {
    socket.join(`venue-${venueId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io ready`);
  });
};

startServer();