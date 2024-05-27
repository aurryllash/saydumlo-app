require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const setUserStatus = require('./src/middleware/setUserStatus')
var cookieParser = require('cookie-parser')

const registrationRoutes = require('./src/routes/register');
const loginRoutes = require('./src/routes/login');
const usersRoutes = require('./src/routes/users')
const homeRoutes = require('./src/routes/home')
const { User, loginValidation } = require('./src/models/user')

const addProductRoutes = require('./src/routes/add-products'); 

const port = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL
const SECRET = process.env.SECRET

mongoose.connect(DATABASE_URL)
    .then(() => {
        console.log("database is connected successfully!")
        app.listen(3000, () => console.log('Express server is running on port 3000'))
    })
    .catch(err => {
        console.log("Error connecting to mongoDB, Error: " + err)
    })

// EJS
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser());
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(setUserStatus)

// Routes
app.use('/api', registrationRoutes)
app.use('/api', loginRoutes)
app.use('/products', addProductRoutes)
app.use('/users', usersRoutes)
app.use('/home', homeRoutes)

app.get('/log-out', (req, res) => {
    res.clearCookie('token')
    res.redirect('/api/log-in')
})

app.get('/about', (req, res) => {
    res.render('about-us', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
})
app.get('/terms', (req, res) => {
    res.render('terms', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
})

app.get('/404', (req, res) => {
    res.render('404', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
}) 
app.use((req, res, next) => {
    res.status(404).redirect('/404');
})



