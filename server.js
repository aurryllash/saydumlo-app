require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const path = require('path')

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



// Routes
app.use('/api', registrationRoutes)
app.use('/api', loginRoutes)
app.use('/products', addProductRoutes)


const authorizationMiddleware = (requiredRole) => (req, res, next) => {
    const cookiesToken = req.cookies.token;
    if(!cookiesToken) {
        return res.status(403).redirect('/404')
    }
    jwt.verify(cookiesToken, SECRET, (err, decoded) => {
        if(err) {
            return res.status(403).render('404', { message: 'Failed to authenticate token.' })
        } 
        if(requiredRole && decoded.role !== requiredRole) {
            return res.status(403).render('404', { message: 'You do not have permission to access this resource.' });
        }
        req.user = decoded
        next();        
    })
}

app.get('/', authorizationMiddleware(), (req, res) => {
    res.render('home')
})

app.get('/users', authorizationMiddleware('admin'), async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    
    res.render('users', { users })
})
app.delete('/users/:id', async (req, res) => {
    let user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: "User deleted successfully" })
})

// Get addProduct route
app.get('/products/upload', authorizationMiddleware('admin'), (req, res) => {
    res.render('add-product')
})



app.get('/log-out', (req, res) => {
    res.clearCookie('token')
    res.redirect('/api/log-in')
})

app.get('/404', (req, res) => {
    res.render('404')
}) 


