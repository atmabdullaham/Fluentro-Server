const express = require('express');
const cors = require('cors');

const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.FLUENTRO_USER}:${process.env.FLUENTRO_PASS}@cluster0.4lxln.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const db = client.db('fluentrodb');
    const tutorialsCollection = db.collection('tutorials');
    const bookingDataCollection = db.collection('bookingData');

    app.get('/', async(req, res)=>{
        res.send('Fluentro server is running');
    })

     //add tutorial api to add tutorial to db
    app.post('/add-tutorial', async(req,res)=>{
        const tutorialData = req.body;
        const result = await tutorialsCollection.insertOne(tutorialData)
        res.send(result);
      })

    // load tutorials for specific person who was added those tutorials
    app.get('/tutorials/:email', async(req,res)=>{
        const email = req.params.email;
        const query = {'tutor.email': email};
        const result = await tutorialsCollection.find(query).toArray();
        res.send(result);
    })

    // delete tutorial
app.delete('/tutorials/:id', async(req, res)=>{
    const id = req.params.id
    console.log(id);
    const query = {_id: new ObjectId(id)}
    const result = await tutorialsCollection.deleteOne(query)
    res.send(result)
  })

  // get a specific tutorial
  app.get('/get-one/:id', async(req, res)=>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await tutorialsCollection.findOne(query)
    res.send(result)
  })

  // update turorial
  app.put('/update-tutorial/:id', async(req,res)=>{
    const id = req.params.id;
    const tutorialData = req.body;
    const filter = { _id: new ObjectId(id) };
    const options = {}
    const updatedDoc = {
      $set:tutorialData,
    }
    const result = await tutorialsCollection.updateOne(filter, updatedDoc, options)
    res.send(result)
  })

  //get all tutors
    app.get('/tutors', async(req, res)=>{
        const query = {}
        const result = await tutorialsCollection.find(query).toArray();
        res.send(result);
    })


    // save booked tutors data to db
    app.post('/add-booking', async(req,res)=>{
      const bookingData = req.body;
      const { tutor, learnerEmail } = bookingData;
      const existingBooking = await bookingDataCollection.findOne({
        "tutor.tutorId": tutor.tutorId,
        learnerEmail: learnerEmail,
      });
    
      if (existingBooking) {
        return res.status(409).send({ message: "You already booked this tutor" });
      }
      
      const result = await bookingDataCollection.insertOne(bookingData)
      res.send(result);
    })

    // load booked tutors for specific person who was booked those tutors
    app.get('/my-booked-tutors/:email', async(req,res)=>{
      const email = req.params.email;
      const query = {'learnerEmail': email};
      const result = await bookingDataCollection.find(query).toArray();
      res.send(result);
  })
   

  app.patch('/update-review/:id', async(req,res)=>{
    const id = req.params.id;
    const email = req.body.email;
    const filter = { _id: new ObjectId(id) };
    const tutorial = await tutorialsCollection.findOne(filter);
    const alreadyReviewed = tutorial.reviewedBy?.includes(email);
    if (alreadyReviewed) {
      return res.status(403).send({ message: "You already gave a review." });
    }
    const updatedDoc = {
      $inc: { review: 1 },
      $addToSet: { reviewedBy: email }
    }
    const result = await tutorialsCollection.updateOne(filter, updatedDoc)
    res.send(result)
  })



  // load data for stats
  app.get('/stats', async (req, res) => {
    try {
      // Count of all tutorials
      const totalTutors = await tutorialsCollection.estimatedDocumentCount();
  
      // // Sum of all review fields
      const reviewAgg = await tutorialsCollection.aggregate([
        { $group: { _id: null, totalReview: { $sum: "$review" } } }
      ]).toArray();
      const totalReviews = reviewAgg[0]?.totalReview || 0;
  
      // // Unique languages
      const languageAggregation = await tutorialsCollection.aggregate([
        {
          $group: {
            _id: "$language" 
          }
        },
        {
          $count: "uniqueLanguages"
        }
      ]).toArray();
      
      const uniqueLanguageCount = languageAggregation[0]?.uniqueLanguages || 0;
  
      // Total booking users
      const result = await bookingDataCollection.aggregate([
        {
          $group: {
            _id: "$learnerEmail",
          },
        },
        {
          $count: "uniqueUserCount"
        }
      ]).toArray();
      
      const totalUsers = result[0]?.uniqueUserCount || 0;
  
      res.send({
        totalTutors,
        totalReviews,
        uniqueLanguageCount,
        totalUsers
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Failed to load stats", error: err });
    }
  });
  

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.listen(port, ()=>{
    console.log(`server is running on port ${port}`);
})