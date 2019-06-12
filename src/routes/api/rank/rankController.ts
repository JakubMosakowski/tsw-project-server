import {RankModel} from "../../../data/MongoManager";
import {io} from "../../../app";
import {RANKS} from "../../../models/tableNames";
import {firstUnusedInteger} from "../../../extensions";
import {rankDeleteValidator, rankPostValidator, rankPutValidator} from "./rankValidator";
import {RANK_NOT_FOUND} from "../../../models/errorMessages";

const {validationResult} = require('express-validator/check');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const ranks =
        await RankModel.all();
    res.json(ranks)
});

//todo ogarnij put
//todo ogarnij delete
//todo sprawdz post dla rank
//todo sprawdz get dla rank
//todo sprawdz put dla rank
//todo sprawdz delete dla rank

router.post('/',
    rankPostValidator,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }

        let rank = req.body;
        rank.ended = false;
        rank.number = await getFirstUnusedRankNumber();
        rank = await RankModel.create(rank);

        const ranks = await RankModel.all();

        io.emit(RANKS, ranks);
        res.json(rank);
    });

router.put('/:id', rankPutValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    let rank = req.body;
    rank.id = req.params.id;
    const oldCommittee = (await RankModel.findById(rank.id)).committee;

    await RankModel.findByIdAndUpdate(rank.id, rank);

//todo jak zmienią się sędziowe to każdemu koniu w klasie wyzeruj noty od tego sędziego
    if (oldCommittee != req.body.committee) {
        clearNotesFromEveryHorseInRank(oldCommittee, req.body.committee)
    }

    const ranks = await RankModel.all();

    io.emit(RANKS, ranks);
    res.json();
});

router.delete('/:id', rankDeleteValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    RankModel.findByIdAndRemove(req.params.id, async (e, item) => {
        if (e || !item) {
            return res.status(404).json(RANK_NOT_FOUND);
        } else {
            const ranks = await RankModel.all();

            io.emit(RANKS, ranks);
            res.json();
        }
    });
});

async function getFirstUnusedRankNumber(): Promise<Number> {
    return firstUnusedInteger((await RankModel.find()).map(rank => rank.number));
}

module.exports = router;
