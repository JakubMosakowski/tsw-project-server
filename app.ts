/* jshint strict: global, esversion: 6, devel: true, node: true */
'use strict';
import {Notes} from "./models/horse";
import {
    DUPLICATED_NUMBERS,
    GAP_BETWEEN_NUMBERS,
    INVALID_HORSES_ID,
    NOT_FOUND,
    NOTES_NOT_IN_RANGE,
    TOO_MANY_PARAMETERS
} from "./models/errorMessages";
import {HORSES, JUDGES, RANKS, USERS} from "./models/tableNames";
import {getFirstMissingValueFromArray, isInRange} from "./extensions";
import {User} from "./models/user";

const express = require('express');
const app = express();
const morgan = require('morgan');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const port = process.env.PORT;
const {check, validationResult} = require('express-validator/check');
const NUMBER = 'number';
const uuidv1 = require('uuid/v1');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const socket = require('socket.io');
const http = require('http');
const axios = require('axios');
const server = http.createServer(app).listen(port, () => {
    console.log("Express server listening on port " + port);
});
const io = socket.listen(server);

app.use(express.json());
app.use(morgan('tiny'));
app.use(express.urlencoded({extended: false}));

setupDb();
setupHeaders();
setupGetters();
setupPosts();
setupUpdates();
setupDeletes();
setupSockets();

function setupDb() {
    db.defaults({
        horses: [],
        judges: [],
        ranks: [],
        users: [
            {
                name: "admin",
                password: bcrypt.hashSync("12345", 8)
            }
        ]
    }).write();
}

function setupHeaders() {
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
        next();
    });
}

function setupGetters() {
    app.get('/horses', (req, res) => {
        res.json(getTable(HORSES));
    });

    app.get('/horses/:id', (req, res) => {
        let fetched = getValueFromTable(HORSES, req.params.id);
        if (fetched != null) {
            res.json(fetched);
        } else {
            res.status(404).json(NOT_FOUND);
        }
    });

    app.get('/judges', (req, res) => {
        res.json(getTable(JUDGES));
    });

    app.get('/judges/:id', (req, res) => {
        let fetched = getValueFromTable(JUDGES, req.params.id);
        if (fetched != null) {
            res.json(fetched);
        } else {
            res.status(404).json(NOT_FOUND);
        }
    });

    app.get('/ranks', (req, res) => {
        res.json(getTable(RANKS));
    });

    app.get('/ranks/:id', (req, res) => {
        let fetched = getValueFromTable(RANKS, req.params.id);
        if (fetched != null) {
            res.json(fetched);
        } else {
            res.status(404).json(NOT_FOUND);
        }
    });
}

function getTable(tableName: string) {
    return db.get(tableName).value();
}

function getValueFromTable(tableName: string, id: string) {
    return db.get(tableName)
        .find({id: id}).value();
}

function setupPosts() {
    app.post('/reloadDb', (req, res) => {
        //TODO clear bazy
        //TODO request po konie i dodanie
        //TODO request po ranki i dodanie
        //TODO request po konie i dodanie
        //TODO jeżeli gdziekolwiek błąd to zwróć błąd
    });

    app.post('/login', (req, res) => {
        let user = db.get(USERS).find({name: req.body.name}).value() as User;

        if (!user) return res.status(404).send(NOT_FOUND);
        let passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
        if (!passwordIsValid) return res.status(401).send({auth: false, token: null});
        let token = jwt.sign({name: user.name}, "config.secret", {
            expiresIn: 86400 // expires in 24 hours
        });
        res.status(200).send({auth: true, token: token, user: user});
    });

    app.post('/horses',
        [
            check('rankId').isString(),
            check('yearOfBirth').isInt(),
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

            if (!isInRange(getAllNotes(req.body.notes), 0, 20, 0.5)) {
                return res.status(422).json(NOTES_NOT_IN_RANGE);
            }

            let horse = req.body;
            horse.id = uuidv1();
            horse.number = getFirstUnusedHorseNumber();
            horse.rank = getTable(RANKS).find(it => it.id == horse.rankId);
            delete horse.rankId;

            if (Object.keys(req.body).length != 12) {
                return res.status(422).json(TOO_MANY_PARAMETERS);
            }

            db.get(HORSES)
                .push(horse)
                .write();

            io.emit(HORSES, getTable(HORSES));
            res.json(horse);
        });

    app.post('/judges',
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

            io.emit(JUDGES, getTable(JUDGES));
            res.json(judge);
        });

    app.post('/ranks',
        [
            check('category').isString(),
            check('committee.*').isString(),
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
            //todo walidacja czy takie ranki istnieja przy tworzeniu/edytowaniu konia
            //todo walidacja czy rank ma dobrych judge
            db.get(RANKS)
                .push(rank)
                .write();

            io.emit(RANKS, getTable(RANKS));
            res.json(rank);
        });

    app.post('/rearrangeHorseNumbers',
        [
            check('horseNumber.*.id').isInt(),
            check('horseNumber.*.newNumber').isInt(),
        ],
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }
            let horseNumberList = req.body.horseNumberList;
            let uniqueValues = [];
            horseNumberList.forEach((item) => {
                if (!uniqueValues.includes(item)) {
                    uniqueValues.push(item)
                }
            });

            if (uniqueValues.length !== horseNumberList.length) {
                return res.status(422).json(DUPLICATED_NUMBERS);
            }

            if (!allHorsesExists(horseNumberList.map(item => item.id))) {
                return res.status(422).json(INVALID_HORSES_ID);
            }

            if (horseNumberList.map(item => item.newNumber).sort().some((item, index) => item != index + 1)) {
                return res.status(422).json(GAP_BETWEEN_NUMBERS);
            }

            horseNumberList.forEach((item) => {
                db.get(HORSES)
                    .find({id: item.id})
                    .assign({number: item.newNumber})
                    .write();
            });
            io.emit(HORSES, getTable(HORSES));
            res.json(req.body);
        });
}

function getFirstUnusedRankNumber(): number {
    let numbers = db.get(RANKS).map(NUMBER).value();

    return getFirstMissingValueFromArray(numbers);
}

function getFirstUnusedHorseNumber(): number {
    let numbers = db.get(HORSES).map(NUMBER).value();

    return getFirstMissingValueFromArray(numbers);
}

function getAllNotes(array: Array<Notes>): Array<number> {
    let arrays = array.map((value) => [value.head, value.legs, value.log, value.movement, value.type]);
    return [].concat(...arrays);
}

function allHorsesExists(ids: Array<number>) {
    let arrayFromDb = db.get(HORSES).value().map(item => item.id).sort();

    return ids.length == arrayFromDb.length && arrayFromDb.every((value, index) => {
        return value === ids.sort()[index]
    });
}

function setupUpdates() {
    app.put('/horses/:id', [
        check('number').isInt(),
        check('number', 'Number must be unique!')
            .exists()
            .custom((value, {req}) => value === getFirstUnusedHorseNumber() || horseNumberWasNotUpdated(value, req.params.id)),
        check('rankId').isString(),
        check('yearOfBirth').isInt(),
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

        if (!isInRange(getAllNotes(req.body.notes), 0, 20, 0.5)) {
            return res.status(422).json(NOTES_NOT_IN_RANGE);
        }
        let horse = req.body;
        horse.id = req.params.id;
        horse.rank = getTable(RANKS).find(it => it.id == horse.rankId);
        delete horse.rankId;

        if (Object.keys(req.body).length != 12) {
            return res.status(422).json(TOO_MANY_PARAMETERS);
        }

        db.get(HORSES)
            .find({id: req.params.id})
            .assign(horse)
            .write();
        if (db.get(HORSES)
            .find({id: req.params.id}).value() == null) {
            res.status(404).json(NOT_FOUND);
        } else {
            io.emit(HORSES, getTable(HORSES));
            res.json(horse);
        }
    });

    app.put('/judges/:id', [
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
            res.status(404).json(NOT_FOUND);
        } else {
            io.emit(JUDGES, getTable(JUDGES));
            res.json(judge);
        }
    });

    app.put('/ranks/:id', [
        check('number').isInt(),
        check('number', 'Number must be unique!')
            .exists()
            .custom((value, {req}) => value === getFirstUnusedRankNumber() || rankNumberWasNotUpdated(value, req.params.id)),
        check('category').isString(),
        check('committee.*').isString(),
        check('committee').isArray(),
    ], function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }
        let rank = req.body;
        rank.id = req.params.id;

        if (Object.keys(req.body).length != 4) {
            return res.status(422).json(TOO_MANY_PARAMETERS);
        }

        db.get(RANKS)
            .find({id: req.params.id})
            .assign(rank)
            .write();

        if (db.get(RANKS)
            .find({id: req.params.id}).value() == null) {
            res.status(404).json(NOT_FOUND);
        } else {
            io.emit(RANKS, getTable(RANKS));
            res.json(rank);
        }
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

function setupDeletes() {
    app.delete('/horses/:id', function (req, res) {
        let deleteConfirmed = removeFromDb(HORSES, req.params.id);
        if (deleteConfirmed) {
            reorderHorses();
            io.emit(HORSES, getTable(HORSES));
            res.json();
        } else {
            res.status(404).json(NOT_FOUND);
        }
    });

    app.delete('/judges/:id', function (req, res) {
        let deleteConfirmed = removeFromDb(JUDGES, req.params.id);
        if (deleteConfirmed) {
            io.emit(JUDGES, getTable(JUDGES));

            res.json();
        } else {
            res.status(404).json(NOT_FOUND);
        }
    });

    app.delete('/ranks/:id', function (req, res) {
        let deleteConfirmed = removeFromDb(RANKS, req.params.id);
        if (deleteConfirmed) {
            io.emit(RANKS, getTable(RANKS));
            res.json();
        } else {
            res.status(404).json(NOT_FOUND);
        }
    });
}

function removeFromDb(dbName: string, id: string): boolean {
    let toRemove = db.get(dbName).find({id: id}).value();
    if (toRemove) {
        db.get(dbName)
            .remove(toRemove)
            .write();
    }

    return toRemove != null;
}

function reorderHorses() {
    //TODO bulk insert z generatora
    //TODO write that method
    //TODO Add basic auth
    //TODO koń numer ma trafiać na wolne miejsce
    //TODO po usunięciu konia mają się mergować miejsca
    //TODO blokowamie usuwania sędziego jeżeli jesst w jakiejś klasie
    //TODO blokowanie usuwania klasy jeżeli jest jakiś koń przypisany do niej
    //TODO klasa ma pole "zakończona"
    //TODO klasa ma W KLIENCIE pole zakończona
    //TODO popraw pola w generatorze danych
    //TODO postaw generator na heroku
}

function setupSockets() {
    io.on('connection', () => {
        io.emit(JUDGES, getTable(JUDGES));
        io.emit(HORSES, getTable(HORSES));
        io.emit(RANKS, getTable(RANKS));
    });
}

