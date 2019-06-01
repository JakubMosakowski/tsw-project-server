/* jshint strict: global, esversion: 6, devel: true, node: true */
'use strict';
import {Notes} from "./models/horse";
import {
    DUPLICATED_NUMBERS, GAP_BETWEEN_NUMBERS, INVALID_HORSES_ID,
    NON_EXISTENT_HORSE_IDS, NON_EXISTENT_JUDGE_IDS, NON_EXISTENT_RANK_IDS,
    NOT_FOUND,
    NOTES_NOT_IN_RANGE,
    TOO_MANY_PARAMETERS
} from "./models/errorMessages";
import {CONTESTS, HORSES, JUDGES, RANKS} from "./models/tableNames";
import {getFirstMissingValueFromArray, isInRange} from "./extensions";

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
const NUMBER = 'number';
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
//todo getters, danych o sędziach
//todo getters, danych o klasach
//todo getters, danych o koniach
//todo getters, danych o pokazach
//todo logowanie

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

function clearDB() {
    const newState = {};
    db.setState(newState);
    db.write();
    db.defaults({
        contests: [],
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

function setupPosts() {
    app.post('/contest',
        [
            check('horseIds').isArray(),
            check('judgeIds').isArray(),
            check('rankIds').isArray(),
            check('horseIds.*').isString(),
            check('judgeIds.*').isString(),
            check('rankIds.*').isString(),
            check('horseIds', NON_EXISTENT_HORSE_IDS.msg)
                .exists()
                .custom((value) => verifyIds(HORSES, value)),

            check('judgeIds', NON_EXISTENT_JUDGE_IDS)
                .exists()
                .custom((value) => verifyIds(JUDGES, value)),

            check('rankIds', NON_EXISTENT_RANK_IDS)
                .exists()
                .custom((value) => verifyIds(RANKS, value)),
        ],
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({errors: errors.array()});
            }

            let contest = req.body;
            contest.id = uuidv1();

            if (Object.keys(req.body).length != 4) {
                return res.status(422).json(TOO_MANY_PARAMETERS);
            }

            contest.horseIds = [...new Set(contest.horseIds)];
            contest.judgeIds = [...new Set(contest.judgeIds)];
            contest.rankIds = [...new Set(contest.rankIds)];

            db.get(CONTESTS)
                .push(contest)
                .write();

            res.json(contest);
        });

    app.post('/horse',
        [
            check('rankId').isInt(),
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
            check('committee.*').isInt(),
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

function verifyIds(tableName: string, array: Array<string>) {
    return array.every(item => db.get(tableName).value().map(item => item.id).includes(item));
}

function setupUpdates() {
    app.put('/contest/:id', [
        check('horseIds').isArray(),
        check('judgeIds').isArray(),
        check('rankIds').isArray(),
        check('horseIds.*').isString(),
        check('judgeIds.*').isString(),
        check('rankIds.*').isString(),
        check('horseIds', NON_EXISTENT_HORSE_IDS.msg)
            .exists()
            .custom((value) => verifyIds(HORSES, value)),

        check('judgeIds', NON_EXISTENT_JUDGE_IDS)
            .exists()
            .custom((value) => verifyIds(JUDGES, value)),

        check('rankIds', NON_EXISTENT_RANK_IDS)
            .exists()
            .custom((value) => verifyIds(RANKS, value)),

    ], function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }

        let contest = req.body;
        contest.id = req.params.id;

        if (Object.keys(req.body).length != 4) {
            return res.status(422).json(TOO_MANY_PARAMETERS);
        }

        db.get(CONTESTS)
            .find({id: req.params.id})
            .assign(contest)
            .write();
        if (db.get(CONTESTS)
            .find({id: req.params.id}).value() == null) {
            res.json(NOT_FOUND);
        } else {
            res.json(contest);
        }
    });

    app.put('/horse/:id', [
        check('number').isInt(),
        check('number', 'Number must be unique!')
            .exists()
            .custom((value, {req}) => value === getFirstUnusedHorseNumber() || horseNumberWasNotUpdated(value, req.params.id)),
        check('rankId').isInt(),
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
        check('number').isInt(),
        check('number', 'Number must be unique!')
            .exists()
            .custom((value, {req}) => value === getFirstUnusedRankNumber() || rankNumberWasNotUpdated(value, req.params.id)),
        check('category').isString(),
        check('committee.*').isInt(),
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
            res.json(NOT_FOUND);
        } else {
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
    app.delete('/contest/:id', function (req, res) {
        let deleteConfirmed = removeFromDb(CONTESTS, req.params.id);
        if (deleteConfirmed) {
            res.json();
        } else {
            res.json({msg: NOT_FOUND});
        }
    });

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


function removeFromDb(dbName: string, id: string): boolean {
    let toRemove = db.get(dbName).find({id: id}).value();
    db.get(dbName)
        .remove(toRemove)
        .write();
    return toRemove != null;
}
