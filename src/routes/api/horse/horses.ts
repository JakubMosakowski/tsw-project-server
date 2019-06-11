import {HORSES} from "../../../models/tableNames";
import {
    DUPLICATED_NUMBERS,
    GAP_BETWEEN_NUMBERS,
    INVALID_HORSES_ID,
    NOT_FOUND,
    NOTES_NOT_IN_RANGE,
    NUMBER_OF_NOTES_WRONG, RANK_NOT_FOUND,
    TOO_MANY_PARAMETERS
} from "../../../models/errorMessages";
import {isInRange} from "../../../extensions";
import {Notes} from "../../../models/horse";
import {io} from "../../../app";
import {HorseModel, RankModel} from "../../../data/MongoManager";
import {horsePutValidator, horseRearrangeValidator, horseValidator} from "./horsesValidators";

const {validationResult} = require('express-validator/check');

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const horses =
        await HorseModel.find({});
    res.send(horses)
});

router.post('/',
    horseValidator,
    async (req, res) => {
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
        horse.rank = await RankModel.findById(horse.rankId, (err, rank) => {
            if (!rank || err) {
                return res.status(404).json(RANK_NOT_FOUND)
            }
        });
        delete horse.rankId;

        horse = await HorseModel.create(horse);
        const horses = await HorseModel.find({});

        io.emit(HORSES, horses);
        res.json(horse);
    });

router.put('/:id', horsePutValidator, async (req, res) => {
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

    await HorseModel.findById(req.params.id, (err, horse) => {
            if (!horse || err) {
                return res.status(404).json(NOT_FOUND)
            }
        });


    let horse = req.body;
    let rank = await RankModel
        .findById(horse.rankId, (err, rank) => {
            if (!rank || err) {
                return res.status(404).json(RANK_NOT_FOUND)
            }
        });

    if (horse.notes.length != rank.committee.length) {
        return res.status(422).json(NUMBER_OF_NOTES_WRONG)
    }

    horse.id = req.params.id;
    horse.rank = rank;
    delete horse.rankId;

    await HorseModel.findByIdAndUpdate(horse.id, horse);
    const horses = await HorseModel.find({});

    io.emit(HORSES, horses);
    res.json(horse);
});

router.post('/rearrangeHorseNumbers', horseRearrangeValidator, async (req, res) => {
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

    if (!await allHorsesExists(horseNumberList.map(item => item.id))) {
        return res.status(422).json(INVALID_HORSES_ID);
    }

    if (horseNumberList.map(item => item.newNumber).sort().some((item, index) => item != index + 1)) {
        return res.status(422).json(GAP_BETWEEN_NUMBERS);
    }

    horseNumberList.forEach((item) => {
        HorseModel.findByIdAndUpdate(item.id, {number: item.newNumber});
    });
    const horses = await HorseModel.find({});

    io.emit(HORSES, horses);
    res.json(req.body);
});

function getAllNotes(array: Array<Notes>): Array<number> {
    let arrays = array.map((value) => [value.head, value.legs, value.log, value.movement, value.type]);
    return [].concat(...arrays);
}

async function allHorsesExists(ids: Array<number>) {
    const idsFromDb = await HorseModel.find({}).map(item => item.id).sort();

    return ids.length == idsFromDb.length && idsFromDb.every((value, index) => {
        return value === ids.sort()[index]
    });
}

async function getFirstUnusedHorseNumber(): Promise<Number> {
    let numbers = (await HorseModel.find()).map(item => item.number);
    if (numbers.length == 0) {
        numbers.push(0)
    }
    return Math.max(...numbers) + 1;
}

//todo ogarnij sędziów
//TODO blokowamie usuwania sędziego jeżeli jesst w jakiejś klasie
//todo ogarnij klasy
//todo sprawdź wszystkie możliwe requesty dla judge
//todo sprawdź wszystkie możliwe requesty dla rank
//TODO blokowanie usuwania klasy jeżeli jest jakiś koń przypisany do niej

//todo sprawdz update dla horse
//todo sprawdz post dla horse
//todo sprawdz get dla horse
//todo sprawdz delete dla horse
//todo sprawdz reorder dla horses

//todo pokmiń nad error handlingiem (extraktowaniem tego gdzie indziej - czytnij jakiś artykuł or smth.)
//TODO bulk insert z generatora
//TODO heroku env variables przekaż
//TODO Add basic auth
//todo niech będzie można połączyć się po lokalce

async function reorderHorses(number: number) {
    return await HorseModel.updateMany({number: {$gt: number}}, {$inc: {number: -1}});
}

router.delete('/:id', async (req, res) => {
    await HorseModel.findByIdAndRemove(req.params.id, async (e, item) => {
        if (e) {
            return res.status(404).json(NOT_FOUND);
        } else {
            await reorderHorses(item.number);
            const horses = await HorseModel.find({});

            io.emit(HORSES, horses);
            res.json();
        }
    });
});

module.exports = router;
