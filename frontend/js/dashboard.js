const API = `${window.location.protocol}//${window.location.hostname}:5001/api`;
// const token = localStorage.getItem('nexchat_token');
const user = JSON.parse(
    localStorage.getItem('nexchat_user') || '{}'
);
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');
const messageInput = document.getElementById('message-input');

if (emojiBtn && emojiPicker) {

    emojiBtn.addEventListener('click', () => {
        emojiPicker.classList.toggle('hidden');
    });

    emojiPicker.addEventListener('emoji-click', event => {

        messageInput.value += event.detail.unicode;

        messageInput.focus();

    });

}

if (!token) {
    window.location.href = '../index.html';
}

/* -------------------------
   USER INFO
-------------------------- */

const myName = document.getElementById('my-name');
const myAvatar = document.getElementById('my-avatar');

if (myName) {
    myName.textContent =
        user.firstname && user.lastname
            ? `${user.firstname} ${user.lastname}`
            : 'You';
}

if (myAvatar && user.firstname && user.lastname) {
    myAvatar.textContent =
        (
            user.firstname[0] +
            user.lastname[0]
        ).toUpperCase();
}

/* -------------------------
   GLOBALS
-------------------------- */

let currentRecipientId = null;
let currentRecipientName = null;

window.currentRecipientId = null;

let groups = [];

let darkMode =
    localStorage.getItem('theme') !== 'light';

/* -------------------------
   THEME
-------------------------- */

function initTheme() {

    document.body.classList.toggle(
        'light-mode',
        !darkMode
    );

    const btn =
        document.getElementById(
            'theme-toggle'
        );

    if (!btn) return;

    btn.textContent =
        darkMode ? '☀️' : '🌙';

    btn.addEventListener('click', () => {

        darkMode = !darkMode;

        document.body.classList.toggle(
            'light-mode',
            !darkMode
        );

        btn.textContent =
            darkMode ? '☀️' : '🌙';

        localStorage.setItem(
            'theme',
            darkMode
                ? 'dark'
                : 'light'
        );

    });
}

/* -------------------------
   MOBILE SIDEBAR
-------------------------- */

const menuBtn =
    document.getElementById(
        'menu-toggle'
    );

if (menuBtn) {

    menuBtn.addEventListener(
        'click',
        () => {

            document
                .getElementById('sidebar')
                .classList.toggle('open');

        }
    );

}

/* -------------------------
   TEXTAREA
-------------------------- */

function autoResize(el) {

    el.style.height = 'auto';

    el.style.height =
        Math.min(
            el.scrollHeight,
            120
        ) + 'px';

}

window.autoResize = autoResize;

function handleKeydown(e) {

    if (
        e.key === 'Enter' &&
        !e.shiftKey
    ) {

        e.preventDefault();

        sendMessage();

    }

}
document
.getElementById('add-member-btn')
.addEventListener(
'click',
async () => {

    const userId =
        prompt(
            'Enter user id'
        );

    if(!userId) return;

    await fetch(
        `http://localhost:5001/api/groups/${currentGroupId}/add-member`,
        {
            method:'PUT',
            headers:{
                'Content-Type':
                'application/json',
                Authorization:
                'Bearer ' +
                localStorage.getItem(
                    'nexchat_token'
                )
            },
            body: JSON.stringify({
                userId
            })
        }
    );

});

window.handleKeydown =
    handleKeydown;

/* -------------------------
   USERS
-------------------------- */

async function loadUsers() {

    try {

        const res =
            await fetch(
                API + '/users',
                {
                    headers: {
                        Authorization:
                            'Bearer ' +
                            token
                    }
                }
            );

        const data =
            await res.json();

        const users =
            data.users || [];

        renderContacts(users);

        updateStats(users);

    } catch (err) {

        console.error(
            'Load users error',
            err
        );

    }

}

function renderContacts(users) {

    const list =
        document.getElementById(
            'contacts-list'
        );

    if (!list) return;

    list.innerHTML = '';

    users.forEach(u => {

        const initials =
            (
                u.firstname[0] +
                u.lastname[0]
            ).toUpperCase();

        const div =
            document.createElement(
                'div'
            );

        div.className =
            'contact-item';

        div.innerHTML = `
            <div class="avatar">
                ${initials}
            </div>

            <div class="contact-info">
                <span class="contact-name">
                    ${u.firstname} ${u.lastname}
                </span>

                <span class="contact-preview">
                    @${u.username}
                </span>
            </div>
        `;

        div.onclick = () => {

            document
                .querySelectorAll(
                    '.contact-item'
                )
                .forEach(x =>
                    x.classList.remove(
                        'active'
                    )
                );

            div.classList.add(
                'active'
            );

            openChat(
                u._id,
                `${u.firstname} ${u.lastname}`,
                initials
            );

        };

        list.appendChild(div);

    });

}

/* -------------------------
   CHAT
-------------------------- */

async function openChat(
    recipientId,
    name,
    initials
) {

    currentRecipientId =
        recipientId;

    window.currentRecipientId =
        recipientId;

    currentRecipientName =
        name;

    document.getElementById(
        'peer-name'
    ).textContent = name;

    document.getElementById(
        'peer-avatar'
    ).textContent = initials;

    document.getElementById(
        'online-status'
    ).textContent = 'Online';

    const area =
        document.getElementById(
            'messages-area'
        );

    area.innerHTML = '';

    try {

        const res =
            await fetch(
                API +
                '/messages/' +
                recipientId,
                {
                    headers: {
                        Authorization:
                            'Bearer ' +
                            token
                    }
                }
            );

        const data =
            await res.json();

        if (data.messages) {

            data.messages.forEach(
                msg => {

                    appendMessage(
                        msg.content,
                        msg.sender._id ===
                        user._id
                            ? 'sent'
                            : 'received',
                        formatTime(
                            msg.createdAt
                        )
                    );

                }
            );

        }

    } catch (err) {

        console.error(err);

    }

}

/* -------------------------
   SEND MESSAGE
-------------------------- */

async function sendMessage() {

    const input =
        document.getElementById(
            'message-input'
        );

    const text =
        input.value.trim();

    if (
        !text ||
        !currentRecipientId
    )
        return;

    appendMessage(
        text,
        'sent',
        formatTime(
            new Date()
        )
    );

    input.value = '';
    input.style.height = 'auto';

    if (
        window.socketSend
    ) {

        window.socketSend(
            text,
            currentRecipientId
        );

    }

    try {

        await fetch(
            API +
            '/messages',
            {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/json',
                    Authorization:
                        'Bearer ' +
                        token
                },
                body:
                    JSON.stringify({
                        recipientId:
                            currentRecipientId,
                        content:
                            text
                    })
            }
        );

    } catch (err) {

        console.error(err);

    }

}

window.sendMessage =
    sendMessage;

/* -------------------------
   APPEND MESSAGE
-------------------------- */

function appendMessage(
    text,
    type,
    time
) {

    const area =
        document.getElementById(
            'messages-area'
        );

    const msg =
        document.createElement(
            'div'
        );

    msg.className =
        `message ${type}`;

    msg.innerHTML = `
        <div class="msg-body">
            <div class="bubble">
                ${escapeHtml(text)}
            </div>

            <div class="msg-time">
                ${time}
            </div>
        </div>
    `;

    area.appendChild(msg);

    area.scrollTop =
        area.scrollHeight;

}

window.appendMessage =
    appendMessage;

/* -------------------------
   GROUPS
-------------------------- */

function loadGroups() {

    const list =
        document.getElementById(
            'group-list'
        );

    if (!list) return;

    list.innerHTML = '';

    groups.forEach(g => {

        const div =
            document.createElement(
                'div'
            );

        div.className =
            'contact-item';

        div.innerHTML = `
            <div class="avatar">
                👥
            </div>

            <div class="contact-info">
                <span class="contact-name">
                    ${g.name}
                </span>
            </div>
        `;

        list.appendChild(div);

    });

}

function initGroups() {

    const createBtn =
        document.getElementById(
            'create-group-btn'
        );

    const saveBtn =
        document.getElementById(
            'save-group'
        );

    if (createBtn) {

        createBtn.onclick =
            () => {

                document
                    .getElementById(
                        'group-modal'
                    )
                    .classList.remove(
                        'hidden'
                    );

            };

    }

    if (saveBtn) {

        saveBtn.onclick =
            () => {

                const name =
                    document
                        .getElementById(
                            'group-name'
                        )
                        .value
                        .trim();

                if (!name)
                    return;

                groups.push({
                    id:
                        Date.now(),
                    name
                });

                loadGroups();

                updateStats();

                document
                    .getElementById(
                        'group-modal'
                    )
                    .classList.add(
                        'hidden'
                    );

            };

    }

}

/* -------------------------
   STATS
-------------------------- */

function updateStats(
    users = []
) {

    const chats =
        document.getElementById(
            'totalChats'
        );

    const online =
        document.getElementById(
            'onlineUsers'
        );

    const groupCount =
        document.getElementById(
            'groupCount'
        );

    if (chats)
        chats.textContent =
            users.length;

    if (online)
        online.textContent =
            users.length;

    if (groupCount)
        groupCount.textContent =
            groups.length;

}

/* -------------------------
   HELPERS
-------------------------- */

function escapeHtml(str) {

    return String(str)
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        );

}

function formatTime(
    dateStr
) {

    const d =
        new Date(dateStr);

    return d.toLocaleTimeString(
        [],
        {
            hour: '2-digit',
            minute: '2-digit'
        }
    );

}

function logout() {

    localStorage.removeItem(
        'nexchat_token'
    );

    localStorage.removeItem(
        'nexchat_user'
    );

    window.location.href =
        '../index.html';

}

window.logout = logout;

/* ==========================
   FILE UPLOAD
========================== */

const uploadBtn =
    document.getElementById(
        'upload-btn'
    );

const fileInput =
    document.getElementById(
        'file-input'
    );

if (uploadBtn && fileInput) {

    uploadBtn.addEventListener(
        'click',
        () => {
            fileInput.click();
        }
    );

    fileInput.addEventListener(
        'change',
        async function () {

            const file =
                this.files[0];

            if (!file) return;

            const formData =
                new FormData();

            formData.append(
                'file',
                file
            );

            try {

                const response =
                    await fetch(
                        'http://localhost:5001/api/upload',
                        {
                            method: 'POST',
                            headers: {
                                Authorization:
                                    'Bearer ' +
                                    localStorage.getItem(
                                        'nexchat_token'
                                    )
                            },
                            body: formData
                        }
                    );

                const data =
                    await response.json();

                if (data.success) {

                    const input =
                        document.getElementById(
                            'message-input'
                        );

                    input.value +=
                        '\n' +
                        data.fileUrl;

                }

            } catch (err) {

                console.error(
                    'Upload failed',
                    err
                );

            }

        }
    );

}

/* ==========================
   INIT
========================== */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        initTheme();
        initGroups();
        loadUsers();

    }
);