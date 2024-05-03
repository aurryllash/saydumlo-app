require('dotenv').config()
const { User, loginValidation } = require('../models/user')
const bcrypt = require('bcrypt')
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const SECRET = process.env.SECRET
const jwtExpireSeconds = 300

router.post('/log-in', async (req, res) => {
    const error = loginValidation(req.body)

    if(error) {
        return res.status(401).send("incorrect password or email")
    } else {
        try {
            let user = await User.findOne({ email: req.body.email })
            if(!user) {
                res.status(400).json({ message: 'Incorrect email or password.' })
            }
            const correctPassword = await bcrypt.compare(req.body.password, user.password)
            if(!correctPassword) {
                return res.status(400).json('Incorrect password.')
            }
            const token = jwt.sign({ id: user._id }, SECRET)
            res.cookie(
                "token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: "strict",
                maxAge: jwtExpireSeconds * 1000
            })
            res.json({ message: 'Successfully logged in' })
        } catch(err) {
            res.status(400).json({ message: err.message })
        }
    }
})

module.exports = router