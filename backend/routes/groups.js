const express = require('express');
const Group = require('../models/Group');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/* Create Group */
router.post('/', authenticate, async (req, res) => {

    try {

        const { name, avatar } = req.body;

        const group =
            await Group.create({
                name,
                avatar: avatar || '',
                createdBy: req.user._id,
                admins: [req.user._id],
                members: [req.user._id]
            });

        res.status(201).json(group);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: 'Could not create group'
        });

    }

});

/* Get My Groups */
router.get('/', authenticate, async (req, res) => {

    try {

        const groups =
            await Group.find({
                members: req.user._id
            });

        res.json(groups);

    } catch (err) {

        res.status(500).json({
            message: 'Could not load groups'
        });

    }

});
router.put(
    '/:groupId/add-member',
    authenticate,
    async (req, res) => {

        const { userId } = req.body;

        const group =
            await Group.findById(
                req.params.groupId
            );

        if (!group) {
            return res.status(404).json({
                message: 'Group not found'
            });
        }

        if (
            !group.members.includes(userId)
        ) {
            group.members.push(userId);
            await group.save();
        }

        res.json(group);

    }
);

/* Join Group */
router.post('/:id/join', authenticate, async (req, res) => {

    try {

        const group =
            await Group.findById(req.params.id);

        if (!group)
            return res.status(404).json({
                message: 'Group not found'
            });

        if (
            !group.members.includes(
                req.user._id
            )
        ) {

            group.members.push(
                req.user._id
            );

            await group.save();

        }

        res.json(group);

    } catch (err) {

        res.status(500).json({
            message: 'Join failed'
        });

    }

});
router.put(
    '/:groupId/remove-member',
    authenticate,
    async (req, res) => {

        const { userId } = req.body;

        const group =
            await Group.findById(
                req.params.groupId
            );

        group.members =
            group.members.filter(
                member =>
                    member.toString() !== userId
            );

        await group.save();

        res.json(group);

    }
);
router.delete(
    '/:groupId',
    authenticate,
    async (req, res) => {

        const group =
            await Group.findById(
                req.params.groupId
            );

        if (!group) {
            return res.status(404).json({
                message: 'Group not found'
            });
        }

        if (
            group.admin.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message: 'Only admin can delete'
            });
        }

        await Group.findByIdAndDelete(
            req.params.groupId
        );

        res.json({
            message:
                'Group deleted successfully'
        });

    }
);

/* Leave Group */
router.post('/:id/leave', authenticate, async (req, res) => {

    try {

        const group =
            await Group.findById(req.params.id);

        if (!group)
            return res.status(404).json({
                message: 'Group not found'
            });

        group.members =
            group.members.filter(
                m =>
                    String(m) !==
                    String(req.user._id)
            );

        await group.save();

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            message: 'Leave failed'
        });

    }

});

/* Delete Group */

router.delete('/:id', authenticate, async (req, res) => {

    try {

        const group =
            await Group.findById(
                req.params.id
            );

        if (!group)
            return res.status(404).json({
                message: 'Group not found'
            });

        if (
            String(group.createdBy) !==
            String(req.user._id)
        ) {

            return res.status(403).json({
                message: 'Not allowed'
            });

        }

        await Group.findByIdAndDelete(
            req.params.id
        );

        res.json({
            success: true
        });

    } catch (err) {

        res.status(500).json({
            message: 'Delete failed'
        });

    }

});

module.exports = router;