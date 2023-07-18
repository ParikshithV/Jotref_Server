const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
    title: {
        required: true,
        type: String
    },
    description: {
        required: true,
        type: String
    },
    points: {
        required: true,
        type: Array
    },
    createdBy: {
        required: true,
        type: String
    },
    createdOn: {
        required: false,
        type: Date,
        default: Date.now
    },
    isDraft: {
        required: false,
        type: Boolean,
        default: false
    },
}, ({collection: 'posts'}))

module.exports = mongoose.model('Data', dataSchema)
