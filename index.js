const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);


// import { MongoClient } from 'mongodb';
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const express = require('express')
// import express from 'express';
const dotenv = require('dotenv')
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

dotenv.config()


const app = express()
const PORT = process.env.PORT

app.use(cors())
app.use(express.json())

const client = new MongoClient(process.env.MONGODB_URI);

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)
const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization

    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" })
    }

    try {
        const { payload } = await jwtVerify(token, JWKS)
        console.log(payload)

        next()

    } catch (error) {
        return res.status(403).json({ message: "Forbidden" })
    }

}

// connect
const mongodbConnect = async () => {
    try {
        // await client.connect()
        const db = client.db("airlust")

        const destinationCollection = db.collection('destinations')
        const bookingCollection = db.collection('bookings')

        // get
        app.get('/destination', async (req, res) => {
            const result = await destinationCollection.find().toArray()
            res.send(result);
        })

        // post
        app.post('/destination', async (req, res) => {
            const destinationData = req.body
            console.log(destinationData)

            const result = await destinationCollection.insertOne(destinationData)
            // res.json(result)
            res.send(result)
        })

        // details about
        app.get('/destination/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await destinationCollection.findOne({ _id: new ObjectId(id) })
            res.send(result);
        })

        // edit
        app.patch('/destination/:id', async (req, res) => {
            const { id } = req.params;
            const updatedData = req.body;

            const result = await destinationCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            )
            res.json(result)
        })

        // delete
        app.delete('/destination/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const result = await destinationCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })

        // booking collection post
        // post
        app.post("/booking", verifyToken, async (req, res) => {
            const bookingData = req.body;
            const result = await bookingCollection.insertOne(bookingData);
            res.send(result);
        })
        // get booking collection
        app.get("/booking/:userId", async (req, res) => {
            const { userId } = req.params;

            const result = await bookingCollection.find({ userId: userId }).toArray();
            res.send(result);
        })

        // delete booking
        app.delete('/booking/:bookingId', async (req, res) => {
            const { bookingId } = req.params;
            const result = await bookingCollection.deleteOne({ _id: new ObjectId(bookingId) });
            res.send(result);
        })

        console.log("You successfully connected to MongoDB!")
        return client;
    }
    catch (err) {
        console.dir(err);
    }
}

// disconnect
const disconnectMongodb = async () => {
    // await client.close();
}

mongodbConnect()

app.get('/', (req, res) => {
    res.send("Server is running fine!")
})


app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`)
})


