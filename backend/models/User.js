const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');


const userSchema = new mongoose.Schema(
{
    firstname: {
        type: String,
        required: true,
        trim: true
    },

    lastname: {
        type: String,
        required: true,
        trim: true
    },

    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true,
        minlength: 8
    },

    avatar: {
        type: String,
        default: ''
    },

    bio: {
        type: String,
        default: ''
    },

    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    },

    isOnline: {
        type: Boolean,
        default: false
    },

    lastSeen: {
        type: Date,
        default: Date.now
    },

    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],

    unreadCount: {
        type: Number,
        default: 0
    }
},
{
    timestamps: true
}
);

userSchema.pre('save', async function(next) {

    if (!this.isModified('password'))
        return next();

    this.password =
        await bcrypt.hash(
            this.password,
            12
        );

    next();
});

userSchema.methods.comparePassword =
async function(password) {

    return bcrypt.compare(
        password,
        this.password
    );

};

userSchema.methods.toJSON =
function() {

    const obj =
        this.toObject();

    delete obj.password;

    return obj;
};

module.exports =
    mongoose.model(
        'User',
        userSchema
    );
// Before saving, hash the password automatically
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check if entered password is correct
userSchema.methods.comparePassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Remove password from any JSON response automatically
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);