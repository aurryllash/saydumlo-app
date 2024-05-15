require('dotenv').config()
const express = require('express')
const router = express.Router()
const { Image } = require('../models/image')
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const { GridFSBucket } = require('mongodb');
const MongoClient = require('mongodb').MongoClient

const url = process.env.DATABASE_URL

const mongoClient = new MongoClient(url) 


const storage = new GridFsStorage({
  url,
  file: (req, file) => {

    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      return {
        bucketName: "photos",
        filename: `${Date.now()}_${file.originalname}`,
      }
    } else {

      return `${Date.now()}_${file.originalname}`
    }
  },
})


const upload = multer({ storage });

router.post('/products', upload.single('image'), async (req, res) => {
  const file = req.file

  res.send({
    message: "Uploaded",
    id: file.id,
    name: file.filename,
    contentType: file.contentType
  })
})

router.get('/getImages', async (req, res) => {
  try {
    await mongoClient.connect();

    const database = mongoClient.db("saydumlo");
    const images = database.collection("photos.files");
    const cursor = images.find();
    const count = await cursor.count();


    if(count === 0) {
      return res.status(404).send({
        message: "Error: No Images found"
      })
    }

    const allImages = []
    await cursor.forEach(item => {
      allImages.push(item)
    })
    res.send({ files: allImages })
  } catch(error) {
    console.log(error);
    res.status(500).send({
      message: "Error Somthing went wrong",
      error
    })
  }
})

router.get("/download", async (req, res) => {
  try {
    await mongoClient.connect();

    const database = mongoClient.db("saydumlo")

    const imageBucket = new GridFSBucket(database, {
      bucketName: "photos"
    })
    
    const images = database.collection("photos.files").find(); 
    const files = await images.toArray()

    if(files.length === 0) {
      res.status(403).json({ error: "Images Not Found" })
    }

    const imagePromises = files.map(async (file) => {
      const chunks = await database.collection("photos.chunks").find({ files_id: file._id }).sort({ n: 1 }).toArray();
      let fileData = [];
      chunks.forEach(chunk => {
        fileData.push(chunk.data.toString('base64'));
      });
      return {
        filename: file.filename,
        data: `data:image/jpeg;base64,${fileData.join('')}`
      };
    });

    const imagesData = await Promise.all(imagePromises);
    res.render('products', { Data: imagesData })


  } catch(error) {
    console.log(error)
    res.status(500).send({
      message: "Error Something went wrong",
      error,
    })
  }
})

// Get addProduct route
router.get('/products', (req, res) => {
    res.render('add-product')
})

module.exports = router