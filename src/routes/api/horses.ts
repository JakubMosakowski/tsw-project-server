import {HORSES} from "../../models/tableNames";
import {
    NOT_FOUND,
    NOTES_NOT_IN_RANGE, NUMBER_OF_NOTES_WRONG,
    TOO_MANY_PARAMETERS
} from "../../models/errorMessages";
import {isInRange} from "../../extensions";
import {Notes} from "../../models/horse";
import {io} from "../../app";
import {HorseModel, RankModel} from "../../data/MongoManager";
import {Rank} from "../../models/rank";

const {check, validationResult} = require('express-validator/check');

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const horses = await HorseModel.find({});
    res.send(horses)
});

router.post('/',
    [
        check('name').isString(),
        check('country').isString(),
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
        check('lineage.mothersFather.country').isString()
    ],
    async (req, res) => {
        console.log(req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }
        if (Object.keys(req.body).length != 9) {
            return res.status(422).json(TOO_MANY_PARAMETERS);
        }

        let horse = req.body;
        horse.number = await getFirstUnusedHorseNumber();
        horse.notes = [];
        horse.rank = await RankModel.findById(horse.rankId).catch(e => console.log(e));
        delete horse.rankId;

        horse = await HorseModel.create(horse).catch(e => console.log(e));
        const horses = await HorseModel.find({});

        io.emit(HORSES, horses);
        res.json(horse);
    });

router.put('/:id', [
    check('name').isString(),
    check('country').isString(),
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
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }
    if (Object.keys(req.body).length != 10) {
        return res.status(422).json(TOO_MANY_PARAMETERS);
    }
    if (!isInRange(getAllNotes(req.body.notes), 0, 20, 0.5)) {
        return res.status(422).json(NOTES_NOT_IN_RANGE);
    }

    let foundHorse = await HorseModel.findById(req.params.id)
        .catch(() => res.status(404).json(NOT_FOUND));
    if (foundHorse == null) {
        res.status(404).json(NOT_FOUND);
    }

    let horse = req.body;
    let rank = await RankModel.findById(horse.rankId).catch(() => res.status(404).json(NOT_FOUND)) as Rank;
    if (horse.notes.length != rank.committee.length) {
        res.status(422).json(NUMBER_OF_NOTES_WRONG)
    }
    horse.id = req.params.id;
    horse.rank = rank;
    delete horse.rankId;

    await HorseModel.findByIdAndUpdate(horse.id, horse);
    const horses = await HorseModel.find({});

    io.emit(HORSES, horses);
    res.json(horse);
});

//
// router.post('/rearrangeHorseNumbers',
//     [
//         check('horseNumber.*.id').isInt(),
//         check('horseNumber.*.newNumber').isInt(),
//     ],
//     (req, res) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(422).json({errors: errors.array()});
//         }
//         let horseNumberList = req.body.horseNumberList;
//         let uniqueValues = [];
//         horseNumberList.forEach((item) => {
//             if (!uniqueValues.includes(item)) {
//                 uniqueValues.push(item)
//             }
//         });
//
//         if (uniqueValues.length !== horseNumberList.length) {
//             return res.status(422).json(DUPLICATED_NUMBERS);
//         }
//
//         if (!allHorsesExists(horseNumberList.map(item => item.id))) {
//             return res.status(422).json(INVALID_HORSES_ID);
//         }
//
//         if (horseNumberList.map(item => item.newNumber).sort().some((item, index) => item != index + 1)) {
//             return res.status(422).json(GAP_BETWEEN_NUMBERS);
//         }
//
//         horseNumberList.forEach((item) => {
//             db.get(HORSES)
//                 .find({id: item.id})
//                 .assign({number: item.newNumber})
//                 .write();
//         });
//         io.emit(HORSES, getTable(HORSES));
//         res.json(req.body);
//     });
//
function getAllNotes(array: Array<Notes>): Array<number> {
    let arrays = array.map((value) => [value.head, value.legs, value.log, value.movement, value.type]);
    return [].concat(...arrays);
}

// function allHorsesExists(ids: Array<number>) {
//     let arrayFromDb = db.get(HORSES).value().map(item => item.id).sort();
//
//     return ids.length == arrayFromDb.length && arrayFromDb.every((value, index) => {
//         return value === ids.sort()[index]
//     });
// }

async function getFirstUnusedHorseNumber(): Promise<Number> {
    let numbers = (await HorseModel.find()).map(item => item.number);
    if (numbers.length == 0) {
        numbers.push(1)
    }
    return Math.max(...numbers) + 1;
}

function reorderHorses() {
    //TODO bulk insert z generatora
    //TODO heroku env variables przekaż
    //TODO Add basic auth
    //TODO write that method
    //TODO koń numer ma trafiać na wolne miejsce
    //TODO po usunięciu konia mają się mergować miejsca
    //TODO blokowamie usuwania sędziego jeżeli jesst w jakiejś klasie
    //TODO blokowanie usuwania klasy jeżeli jest jakiś koń przypisany do niej
    //todo niech będzie można połączyć się po lokalce
}

// router.delete('/horses/:id', function (req, res) {
//     let deleteConfirmed = removeFromDb(HORSES, req.params.id);
//     if (deleteConfirmed) {
//         reorderHorses();
//         io.emit(HORSES, getTable(HORSES));
//         res.json();
//     } else {
//         res.status(404).json(NOT_FOUND);
//     }
// });

module.exports = router;
