const { User, validate } = require('../models/user')
const bcrypt = require('bcrypt')
const express = require('express')
const router = express.Router()

router.post('/registration', async (req, res) => {
    const error = validate(req.body);

    if(error.error) {
        // return res.status(400).send(error.error.details[0].message)
        return res.status(400).send(error.error)
    }
    let user = await User.findOne({ email: req.body.email })
    if(user) {
        return res.status(400).send("user already exist!!! please sign in")
    } else {
        try {
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(req.body.password, salt);
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: password
            })
            await newUser.save();
            return res.render('log-in', { message: 'Registration successful. Please log in.' });
        } catch(error) {
            return res.status(400).json({ message: error.message })
        }
    }
})

router.get('/registration', (req, res) => {
    if(req.userIsLoggedIn) {
        res.status(403).redirect('/404')
    }
    res.render('registration', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
})

module.exports = router