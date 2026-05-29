const express = require('express');
const Message = require('../models/Message');
const Group = require('../models/Group');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/* ==========================
   DIRECT CHAT HISTORY
========================== */

router.get('/:userId', authenticate, async (req, res) => {

    const myId = req.user._id;
    const otherId = req.params.userId;

    try {

        const messages =
            await Message.find({
                $or: [
                    {
                        sender: myId,
                        recipient: otherId
                    },
                    {
                        sender: otherId,
                        recipient: myId
                    }
                ]
            })
            .sort({ createdAt: 1 })
            .populate(
                'sender',
                'firstname lastname username avatar'
            );

        res.json({
            messages
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message:
                'Could not load conversation'
        });

    }

});

/* ==========================
   GROUP CHAT HISTORY
========================== */

router.get(
    '/group/:groupId',
    authenticate,
    async (req, res) => {

        try {

            const messages =
                await Message.find({
                    group:
                        req.params.groupId
                })
                .sort({
                    createdAt: 1
                })
                .populate(
                    'sender',
                    'firstname lastname username avatar'
                );

            res.json({
                messages
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                message:
                    'Could not load group messages'
            });

        }

    }
);

/* ==========================
   SEND DIRECT MESSAGE
========================== */

router.post(
    '/',
    authenticate,
    async (req, res) => {

        const {
            recipientId,
            content
        } = req.body;

        if (
            !recipientId ||
            !content?.trim()
        ) {

            return res.status(400).json({
                message:
                    'recipientId and content required'
            });

        }

        try {

            const message =
                await Message.create({
                    sender:
                        req.user._id,

                    recipient:
                        recipientId,

                    content:
                        content.trim(),

                    readBy: [
                        req.user._id
                    ]
                });

            await message.populate(
                'sender',
                'firstname lastname username avatar'
            );

            res.status(201).json({
                message
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                message:
                    'Could not send message'
            });

        }

    }
);

/* ==========================
   SEND GROUP MESSAGE
========================== */

router.post(
    '/group',
    authenticate,
    async (req, res) => {

        const {
            groupId,
            content
        } = req.body;

        if (
            !groupId ||
            !content?.trim()
        ) {

            return res.status(400).json({
                message:
                    'groupId and content required'
            });

        }

        try {

            const message =
                await Message.create({
                    sender:
                        req.user._id,

                    group:
                        groupId,

                    content:
                        content.trim(),

                    readBy: [
                        req.user._id
                    ]
                });

            await message.populate(
                'sender',
                'firstname lastname username avatar'
            );

            res.status(201).json({
                message
            });

        } catch (err) {

            console.error(err);

            res.status(500).json({
                message:
                    'Could not send group message'
            });

        }

    }
);

/* ==========================
   MARK AS READ
========================== */

router.patch(
    '/read/:id',
    authenticate,
    async (req, res) => {

        try {

            const message =
                await Message.findById(
                    req.params.id
                );

            if (!message)
                return res.status(404).json({
                    message:
                        'Message not found'
                });

            if (
                !message.readBy.includes(
                    req.user._id
                )
            ) {

                message.readBy.push(
                    req.user._id
                );

                await message.save();

            }

            res.json({
                success: true
            });

        } catch (err) {

            res.status(500).json({
                message:
                    'Could not update read status'
            });

        }

    }
);

/* ==========================
   REACT TO MESSAGE
========================== */

router.post(
    '/reaction/:id',
    authenticate,
    async (req, res) => {

        const { emoji } =
            req.body;

        try {

            const message =
                await Message.findById(
                    req.params.id
                );

            if (!message)
                return res.status(404).json({
                    message:
                        'Message not found'
                });

            message.reactions.push({
                user:
                    req.user._id,
                emoji
            });

            await message.save();

            res.json(message);

        } catch (err) {

            res.status(500).json({
                message:
                    'Could not add reaction'
            });

        }

    }
);

/* ==========================
   EDIT MESSAGE
========================== */

router.patch(
    '/:id',
    authenticate,
    async (req, res) => {

        try {

            const message =
                await Message.findById(
                    req.params.id
                );

            if (!message)
                return res.status(404).json({
                    message:
                        'Message not found'
                });

            if (
                String(message.sender) !==
                String(req.user._id)
            ) {

                return res.status(403).json({
                    message:
                        'Not allowed'
                });

            }

            message.content =
                req.body.content;

            message.edited =
                true;

            await message.save();

            res.json(message);

        } catch (err) {

            res.status(500).json({
                message:
                    'Could not edit message'
            });

        }

    }
);

/* ==========================
   DELETE MESSAGE
========================== */

router.delete(
    '/:id',
    authenticate,
    async (req, res) => {

        try {

            const message =
                await Message.findById(
                    req.params.id
                );

            if (!message)
                return res.status(404).json({
                    message:
                        'Message not found'
                });

            if (
                String(message.sender) !==
                String(req.user._id)
            ) {

                return res.status(403).json({
                    message:
                        'Not allowed'
                });

            }

            message.deleted =
                true;

            message.content =
                'This message was deleted';

            await message.save();

            res.json({
                success: true
            });

        } catch (err) {

            res.status(500).json({
                message:
                    'Could not delete message'
            });

        }

    }
);

module.exports = router;