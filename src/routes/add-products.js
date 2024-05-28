require('dotenv').config()
const express = require('express')
const router = express.Router()
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const { GridFSBucket, ObjectId } = require('mongodb');

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
        throw new Error(`${Date.now()}_${file.originalname} is not an image`);
    }
  },
})


const upload = multer({ storage });

router.post('/upload', upload.single('image'), async (req, res) => {
  res.redirect('/products')
})


router.get("/", async (req, res) => {
  if(!req.userIsLoggedIn) {
    return res.status(403).redirect('/404')
  }

  try {
    await mongoClient.connect();

    // const database = mongoClient.db("saydumlo")
    const database = mongoClient.db("store8")
    
    const images = database.collection("photos.files").find(); 
    const files = await images.toArray()

    if(files.length === 0) {
      return res.status(403).json({ error: "Images Not Found" })
    }

    const imagePromises = files.map(async (file) => {
      let fileData = [];
      if(file.contentType != 'video/mpeg') {
        const chunks = await database.collection("photos.chunks").find({ files_id: file._id }).sort({ n: 1 }).toArray();
        chunks.forEach(chunk => {
        fileData.push(chunk.data.toString('base64'));
      });
      } else {
        fileData.push('error')
      }

      return {
        _id: file._id,
        filename: file.filename,
        data: `data:image/jpeg;base64,${fileData.join('')}`,
        metadata: file.metadata,
        contentType: file.contentType
      };
    });

    const imagesData = await Promise.all(imagePromises);
    res.render('products', { Data: imagesData, userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })


  } catch(error) {
    console.log(error)
    res.status(500).send({
      message: "Error Something went wrong",
      error,
    })
  }
})

router.get('/api/:id', async (req, res) => {

  try {
    await mongoClient.connect();
    // const database = mongoClient.db('saydumlo')
    const database = mongoClient.db('store8')

    const objectId = new ObjectId(req.params.id)
     

    var bucket = new GridFSBucket(database, {
      bucketName: 'photos'
    })

    var downStream = bucket.openDownloadStream(objectId)

    downStream.on('error', (err) => {
      console.error('Error downloading file', err);
      if (!res.headersSent) {
        res.status(404).json({ message: 'File Not Found' });
      }
    });

    downStream.on('finish', () => {
      console.log('File download completed');
    });

    downStream.pipe(res)
  } catch(error) {
    return res.send(404).json({ message: 'Something Went Wrong' })
  }

})

router.delete('/:id', async (req, res) => {
  try {
    await mongoClient.connect();

    // const database = mongoClient.db("saydumlo")
    const database = mongoClient.db("store8")

    const objectId = new ObjectId(req.params.id)

    const imageBucket = new GridFSBucket(database, {
      bucketName: 'photos'
    })

    imageBucket.delete(objectId)
    return res.status(200).json({ message: 'Files delete successfully' })

  } catch(err) {
    console.log(err)
    res.status(500).send({
      message: "Error Something went wrong",
      err,
    })
  }
})

router.get('/upload', (req, res) => {
  if(!req.userIsAdmin) {
      return res.redirect('404')
  }
  res.render('add-product', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
})



module.exports = router