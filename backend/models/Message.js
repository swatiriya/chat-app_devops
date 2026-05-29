const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    emoji: {
        type: String
    }
},
{
    _id: false
});

const messageSchema = new mongoose.Schema(
{
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },

    content: {
        type: String,
        trim: true,
        default: ''
    },

    attachments: [{
        type: String
    }],

    reactions: [reactionSchema],

    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    edited: {
        type: Boolean,
        default: false
    },

    deleted: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
}
);

/* Direct Messages */

messageSchema.index({
    sender: 1,
    recipient: 1,
    createdAt: -1
});

/* Group Messages */

messageSchema.index({
    group: 1,
    createdAt: -1
});

module.exports =
    mongoose.model(
        'Message',
        messageSchema
    );