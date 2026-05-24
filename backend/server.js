require('dotenv').config();  // Load .env file first

const express   = require('express');
const http      = require('http');
const cors      = require('cors');
const { Server } = require('socket.io');

const connectDB             = require('./config/db');
const authRoutes            = require('./routes/auth');
const messageRoutes         = require('./routes/messages');
const userRoutes            = require('./routes/users');
const { authenticateSocket } = require('./middleware/auth');

const app    = express();
const server = http.createServer(app);

// ── 1. Connect to MongoDB ──────────────────────────────────
connectDB();

// ── 2. Middleware ──────────────────────────────────────────
app.use(cors({ origin: '*' }));          // Allow requests from your frontend
app.use(express.json());                  // Parse JSON request bodies

// ── 3. API Routes ──────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users',    userRoutes);

// Health check — visit http://localhost:5001/api/health to confirm server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── 4. Socket.IO (real-time chat) ──────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Track which users are online: userId -> socketId
const onlineUsers = new Map();

// Check JWT before allowing socket connection
io.use(authenticateSocket);

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  onlineUsers.set(userId, socket.id);
  console.log('🟢 ' + socket.user.username + ' connected');

  // Someone sends a message
  socket.on('message:send', ({ recipientId, content }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) {
      // Send message instantly to the recipient if they are online
      io.to(recipientSocketId).emit('message:receive', {
        content,
        senderId:  userId,
        senderName: socket.user.firstname + ' ' + socket.user.lastname,
        time:       new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  });

  // Typing indicators
  socket.on('user:typing', ({ recipientId }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) io.to(recipientSocketId).emit('user:typing');
  });

  socket.on('user:stop-typing', ({ recipientId }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) io.to(recipientSocketId).emit('user:stop-typing');
  });

  // User disconnects
  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    console.log('🔴 ' + socket.user.username + ' disconnected');
  });
});

// ── 5. Start Server ────────────────────────────────────────
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log('🚀 Server running at http://localhost:' + PORT);
});