const { User, validate } = require('../models/user')
const bcrypt = require('bcrypt')
const express = require('express')
const router = express.Router()

const registerRouter = router.post('/register', async (req, res) => {
    const error = validate(req.body);
    if(error) {
        return res.status(400).send(error.details[0].message)
    }
    let user = await User.findOne({ email: req.body.email })
    if(user) {
        return res.status(400).send("user already exist!!!")
    } else {
        try {
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(req.body.password, salt);
            const user = new User({
                name: req.bodu.name,
                email: req.body.email,
                password: password
            })
            await user.save();
            return res.status(201).json(user)
        } catch(error) {
            return res.status(400).json({ message: error.message })
        }
    }
})