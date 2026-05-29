const express = require('express');
const User = require('../models/User');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/* ==========================
   GET ALL USERS
========================== */

router.get('/', authenticate, async (req, res) => {

    try {

        const users =
            await User.find({
                _id: {
                    $ne: req.user._id
                }
            })
            .select('-password')
            .limit(100);

        res.json({
            users
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message:
                'Could not load users'
        });

    }

});

/* ==========================
   SEARCH USERS
========================== */

router.get(
    '/search/:term',
    authenticate,
    async (req, res) => {

        try {

            const term =
                req.params.term;

            const users =
                await User.find({
                    $and: [
                        {
                            _id: {
                                $ne:
                                    req.user._id
                            }
                        },
                        {
                            $or: [
                                {
                                    firstname:
                                    {
                                        $regex:
                                            term,
                                        $options:
                                            'i'
                                    }
                                },
                                {
                                    lastname:
                                    {
                                        $regex:
                                            term,
                                        $options:
                                            'i'
                                    }
                                },
                                {
                                    username:
                                    {
                                        $regex:
                                            term,
                                        $options:
                                            'i'
                                    }
                                }
                            ]
                        }
                    ]
                })
                .select('-password');

            res.json({
                users
            });

        } catch (err) {

            res.status(500).json({
                message:
                    'Search failed'
            });

        }

    }
);

/* ==========================
   ONLINE USERS
========================== */

router.get(
    '/online/list',
    authenticate,
    async (req, res) => {

        try {

            const users =
                await User.find({
                    isOnline: true
                })
                .select(
                    'firstname lastname username avatar status'
                );

            res.json({
                users
            });

        } catch (err) {

            res.status(500).json({
                message:
                    'Could not load online users'
            });

        }

    }
);

/* ==========================
   DASHBOARD STATS
========================== */

router.get(
    '/dashboard/stats',
    authenticate,
    async (req, res) => {

        try {

            const totalUsers =
                await User.countDocuments();

            const onlineUsers =
                await User.countDocuments({
                    isOnline: true
                });

            const totalMessages =
                await Message.countDocuments();

            res.json({
                totalUsers,
                onlineUsers,
                totalMessages
            });

        } catch (err) {

            res.status(500).json({
                message:
                    'Could not load stats'
            });

        }

    }
);

/* ==========================
   MY PROFILE
========================== */

router.get(
    '/me/profile',
    authenticate,
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user._id
                )
                .select('-password');

            res.json({
                user
            });

        } catch (err) {

            res.status(500).json({
                message:
                    'Could not load profile'
            });

        }

    }
);

/* ==========================
   UPDATE PROFILE
========================== */

router.put(
    '/me/profile',
    authenticate,
    async (req, res) => {

        try {

            const updated =
                await User.findByIdAndUpdate(
                    req.user._id,
                    {
                        firstname:
                            req.body.firstname,

                        lastname:
                            req.body.lastname,

                        bio:
                            req.body.bio
                    },
                    {
                        new: true
                    }
                ).select('-password');

            res.json({
                user:
                    updated
            });

        } catch (err) {

            res.status(500).json({
                message:
                    'Profile update failed'
            });

        }

    }
);

/* ==========================
   UPDATE AVATAR
========================== */

router.put(
    '/me/avatar',
    authenticate,
    async (req, res) => {

        try {

            const updated =
                await User.findByIdAndUpdate(
                    req.user._id,
                    {
                        avatar:
                            req.body.avatar
                    },
                    {
                        new: true
                    }
                ).select('-password');

            res.json({
                user:
                    updated
            });

        } catch (err) {

            res.status(500).json({
                message:
                    'Avatar update failed'
            });

        }

    }
);

/* ==========================
   SINGLE USER
========================== */

router.get(
    '/:id',
    authenticate,
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.params.id
                )
                .select('-password');

            if (!user) {

                return res.status(404).json({
                    message:
                        'User not found'
                });

            }

            res.json({
                user
            });

        } catch (err) {

            res.status(500).json({
                message:
                    'Could not load user'
            });

        }

    }
);

module.exports = router;