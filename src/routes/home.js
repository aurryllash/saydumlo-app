const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
    res.render('home', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
})

module.exports = router