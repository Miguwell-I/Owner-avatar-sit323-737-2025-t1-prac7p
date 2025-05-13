const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// MongoDB connection
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const mongoUsername = process.env.MONGO_USERNAME || 'admin';
const mongoPassword = process.env.MONGO_PASSWORD || 'password';

let client;
let db;

async function connectToMongo() {
    try {
        client = new MongoClient(`${mongoUrl}`, {
            auth: {
                username: mongoUsername,
                password: mongoPassword
            }
        });
        await client.connect();
        db = client.db('badmintonDB');
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}

connectToMongo();

// Middleware
app.use(express.json());

// Serve HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// CRUD endpoints
app.post('/players', async (req, res) => {
    try {
        const result = await db.collection('players').insertOne(req.body);
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/players', async (req, res) => {
    try {
        const players = await db.collection('players').find().toArray();
        res.json(players);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
    if (client) {
        await client.close();
    }
    process.exit(0);
});

const promClient = require('prom-client');

// Enable collection of default metrics
promClient.collectDefaultMetrics();

// Add this endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
