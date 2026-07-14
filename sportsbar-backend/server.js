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
]);

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ✅ Allowed Origins
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:8082',
  'https://yash-cafe-one.vercel.app'
];

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Middleware
app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, Thunder Client, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    time: new Date(),
  });
});

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
    console.log('📡 Socket.io ready');
  });
};

startServer();