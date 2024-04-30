require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');

const registrationRoutes = require('./routes/register');

const port = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL

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

app.use('/api', registrationRoutes)

app.get('/', (req, res) => {
    res.render('home')
})
