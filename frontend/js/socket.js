// This file handles real-time messaging using Socket.IO
// It runs AFTER dashboard.js loads

const token = localStorage.getItem('nexchat_token');
let socket;

try {
  // Connect to your backend server
  socket = io('http://localhost:5001', {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Connected to server for real-time chat');
    document.getElementById('online-status').textContent = 'Online';
  });

  socket.on('disconnect', () => {
    document.getElementById('online-status').textContent = 'Reconnecting...';
  });

  // When you RECEIVE a message from someone
  socket.on('message:receive', (data) => {
    // Only show if this message is from the person you currently have open
    const currentRecipient = window.currentRecipientId;
    if (data.senderId === currentRecipient && window.appendMessage) {
      window.appendMessage(data.content, 'received', data.time);
    }
    hideTyping();
  });

  // Typing indicator
  socket.on('user:typing', () => { showTyping(); });
  socket.on('user:stop-typing', () => { hideTyping(); });

  // Send a message through the socket
  window.socketSend = function(content, recipientId) {
    if (socket && socket.connected) {
      socket.emit('message:send', { recipientId, content });
    }
  };

  // Emit typing events as user types
  let typingTimeout;
  const input = document.getElementById('message-input');
  if (input) {
    input.addEventListener('input', () => {
      if (socket && window.currentRecipientId) {
        socket.emit('user:typing', { recipientId: window.currentRecipientId });
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          socket.emit('user:stop-typing', { recipientId: window.currentRecipientId });
        }, 1500);
      }
    });
  }

} catch (err) {
  console.warn('Socket.IO not connected. Running in offline mode.', err);
}

function showTyping() {
  const el = document.getElementById('typing-text');
  const st = document.getElementById('online-status');
  if (el) el.classList.remove('hidden');
  if (st) st.style.display = 'none';
}

function hideTyping() {
  const el = document.getElementById('typing-text');
  const st = document.getElementById('online-status');
  if (el) el.classList.add('hidden');
  if (st) st.style.display = '';
}