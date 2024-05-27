const express = require('express')
const router = express.Router()

const MongoClient = require('mongodb').MongoClient
const url = process.env.DATABASE_URL
const mongoClient = new MongoClient(url)

router.get('/', async (req, res) => {
    if(!req.userIsLoggedIn) {
        return res.redirect('404')
    }

    try {

        await mongoClient.connect()
        // const database = mongoClient.db('saydumlo');
        const database = mongoClient.db('store8');
        const files = await database.collection('photos.files').find().toArray()

        if(files.length === 0) {
            return res.status(403).json({ error: "Images Not Found" })
        }

        const filePromises = files.map(async file => {
            let fileData = []
            const chunks = await database.collection('photos.chunks').find({ files_id: file._id }).sort({ n:1 }).toArray()
            chunks.forEach(chunk => {
                fileData.push(chunk.data.toString('base64'))
            })
            return {
                _id: file._id,
                filename: file.filename,
                data: `data:image/jpeg;base64,${fileData.join('')}`,
                contentType: file.contentType
              };
        })
        const fileData = await Promise.all(filePromises)
        res.render('home', { userIsLoggedIn: req.userIsLoggedIn, userIsAdmin: req.userIsAdmin, fileData })

    } catch(error) {
        console.log(error)
    }

})

module.exports = router