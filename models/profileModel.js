const mongoose = require('mongoose');

const profilesSchema = new mongoose.Schema({
    email: {
        required: true,
        type: String
    },
    otp: {
        required: false,
        type: String,
        default: null
    },
    verified: {
        required: false,
        type: Boolean,
        default: false,
    },
    otpAttempts: {
        required: false,
        type: Number,
        default: 3
    },
}, ({collection: 'profiles'}))

module.exports = mongoose.model('Profiles', profilesSchema)