/* jshint strict: global, esversion: 6, devel: true, node: true */
'use strict';
const express = require('express');
const app = express();
const morgan = require('morgan');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const port = process.env.PORT;
const basicAuth = require('express-basic-auth');
const server = require('http').createServer(app);
const {check, validationResult} = require('express-validator/check');
const io = require('socket.io')(server);

app.use(express.json());
app.use(morgan('tiny'));
app.use(express.urlencoded({extended: false}));
server.listen(80);

clearDB();
authorize();
setupHeaders();

app.post('/horse',
    [
        check('id').isNumeric(),
        check('number').isNumeric(),
        check('rank').isNumeric(),
        check('yearOfBirth').isNumeric(),
        check('color').isString(),
        check('sex').isString(),
        check('breeder.name').isString(),
        check('breeder.country').isString(),
        check('owner.name').isString(),
        check('owner.country').isString(),
        check('lineage.father.name').isString(),
        check('lineage.father.country').isString(),
        check('lineage.mother.name').isString(),
        check('lineage.mother.country').isString(),
        check('lineage.mothersFather.name').isString(),
        check('lineage.mothersFather.country').isString(),
        check('notes').isArray(),
        check('notes.*.type').isNumeric(),
        check('notes.*.head').isNumeric(),
        check('notes.*.log').isNumeric(),
        check('notes.*.legs').isNumeric(),
        check('notes.*.movement').isNumeric(),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }

        let horse = req.body;
        horse.rankId = horse.rank;
        delete horse.rank;

        db.get(HORSES)
            .push(horse)
            .write();

        res.json(horse);
    });

app.post('/judge',
    [
        check('id').isNumeric(),
        check('name').isString(),
        check('country').isString(),
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }

        db.get(JUDGES)
            .push(req.body)
            .write();

        res.json(req.body);
    });

app.post('/rank',
    [
        check('id').isNumeric(),
        check('number').isNumeric(),
        check('category').isString(),
        check('committee.*').isNumeric(),
        check('committee').isArray(),

    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }

        db.get(RANKS)
            .push(req.body)
            .write();

        res.json(req.body);
    });

//todo  edycję i usuwanie danych o sędziach
//todo  edycję i usuwanie danych o klasach
//todo  edycję i usuwanie danych o koniach

//todo możliwość przeniesienia konia z klasy do klasy
//todo możliwość zmiany numerów startowych (np. „rozsunięcie” ich dla zrobienia miejsca na kolejnego konia)
//todo możliwość edycji komisji sędziowskich dla poszczególnych klas


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

function clearDB() {
    const newState = {};
    db.setState(newState);
    db.write();
    db.defaults({
        horses: [],
        judges: {},
        ranks: {}
    }).write();
}

function authorize() {
    app.use(basicAuth({
        users: {'admin': 'admin'},
        challenge: true,
        unauthorizedResponse: getUnauthorizedResponse
    }));
}

function getUnauthorizedResponse(req) {
    return req.auth
        ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected')
        : 'No credentials provided'
}

function setupHeaders() {
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
}

const HORSES = 'horses';
const JUDGES = 'judges';
const RANKS = 'ranks';
