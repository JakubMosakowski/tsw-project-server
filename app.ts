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
        //todo validate
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }

        db.get(HORSES)
            .push(req.body)
            .write();
        res.json("");
    });

//todo dodawanie, edycję i usuwanie danych o sędziach
//todo dodawanie, edycję i usuwanie danych o klasach
//todo dodawanie, edycję i usuwanie danych o koniach

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

const wrongTypeErrorMsg = "You passed incorrect json!";

const HORSES = 'horses';
const JUDGES = 'judges';
const RANKS = 'ranks';
