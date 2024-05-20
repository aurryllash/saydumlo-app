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
        metadata: {
          title: req.body.title,
          description: req.body.description,
          price: req.body.price
        }
      }
    } else {
      return `${Date.now()}_${file.originalname}`
    }
  },
})


const upload = multer({ storage });

router.post('/upload', upload.single('image'), async (req, res) => {
  const file = req.file

  res.send({
    message: "Uploaded",
    id: file.id,
    name: file.filename,
    contentType: file.contentType
  })

})


router.get("/", async (req, res) => {
  try {
    await mongoClient.connect();

    const database = mongoClient.db("saydumlo")

    const imageBucket = new GridFSBucket(database, {
      bucketName: "photos"
    })
    
    const images = database.collection("photos.files").find(); 
    const files = await images.toArray()

    if(files.length === 0) {
      return res.status(403).json({ error: "Images Not Found" })
    }

    const imagePromises = files.map(async (file) => {
      const chunks = await database.collection("photos.chunks").find({ files_id: file._id }).sort({ n: 1 }).toArray();
      let fileData = [];
      chunks.forEach(chunk => {
        fileData.push(chunk.data.toString('base64'));
      });
      return {
        filename: file.filename,
        data: `data:image/jpeg;base64,${fileData.join('')}`,
        metadata: file.metadata
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



module.exports = router