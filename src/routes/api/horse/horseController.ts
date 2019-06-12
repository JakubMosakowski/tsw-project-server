import {HORSES} from "../../../models/tableNames";
import {
    HORSE_NOT_FOUND
} from "../../../models/errorMessages";
import {io} from "../../../app";
import {HorseModel} from "../../../data/MongoManager";
import {horsePostValidator, horsePutValidator, horseRearrangeValidator} from "./horseValidator";

const {validationResult} = require('express-validator/check');

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const horses =
        await HorseModel.all();
    res.json(horses)
});

router.post('/',
    horsePostValidator,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }

        let horse = req.body;
        horse.number = await getFirstUnusedHorseNumber();
        horse.notes = [];
        horse = await HorseModel.create(horse);

        const horses = await HorseModel.all();

        io.emit(HORSES, horses);
        res.json(horse);
    });

router.put('/:id', horsePutValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    let horse = req.body;
    horse.id = req.params.id;
    horse = await HorseModel.findByIdAndUpdate(horse.id, horse);

    const horses = await HorseModel.all();

    io.emit(HORSES, horses);
    res.json(horse);
});

router.post('/rearrangeHorseNumbers', horseRearrangeValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    req.body.horseNumberList.forEach((item) => {
        HorseModel.findByIdAndUpdate(item.id, {number: item.newNumber});
    });
    const horses = await HorseModel.all();

    io.emit(HORSES, horses);
    res.json(req.body);
});

async function getFirstUnusedHorseNumber(): Promise<Number> {
    let numbers = (await HorseModel.find()).map(item => item.number);
    if (numbers.length == 0) {
        numbers.push(0)
    }
    return Math.max(...numbers) + 1;
}

//todo ogarnij klasy
//todo sprawdz post dla rank
//todo sprawdz get dla rank
//todo sprawdz put dla rank
//TODO blokowanie usuwania klasy jeżeli jest jakiś koń przypisany do niej


//sprawdz reordeing method dla koni

//todo logowanie
//TODO heroku env variables przekaż
//TODO Add basic auth

//todo niech będzie można połączyć się po lokalce

async function reorderHorses(number: number) {
    return await HorseModel.updateMany({number: {$gt: number}}, {$inc: {number: -1}});
}

router.delete('/:id', async (req, res) => {
    HorseModel.findByIdAndRemove(req.params.id, async (e, item) => {
        if (e || !item) {
            return res.status(404).json(HORSE_NOT_FOUND);
        } else {
            await reorderHorses(item.number);
            const horses = await HorseModel.all();

            io.emit(HORSES, horses);
            res.json();
        }
    });
});

module.exports = router;
