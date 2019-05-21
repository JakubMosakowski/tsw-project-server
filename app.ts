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
const uuidv1 = require('uuid/v1');

app.use(express.json());
app.use(morgan('tiny'));
app.use(express.urlencoded({extended: false}));
server.listen(80);

clearDB();
authorize();
setupHeaders();
setupPosts();
setupDeletes();
// setupGetters();
setupUpdates();

//TODO API
//todo getters,  danych o sędziach
//todo getters,  danych o klasach
//todo  getters,  danych o koniach
//todo bulk update koni (żeby zmienic im numery)
//todo dodawanie pokazu
//todo edytowanie pokazu
//todo usuwanie pokazu


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

function clearDB() {
    const newState = {};
    db.setState(newState);
    db.write();
    db.defaults({
        horses: [],
        judges: [],
        ranks: []
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

function rankNumberWasNotUpdated(value: number, id: string): boolean {
    let rank = db.get(RANKS)
        .find({id: id}).value();
    if (rank == null) {
        return true;
    }

    return rank.number == value;
}

function horseNumberWasNotUpdated(value: number, id: string): boolean {
    let horse = db.get(HORSES)
        .find({id: id}).value();
    if (horse == null) {
        return true;
    }

    return horse.number == value;
}

function setupUpdates() {
    app.put('/horse/:id', [
        check('number').isNumeric(),
        check('number', 'Number must be unique!')
            .exists()
            .custom((value, {req}) => value === getFirstUnusedHorseNumber() || horseNumberWasNotUpdated(value, req.params.id)),
        check('rankId').isNumeric(),
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
    ], function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }

        let horse = req.body;
        horse.id = req.params.id;

        if (Object.keys(req.body).length != 12) {
            return res.status(422).json(TOO_MANY_PARAMETERS);
        }

        db.get(HORSES)
            .find({id: req.params.id})
            .assign(horse)
            .write();
        if (db.get(HORSES)
            .find({id: req.params.id}).value() == null) {
            res.json(NOT_FOUND);
        } else {
            res.json(horse);
        }
    });

    app.put('/judge/:id', [
        check('name').isString(),
        check('country').isString(),
    ], function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }
        let judge = req.body;
        judge.id = req.params.id;

        if (Object.keys(req.body).length != 3) {
            return res.status(422).json(TOO_MANY_PARAMETERS);
        }
        db.get(JUDGES)
            .find({id: req.params.id})
            .assign(judge)
            .write();

        if (db.get(JUDGES)
            .find({id: req.params.id}).value() == null) {
            res.json(NOT_FOUND);
        } else {
            res.json(judge);
        }
    });

    app.put('/rank/:id', [
        check('number').isNumeric(),
        check('number', 'Number must be unique!')
            .exists()
            .custom((value, {req}) => value === getFirstUnusedRankNumber() || rankNumberWasNotUpdated(value, req.params.id)),
        check('category').isString(),
        check('committee.*').isNumeric(),
        check('committee').isArray(),
    ], function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }
        let rank = req.body;
        rank.id = req.params.id;

        if (Object.keys(req.body).length != 4) {
            console.log((Object.keys(req.body).length));
            return res.status(422).json(TOO_MANY_PARAMETERS);
        }

        db.get(RANKS)
            .find({id: req.params.id})
            .assign(rank)
            .write();

        if (db.get(RANKS)
            .find({id: req.params.id}).value() == null) {
            res.json(NOT_FOUND);
        } else {
            res.json(rank);
        }
    });
}

function removeFromDb(dbName: string, id: string): boolean {
    let toRemove = db.get(dbName).find({id: id}).value();
    db.get(dbName)
        .remove(toRemove)
        .write();
    return toRemove != null;
}

function setupDeletes() {
    app.delete('/horse/:id', function (req, res) {
        let deleteConfirmed = removeFromDb(HORSES, req.params.id);
        if (deleteConfirmed) {
            res.json();
        } else {
            res.json({msg: NOT_FOUND});
        }
    });

    app.delete('/judge/:id', function (req, res) {
        let deleteConfirmed = removeFromDb(JUDGES, req.params.id);
        if (deleteConfirmed) {
            res.json();
        } else {
            res.json({msg: NOT_FOUND});
        }
    });

    app.delete('/rank/:id', function (req, res) {
        let deleteConfirmed = removeFromDb(RANKS, req.params.id);
        if (deleteConfirmed) {
            res.json();
        } else {
            res.json({msg: NOT_FOUND});
        }
    });
}

function setupPosts() {
    app.post('/horse',
        [
            check('rankId').isNumeric(),
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
            horse.id = uuidv1();
            horse.number = getFirstUnusedHorseNumber();

            if (Object.keys(req.body).length != 12) {
                return res.status(422).json(TOO_MANY_PARAMETERS);
            }

            db.get(HORSES)
                .push(horse)
                .write();

            res.json(horse);
        });

    app.post('/judge',
        [
            check('name').isString(),
            check('country').isString(),
        ],
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }

            let judge = req.body;
            judge.id = uuidv1();

            if (Object.keys(req.body).length != 3) {
                return res.status(422).json(TOO_MANY_PARAMETERS);
            }

            db.get(JUDGES)
                .push(judge)
                .write();

            res.json(judge);
        });

    app.post('/rank',
        [
            check('category').isString(),
            check('committee.*').isNumeric(),
            check('committee').isArray(),

        ],
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }

            let rank = req.body;
            rank.id = uuidv1();
            rank.number = getFirstUnusedRankNumber();

            if (Object.keys(req.body).length != 4) {
                return res.status(422).json(TOO_MANY_PARAMETERS);
            }

            db.get(RANKS)
                .push(rank)
                .write();

            res.json(rank);
        });
}

function getFirstMissingValueFromArray(numbers: number[]): number {
    numbers.sort();
    let returnValue = numbers.length + 1;
    numbers.forEach((value, index) => {
        if (value != index + 1) {
            console.log(`if ${value} ${index}`);
            returnValue = index + 1
        }
    });
    return returnValue;
}

function getFirstUnusedRankNumber(): number {
    let numbers = db.get(RANKS).map(NUMBER).value();

    return getFirstMissingValueFromArray(numbers);
}

function getFirstUnusedHorseNumber(): number {
    let numbers = db.get(HORSES).map(NUMBER).value();

    return getFirstMissingValueFromArray(numbers);
}

const NOT_FOUND = {msg: "VALUE WAS NOT FOUND"};
const TOO_MANY_PARAMETERS = {msg: "TOO MANY PARAMETERS PASSED"};
const HORSES = 'horses';
const JUDGES = 'judges';
const RANKS = 'ranks';
const NUMBER = 'number';
