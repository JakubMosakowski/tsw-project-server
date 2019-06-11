import {horseSchema} from "../schemas/horseSchema";

require('dotenv').config();
const mongoose = require('mongoose');
export let client: Mongoose;
export let HorseModel;
export let RankModel;

import {
    cleanEnv, str,
} from 'envalid';
import { Mongoose} from "mongoose";

function validateEnv() {
    cleanEnv(process.env, {
        MONGO_PASSWORD: str(),
        MONGO_PATH: str(),
        MONGO_USER: str(),
    });
}

export async function connectToDb() {
    validateEnv();
    const {
        MONGO_USER,
        MONGO_PASSWORD,
        MONGO_PATH,
        MONGO_DB
    } = process.env;
    client = await mongoose.connect(`mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}${MONGO_PATH}/${MONGO_DB}`, {
        useNewUrlParser: true,
        useFindAndModify: false
    });

    HorseModel = client.model('Horse', horseSchema);
    RankModel = client.model('Horse', horseSchema);
}
