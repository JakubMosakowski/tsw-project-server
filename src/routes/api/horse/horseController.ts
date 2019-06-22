import {HORSES} from "../../../models/tableNames";
import {
    HORSE_NOT_FOUND
} from "../../../models/errorMessages";
import {io} from "../../../app";
import {HorseModel, RankModel} from "../../../data/MongoManager";
import {horsePostValidator, horsePutValidator, horseRearrangeValidator} from "./horseValidator";
import {firstUnusedInteger} from "../../../extensions";
import {Notes} from "../../../models/horse";
import {APIError} from "../../../models/APIError";

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
        horse.arbitratorValue = 0;
        horse.notes = await fillWithZeros(horse.rank);
        horse = await HorseModel.create(horse);

        const horses = await HorseModel.all();

        io.emit(HORSES, horses);
        res.json(horses.find(item => item.id == horse.id));
    });

router.put('/:id', horsePutValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    let horse = req.body;
    horse.id = req.params.id;
    const oldHorse = await HorseModel.findById(horse.id);
    horse.number = oldHorse.number;

    if (oldHorse.rank.id != horse.rank) {
        horse.notes = await fillWithZeros(horse.rank);
    }

    await HorseModel.findByIdAndUpdate(horse.id, horse);

    const horses = await HorseModel.all();

    io.emit(HORSES, horses);
    res.json(horses.find(item => item.id == horse.id));
});

router.post('/rearrangeHorseNumbers', horseRearrangeValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    for (const item of req.body.horseNumberList) {
        await HorseModel.findByIdAndUpdate(item.id, {number: item.newNumber});
    }

    const horses = await HorseModel.all();

    io.emit(HORSES, horses);
    res.json(horses);
});

async function fillWithZeros(id): Promise<[Notes]> {
    const committee = (await RankModel.findById(id)).committee;

    return committee.map(item => {
        return {
            judge: item.id,
            horseType: 0,
            head: 0,
            log: 0,
            legs: 0,
            movement: 0
        }
    })
}

async function getFirstUnusedHorseNumber(): Promise<Number> {
    const array = (await HorseModel.find()).map(horse => horse.number);
    return firstUnusedInteger(array);
}

async function reorderHorses(number: number) {
    return await HorseModel.updateMany({number: {$gt: number}}, {$inc: {number: -1}});
}

router.delete('/:id', async (req, res) => {
    HorseModel.findByIdAndRemove(req.params.id, async (e, item) => {
        if (e || !item) {
            return res.status(404).send({errors: [new APIError(HORSE_NOT_FOUND)]});
        } else {
            await reorderHorses(item.number);
            const horses = await HorseModel.all();

            io.emit(HORSES, horses);
            res.json();
        }
    });
});

module.exports = router;
