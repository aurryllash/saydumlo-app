const express = require('express')
const router = express.Router()
const { Image } = require('../models/image')

const multer = require('multer');
const path = require('path');




// Set up Multer storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post('/addProduct', upload.single('image'), async (req, res) => {
    try {
        console.log(req.file)
        const newImage = new Image({
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            image: req.file.path
        })
        

        const savedImage = await newImage.save();
        res.json(savedImage)
    } catch(err) {
        res.status(400).json({ message: err.message });
    }
})

// Get addProduct route
router.get('/addProduct', (req, res) => {
    res.render('add-product')
})

module.exports = router