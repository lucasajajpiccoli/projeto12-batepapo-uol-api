import express from 'express';
import cors from 'cors';
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

const participantSchema = joi.object({
    name: joi.string().empty().required()
});

const messageSchema = joi.object({
    to: joi.string().empty().required(),
    text: joi.string().empty().required(),
    type: joi.valid('message', 'private_message').required()
});

function doStatusMessage (participant, status) {
    const actualTime = dayjs().format('HH:mm:ss');
    const statusMessage = {
        from: participant.name,
        to: 'Todos',
        text: `${status} sala...`,
        type: 'status',
        time: actualTime
    };
    return statusMessage;
}

app.post('/participants', async (request, response) => {
    const validation = participantSchema.validate(request.body, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        response.status(422).send(errors);
        return;
    }

    try {
        const isThereParticipant = await db.collection('participants').findOne({name: request.body.name});
        if (isThereParticipant) {
            response.sendStatus(409);
            return;
        }
        const participant = {name: request.body.name, lastStatus: Date.now()};
        await db.collection('participants').insertOne(participant);
        const statusMessage = doStatusMessage(participant, 'entra na');
        await db.collection('messages').insertOne(statusMessage);
        response.sendStatus(201);
    } catch (error) {
        response.status(500).send(error.message);
    }
});

app.get('/participants', async (request, response) => {
    try {
        const participants = await db.collection('participants').find().toArray();
        response.send(participants);
    } catch (error) {
        response.status(500).send(error.message);
    }
});

app.post('/messages', async (request, response) => {
    const { to, text, type } = request.body;
    const { user: from } = request.headers;

    const validation = messageSchema.validate(request.body, { abortEarly: false });
    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        response.status(422).send(errors);
        return;
    }

    try {
        const isThereParticipant = await db.collection('participants').findOne({name: from});
        if (!isThereParticipant) {
            response.status(422).send("Sender is not in the room.");
            return;
        }
        const time = dayjs().format('HH:mm:ss');
        const message = {from, to, text, type, time};
        await db.collection('messages').insertOne(message);
        response.sendStatus(201);
    } catch (error) {
        response.status(500).send(error.message);
    }
});

app.listen(5000, () => console.log("Listening on port 5000"));