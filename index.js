const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: ['http://localhost:5173','https://solojobportal.web.app'], credentials: true }));
app.use(express.json());

// MongoDB URI and Client
const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_password}@cluster0.kqp32.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();  // Explicitly connect to MongoDB
    await client.db("admin").command({ ping: 1 });

    const AllUsers = client.db("JobPortal").collection("Users");
    const AllServices = client.db("JobPortal").collection("JobPortalDB");

    //job post
    app.post('/jobs', async (req, res) => {
      try {
        const jobData = req.body;
        const result = await AllServices.insertOne(jobData);
        res.status(201).send({ message: 'Job posted successfully', insertedId: result.insertedId });
      } catch (error) {
        console.error('Error posting job:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });

    app.get('/allJobs', async (req, res) => {
      try {
        const jobs = await AllServices.find({}).toArray();
        res.send(jobs);
        } catch (error) {
          console.error('Error fetching jobs:', error);
          res.status(500).send({ error: 'Internal Server Error' });
        }
    });

    app.get('/jobs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // default to page 1
    const limit = parseInt(req.query.limit) || 9; // default 9 jobs per page
    const skip = (page - 1) * limit;

    const jobs = await AllServices.find()
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await AllServices.estimatedDocumentCount();

    res.send({
      jobs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});


    // POST: Add a new user profile
    app.post('/profile', async (req, res) => {
      try {
        const user = req.body;
        const result = await AllUsers.insertOne(user);
        res.status(201).send({ message: 'User added', insertedId: result.insertedId });
      } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });

    // GET: Get user profile by email
    app.get('/profile', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) return res.status(400).send({ error: 'Email query parameter is required' });
        const user = await AllUsers.findOne({ email });
        res.send(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });

    // PATCH: Update user profile by email
    app.patch('/profile', async (req, res) => {
      const email = req.query.email;
      let updatedData = req.body;

      if (!email) {
        return res.status(400).send({ error: 'Email query parameter is required' });
      }

      // Remove _id if present in update data to avoid MongoDB errors
      if (updatedData._id) {
        delete updatedData._id;
      }

      // Optional: prevent changing the email itself
      if (updatedData.email && updatedData.email !== email) {
        delete updatedData.email;
      }

      try {
        console.log('Updating user:', email);
        console.log('With data:', updatedData);

        const result = await AllUsers.updateOne(
          { email },
          { $set: updatedData },
          { upsert: true }
        );

        res.send({ message: 'User updated', result });
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });

    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
  // Do NOT close the client here to keep connection alive
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Job Portal Server is Running');
});

app.listen(port, () => {
  console.log(`Server running on, http://localhost:${port}`);
});

