require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const setUserStatus = require('./src/middleware/setUserStatus')
var cookieParser = require('cookie-parser')

const registrationRoutes = require('./src/routes/register');
const loginRoutes = require('./src/routes/login');
const { User, loginValidation } = require('./src/models/user')

const addProductRoutes = require('./src/routes/add-products') 

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
app.use(express.json())
app.use(cookieParser());
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');
app.use(setUserStatus)

// Routes
app.use('/api', registrationRoutes)
app.use('/api', loginRoutes)
app.use('/products', addProductRoutes)

app.get('/', (req, res) => {
    if(!req.userIsLoggedIn) {
        return res.redirect('404')
    }
    res.render('home', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
})

app.get('/users', async (req, res) => {
    if(!req.userIsAdmin) {
        return res.redirect('404')
    }
    const users = await User.find().sort({ createdAt: -1 });
    
    res.render('users', { users, userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
})

app.delete('/users/:id', async (req, res) => {
    let user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: "User deleted successfully" })
})

// Get addProduct route
app.get('/products/upload', (req, res) => {
    if(!req.userIsAdmin) {
        return res.redirect('404')
    }
    res.render('add-product', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
})

app.get('/log-out', (req, res) => {
    res.clearCookie('token')
    res.redirect('/api/log-in')
})

app.get('/404', (req, res) => {
    res.render('404', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
}) 
app.use((req, res, next) => {
    res.status(404).redirect('/404');
})



