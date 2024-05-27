const express = require('express')
const router = express.Router()
const { User } = require('../models/user')

router.get('/', async (req, res) => {
    if(!req.userIsAdmin) {
        return res.redirect('404')
    }
    const users = await User.find().sort({ createdAt: -1 });
    
    res.render('users', { users, userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
})

router.delete('/:id', async (req, res) => {
    let user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: "User deleted successfully" })
})

module.exports = router