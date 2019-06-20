import {connectToDb, HorseModel, JudgeModel, RankModel, UserModel} from "./data/MongoManager";
import {API} from "./API";
import * as mongoose from "mongoose";
import {HORSES, JUDGES, RANKS} from "./models/tableNames";
import {
    cleanEnv, str,
} from 'envalid';
import {SOMETHING_WENT_WRONG} from "./models/errorMessages";

const horses = require('./routes/api/horse/horseController');
const judges = require('./routes/api/judge/judgeController');
const ranks = require('./routes/api/rank/rankController');
const {router: auth} = require('./routes/authentication/authController');
const {authorizeHeader }= require('./routes/authentication/authController');

const express = require('express');
const cors = require('cors');
const app = express();
const morgan = require('morgan');
const port = process.env.PORT || 3000;
const socket = require('socket.io');
const bcrypt = require('bcrypt');
const http = require('http');
let server;
export let io;

setupExpress();
setupRoutes();
validateEnv();

const {
    ADMIN_LOG,
    ADMIN_PASS
} = process.env;

const adminAccounts = [{
    login: ADMIN_LOG,
    password: bcrypt.hashSync(ADMIN_PASS, 8)
}];

connectToDb().then(() => {
    server = http.createServer(app).listen(port, () => {
        console.log("Express server listening on port " + port);
    });
    io = socket.listen(server);
    setupSockets();
}).catch(e => console.log(e));

app.post('/api/reloadDb', async (req, res) => {
    await mongoose.connection.db.dropDatabase().catch(e => console.log(e));
    fillDb(
        () => {
            res.status(200).send();
        },
        () => {
            return res.status(400).send({errors: [new APIError(SOMETHING_WENT_WRONG)]});
        }
    );
});

function setupSockets() {
    io.on('connection', () => {
        io.emit(JUDGES, JudgeModel.all());
        io.emit(HORSES, HorseModel.all());
        io.emit(RANKS, RankModel.all());
    });
}

function fillDb(onFinished, onError) {
    Promise.all([API.getJudges(), API.getHorses(), API.getRanks()]).then(async values => {
        await JudgeModel.insertMany(values[0].data).catch(e => console.log(e));
        await HorseModel.insertMany(values[1].data).catch(e => console.log(e));
        await RankModel.insertMany(values[2].data).catch(e => console.log(e));
        await UserModel.insertMany(adminAccounts);

        onFinished();
    }).catch(err => {
        console.log(err);
        onError();
    });
}

function validateEnv() {
    cleanEnv(process.env, {
        ADMIN_LOG: str(),
        ADMIN_PASS: str(),
        MONGO_PASSWORD: str(),
        MONGO_PATH: str(),
        MONGO_DB: str(),
        MONGO_USER: str(),
        JWT_KEY: str()
    });
}

function setupExpress() {
    app.use(cors());
    app.use(/^\/api.*/, authorizeHeader);
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));
    app.use(morgan('tiny'));
    require('dotenv').config();
}

function setupRoutes() {
    app.use('/api/horses', horses);
    app.use('/api/judges', judges);
    app.use('/api/ranks', ranks);
    app.use('/auth', auth);
}
