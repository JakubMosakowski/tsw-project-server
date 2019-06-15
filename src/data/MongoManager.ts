import {horseSchema} from "../routes/api/horse/horseSchema";

require('dotenv').config();
const mongoose = require('mongoose');
export let client: Mongoose;
export let HorseModel;
export let JudgeModel;
export let RankModel;
export let UserModel;

import { Mongoose} from "mongoose";
import {judgeSchema} from "../routes/api/judge/judgeSchema";
import {rankSchema} from "../routes/api/rank/rankSchema";
import {userSchema} from "../routes/authentication/userSchema";

export async function connectToDb() {
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
    JudgeModel = client.model('Judge', judgeSchema);
    RankModel = client.model('Rank', rankSchema);
    UserModel = client.model('User', userSchema);
}
