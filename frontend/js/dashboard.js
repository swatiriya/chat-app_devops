const API   = 'http://localhost:5001/api';
const token = localStorage.getItem('nexchat_token');
const user  = JSON.parse(localStorage.getItem('nexchat_user') || '{}');

// Guard — if not logged in, send back to login
if (!token) window.location.href = '../index.html';

// Show logged-in user's name and initials
document.getElementById('my-name').textContent =
  user.firstname ? user.firstname + ' ' + user.lastname : 'You';
if (user.firstname && user.lastname) {
  document.getElementById('my-avatar').textContent =
    (user.firstname[0] + user.lastname[0]).toUpperCase();
}

// Track current chat
let currentRecipientId   = null;
let currentRecipientName = null;

// Mobile sidebar toggle
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Auto-resize textarea as user types
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// Send on Enter key (Shift+Enter = new line)
function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ---- Load all users to show as contacts ----
async function loadUsers() {
  try {
    const res   = await fetch(API + '/users', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data  = await res.json();
    renderContacts(data.users || []);
  } catch (err) {
    console.error('Could not load users:', err);
  }
}

function renderContacts(users) {
  const list = document.getElementById('contacts-list');
  list.innerHTML = '';

  if (users.length === 0) {
    list.innerHTML = '<p style="padding:1rem;color:var(--text-dim);font-size:0.8rem">No other users yet. Register another account to chat!</p>';
    return;
  }

  users.forEach(u => {
    const initials = (u.firstname[0] + u.lastname[0]).toUpperCase();
    const colors   = ['#6366f1','#0ea5e9','#22c55e','#f59e0b','#ef4444','#8b5cf6'];
    const color    = colors[Math.floor(Math.random() * colors.length)];

    const item = document.createElement('div');
    item.className   = 'contact-item';
    item.dataset.id  = u._id;
    item.dataset.name = u.firstname + ' ' + u.lastname;
    item.innerHTML   = `
      <div class="avatar" style="--c:${color}">${initials}</div>
      <div class="contact-info">
        <span class="contact-name">${u.firstname} ${u.lastname}</span>
        <span class="contact-preview">@${u.username}</span>
      </div>`;

    item.addEventListener('click', () => {
      document.querySelectorAll('.contact-item').forEach(c => c.classList.remove('active'));
      item.classList.add('active');
      openChat(u._id, u.firstname + ' ' + u.lastname, initials, color);
      document.getElementById('sidebar').classList.remove('open');
    });

    list.appendChild(item);
  });
}

// ---- Open a conversation ----
async function openChat(recipientId, name, initials, color) {
  currentRecipientId   = recipientId;
  currentRecipientName = name;

  document.getElementById('peer-name').textContent   = name;
  document.getElementById('peer-avatar').textContent = initials;
  document.getElementById('peer-avatar').style.setProperty('--c', color);
  document.getElementById('online-status').textContent = 'Online';

  const area = document.getElementById('messages-area');
  area.innerHTML = '<div class="date-divider"><span>Today</span></div>';

  document.getElementById('empty-state')?.remove();

  // Load message history
  try {
    const res  = await fetch(API + '/messages/' + recipientId, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.messages) {
      data.messages.forEach(msg => appendMessage(msg.content, msg.sender._id === user._id ? 'sent' : 'received', formatTime(msg.createdAt)));
    }
  } catch (err) {
    console.error('Failed to load messages:', err);
  }

  area.scrollTop = area.scrollHeight;
}

// ---- Send a message ----
async function sendMessage() {
  const input = document.getElementById('message-input');
  const text  = input.value.trim();
  if (!text || !currentRecipientId) return;

  // Show message instantly in UI
  appendMessage(text, 'sent', formatTime(new Date()));
  input.value = '';
  input.style.height = 'auto';

  // Emit via Socket.IO (real-time)
  if (window.socketSend) window.socketSend(text, currentRecipientId);

  // Also save to database via REST
  try {
    await fetch(API + '/messages', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ recipientId: currentRecipientId, content: text })
    });
  } catch (err) {
    console.error('Failed to save message:', err);
  }
}

// ---- Add a message bubble to the chat ----
function appendMessage(text, type, time) {
  const area = document.getElementById('messages-area');

  // Remove empty state if present
  const empty = document.getElementById('empty-state');
  if (empty) empty.remove();

  const msg = document.createElement('div');
  msg.className = 'message ' + type;
  msg.innerHTML = `
    <div class="msg-body">
      <div class="bubble">${escapeHtml(text)}</div>
      <span class="msg-time">${time}</span>
    </div>`;
  area.appendChild(msg);
  area.scrollTop = area.scrollHeight;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---- Logout ----
function logout() {
  localStorage.removeItem('nexchat_token');
  localStorage.removeItem('nexchat_user');
  window.location.href = '../index.html';
}

// ---- Expose appendMessage for socket.js to call ----
window.appendMessage = appendMessage;

// ---- Start ----
loadUsers();