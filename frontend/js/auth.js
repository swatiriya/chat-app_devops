const API = 'http://localhost:5001/api';

// Tab switching
document.querySelectorAll('.tab').forEach((tab, i) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab + '-panel').classList.add('active');
    document.querySelector('.tab-indicator').classList.toggle('right', i === 1);
  });
});

// Show/hide password
function togglePw(id, btn) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.style.opacity = inp.type === 'text' ? '1' : '0.5';
}

// Password strength meter
function checkStrength(pw) {
  const fill  = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))          score++;
  if (/[0-9]/.test(pw))          score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  const levels = [
    { w: '0%',   c: 'transparent', t: '' },
    { w: '25%',  c: '#ef4444',     t: 'Weak' },
    { w: '50%',  c: '#f59e0b',     t: 'Fair' },
    { w: '75%',  c: '#3b82f6',     t: 'Good' },
    { w: '100%', c: '#22c55e',     t: 'Strong' },
  ];
  fill.style.width      = levels[score].w;
  fill.style.background = levels[score].c;
  label.textContent     = levels[score].t;
  label.style.color     = levels[score].c;
}

// Show alert message
function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className   = 'alert ' + type;
}

// Loading state on button
function setLoading(btn, loading) {
  btn.querySelector('span').style.opacity = loading ? '0' : '1';
  btn.querySelector('.spinner').classList.toggle('hidden', !loading);
  btn.disabled = loading;
}

// ---- LOGIN ----
document.getElementById('login-panel').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn      = document.getElementById('login-btn');
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) return showAlert('login-alert', 'Please fill in all fields.');

  setLoading(btn, true);
  try {
    const res  = await fetch(API + '/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem('nexchat_token', data.token);
    localStorage.setItem('nexchat_user',  JSON.stringify(data.user));
    showAlert('login-alert', 'Login successful! Redirecting...', 'success');
    setTimeout(() => window.location.href = 'pages/dashboard.html', 1000);
  } catch (err) {
    showAlert('login-alert', err.message);
  } finally {
    setLoading(btn, false);
  }
});

// ---- REGISTER ----
document.getElementById('register-panel').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn       = document.getElementById('register-btn');
  const firstname = document.getElementById('reg-firstname').value.trim();
  const lastname  = document.getElementById('reg-lastname').value.trim();
  const username  = document.getElementById('reg-username').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const password  = document.getElementById('reg-password').value;
  const confirm   = document.getElementById('reg-confirm').value;
  const terms     = document.getElementById('terms-check').checked;

  if (!firstname || !lastname || !username || !email || !password)
    return showAlert('register-alert', 'Please fill in all fields.');
  if (password !== confirm)
    return showAlert('register-alert', 'Passwords do not match.');
  if (password.length < 8)
    return showAlert('register-alert', 'Password must be at least 8 characters.');
  if (!terms)
    return showAlert('register-alert', 'Please accept the Terms of Service.');

  setLoading(btn, true);
  try {
    const res  = await fetch(API + '/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ firstname, lastname, username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    localStorage.setItem('nexchat_token', data.token);
    localStorage.setItem('nexchat_user',  JSON.stringify(data.user));
    showAlert('register-alert', 'Account created! Taking you to chat...', 'success');
    setTimeout(() => window.location.href = 'pages/dashboard.html', 1200);
  } catch (err) {
    showAlert('register-alert', err.message);
  } finally {
    setLoading(btn, false);
  }
});

// Redirect if already logged in
if (localStorage.getItem('nexchat_token')) {
  window.location.href = 'pages/dashboard.html';
}