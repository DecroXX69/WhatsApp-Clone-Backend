const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
  });
  
  socket.on('typing', ({ wa_id, typing }) => {
    socket.to(wa_id).emit('user-typing', { wa_id, typing });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io);

// Test basic routes first
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Try loading routes one by one to isolate the issue
try {
  console.log('Loading chats route...');
  const chatsRouter = require('./routes/chats');
  app.use('/api/chats', chatsRouter);
  console.log('✅ Chats route loaded');
} catch (error) {
  console.error('❌ Error loading chats route:', error.message);
}

try {
  console.log('Loading messages route...');
  const messagesRouter = require('./routes/messages');
  app.use('/api/messages', messagesRouter);
  console.log('✅ Messages route loaded');
} catch (error) {
  console.error('❌ Error loading messages route:', error.message);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
