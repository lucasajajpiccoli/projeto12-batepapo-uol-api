import express from 'express';
import cors from 'corts';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import joi from 'joi';
import dayjs from 'dayjs';

const app = express();
app.use(cors());
app.use(express.json());

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => { db = mongoClient.db('test') });

app.listen(5000, () => console.log("Listening on port 5000"));