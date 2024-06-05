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


const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/upload', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
        if(err.code === "LIMIT_FILE_SIZE") {
          return res.status(500).send('File size exceeds the limit (5MB)')
        }
        
        if (err instanceof multer.MulterError) {
          console.error('Multer error:', err.message);
          return res.status(500).send('Internal Server Error');
        }
        console.error('Other error during file upload:', err);
        return res.status(500).send('Internal Server Error');
    }
    res.redirect('/products');
  });
});


router.get("/", async (req, res) => {
  if(!req.userIsLoggedIn) {
    return res.status(403).redirect('/404')
  }

  try {
    await mongoClient.connect();

    const database = mongoClient.db("store8")
    

    const limit = 8;
    if(req.query.page) {
      var page = +req.query.page
    } else {
      var page = 1
    }

    if(req.query.sort) {
      var sort = req.query.sort || 'default'
    }
    const currentSort = sort
    const currentPage = page

    let sortStage = {};
    if (currentSort === 'lh') {
      sortStage = { convertedPrice: 1 };
    } else if (currentSort === 'hl') {
      sortStage = { convertedPrice: -1 };
    } else if (currentSort === 'az') {
      sortStage = { 'metadata.title': 1 };
    } else if (currentSort === 'za') {
      sortStage = { 'metadata.title': -1 };
    } else {
      sortStage = { 'metadata.description': -1 };
    }

    let seacrhStage = {}
    if(req.query.search) {
      var search = req.query.search
      seacrhStage = {
        "metadata.title": {
            $regex: search,
            $options: 'i'
      }} 
    }

    const countAggregatePipeline = [
      {
        $match: seacrhStage
      },
      {
        $count: "totalProducts"
      }
    ];
    
    const countResult = await database.collection("photos.files").aggregate(countAggregatePipeline).toArray();
    const totalProducts = countResult.length > 0 ? countResult[0].totalProducts : 0;
    const totalPages = Math.ceil(totalProducts / limit);

    const files = await database.collection("photos.files").aggregate([
      {
        $match: seacrhStage
      },
      {
        $addFields: { 
          convertedPrice: { $toInt:  "$metadata.price" } 
        }
      },
      {
        $sort: sortStage
      }
    ]).skip((page-1)*limit).limit(limit).toArray()
    

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
        contentType: file.contentType,
        uploadDate: file.uploadDate
      };
    });

    const imagesData = await Promise.all(imagePromises);

    
    res.render('products', { Data: imagesData, userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin, totalPages, currentPage, currentSort, search })



  } catch(error) {
    
    return res.status(500).send({
      message: "Error Something went wrong",
      error,
    })
  }
})

router.get('/api/:id', async (req, res) => {

  try {
    await mongoClient.connect();

    const database = mongoClient.db('store8')

    const objectId = new ObjectId(req.params.id)
     
    const file = await database.collection('photos.files').findOne({ _id: objectId })
    
    const chunks = await database.collection('photos.chunks').find({ files_id: file._id }).toArray()
    let collectChunks = []

    chunks.forEach(chunk => {
      collectChunks.push(chunk.data.toString('base64'));
    })

    const fileData = { 
      id: file._id,
      data: `data:image/jpeg;base64,${collectChunks.join('')}`,
      metadata: file.metadata
     }

     res.render('specificProduct', { fileData, userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })

  } catch(error) {
    return res.status(500).send({
      message: "Error Something went wrong",
      error,
    })
  }

})

router.delete('/:id', async (req, res) => {
  try {
    await mongoClient.connect();

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

router.get('/file/upload', (req, res) => {
  if(!req.userIsAdmin) {
      return res.redirect('404')
  }
  res.render('add-product', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin })
})



module.exports = router