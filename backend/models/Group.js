const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    avatar: {
        type: String,
        default: ''
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
},
{
    timestamps: true
}
);

module.exports =
    mongoose.model(
        'Group',
        groupSchema
    );