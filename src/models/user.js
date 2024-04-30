const mongoose = require('mongoose');
const joi = require('joi');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 5,
        max: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        min: 5,
        max: 255
    },
    password: {
        type: String,
        required: true,
        min: 5,
        max: 100
    }
}, {timestamps: true})

function userValidation(user) {
    const schema = joi.object({
        name: joi.string().min(5).max(100).required(),
        email: joi.string().min(5).max(255).required().email(),
        password: joi.string().min(5).max(100).required(),
    })
}


module.exports.User = mongoose.model('User', userSchema)
module.exports.validate = userValidation;