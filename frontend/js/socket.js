const token = localStorage.getItem('nexchat_token');

let socket = null;

try {

socket = io(
  `${window.location.protocol}//${window.location.hostname}:5001`,
  {
    auth: { token }
  }
);        auth: {
            token
        },
        transports: ['websocket']
    });

    socket.on('connect', () => {

        console.log(
            'Connected:',
            socket.id
        );

        const status =
            document.getElementById(
                'online-status'
            );

        if (status) {
            status.textContent =
                'Online';
        }

    });

    socket.on('disconnect', () => {

        const status =
            document.getElementById(
                'online-status'
            );

        if (status) {
            status.textContent =
                'Disconnected';
        }

    });

    socket.on(
        'connect_error',
        err => {

            console.error(
                'Socket Error:',
                err.message
            );

        }
    );

    /* ------------------
       RECEIVE MESSAGE
    ------------------- */

    socket.on(
        'message:receive',
        data => {

            if (
                data.senderId ===
                window.currentRecipientId
            ) {

                if (
                    window.appendMessage
                ) {

                    window.appendMessage(
                        data.content,
                        'received',
                        data.time ||
                        new Date()
                            .toLocaleTimeString(
                                [],
                                {
                                    hour:
                                        '2-digit',
                                    minute:
                                        '2-digit'
                                }
                            )
                    );

                }

            }

            hideTyping();

        }
    );

    /* ------------------
       TYPING EVENTS
    ------------------- */

    socket.on(
        'user:typing',
        data => {

            if (
                data.senderId ===
                window.currentRecipientId
            ) {

                showTyping();

            }

        }
    );

    socket.on(
        'user:stop-typing',
        () => {

            hideTyping();

        }
    );

    /* ------------------
       ONLINE STATUS
    ------------------- */

    socket.on(
        'user:online',
        () => {

            const status =
                document.getElementById(
                    'online-status'
                );

            if (status) {
                status.textContent =
                    'Online';
            }

        }
    );

    socket.on(
        'user:offline',
        () => {

            const status =
                document.getElementById(
                    'online-status'
                );

            if (status) {
                status.textContent =
                    'Offline';
            }

        }
    );

    /* ------------------
       SEND MESSAGE
    ------------------- */

    window.socketSend =
        function (
            content,
            recipientId
        ) {

            if (
                !socket ||
                !socket.connected
            )
                return;

            socket.emit(
                'message:send',
                {
                    recipientId,
                    content
                }
            );

        };

    /* ------------------
       TYPING DETECTION
    ------------------- */

    let typingTimeout;

    const input =
        document.getElementById(
            'message-input'
        );

    if (input) {

        input.addEventListener(
            'input',
            () => {

                if (
                    !socket ||
                    !window.currentRecipientId
                )
                    return;

                socket.emit(
                    'user:typing',
                    {
                        recipientId:
                            window.currentRecipientId
                    }
                );

                clearTimeout(
                    typingTimeout
                );

                typingTimeout =
                    setTimeout(
                        () => {

                            socket.emit(
                                'user:stop-typing',
                                {
                                    recipientId:
                                        window.currentRecipientId
                                }
                            );

                        },
                        1500
                    );

            }
        );

    }

} catch (err) {

    console.warn(
        'Socket disabled',
        err
    );

}

/* ------------------
   UI HELPERS
------------------- */

function showTyping() {

    const typing =
        document.getElementById(
            'typing-text'
        );

    const status =
        document.getElementById(
            'online-status'
        );

    if (typing) {
        typing.classList.remove(
            'hidden'
        );
    }

    if (status) {
        status.style.display =
            'none';
    }

}

function hideTyping() {

    const typing =
        document.getElementById(
            'typing-text'
        );

    const status =
        document.getElementById(
            'online-status'
        );

    if (typing) {
        typing.classList.add(
            'hidden'
        );
    }

    if (status) {
        status.style.display =
            '';
    }

}