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
    const bookedTutorsCollection = db.collection('bookedTutors');

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