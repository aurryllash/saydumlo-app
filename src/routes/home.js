const express = require('express')
const router = express.Router()

const MongoClient = require('mongodb').MongoClient
const url = process.env.DATABASE_URL
const mongoClient = new MongoClient(url)

router.get('/', async (req, res) => {
    res.render('home', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
})

module.exports = router