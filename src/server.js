require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');

const registrationRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');

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
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser());

app.use('/api', registrationRoutes)
app.use('/api', loginRoutes)

const authorizationToken = (req, res, next) => {
    const cookiesToken = req.cookies.token;
    console.log(cookiesToken)
    if(!cookiesToken) {
        return res.status(403).redirect('/404')
    }
    jwt.verify(cookiesToken, SECRET, (err, decoded) => {
        if(err) {
            return res.sendStatus(403)
        }

        req.user = decoded
        console.log(decoded)
        next();
    })
}

app.get('/', authorizationToken, (req, res) => {
    res.render('home')
})
app.get('/log-out', (req, res) => {
    res.clearCookie('token')

    res.redirect('/api/log-in')
})
app.get('/404', (req, res) => {
    res.render('404')
}) 

