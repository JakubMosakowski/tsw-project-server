import {HorseModel, RankModel} from "../../../data/MongoManager";
import {io} from "../../../app";
import {RANKS} from "../../../models/tableNames";
import {firstUnusedInteger} from "../../../extensions";
import {rankDeleteValidator, rankPostValidator, rankPutValidator} from "./rankValidator";
import {RANK_NOT_FOUND} from "../../../models/errorMessages";
import {Rank} from "../../../models/rank";
import {APIError} from "../../../models/APIError";

const {validationResult} = require('express-validator/check');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const ranks =
        await RankModel.all();
    res.json(ranks)
});

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
        res.json(ranks.find(item => item.id == rank.id));
    });

router.put('/:id', rankPutValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    let rank = req.body;
    rank.id = req.params.id;
    const oldRank = (await RankModel.findById(rank.id)).toObject();

    if (oldRank.committee.map(item => item.id) != req.body.committee) {
        await clearNotesFromEveryHorseInRank(oldRank, req.body.committee)
    }
    await RankModel.findByIdAndUpdate(rank.id, rank);

    const ranks = await RankModel.all();
    io.emit(RANKS, ranks);
    res.json(ranks.find(item => item.id == rank.id));
});

router.delete('/:id', rankDeleteValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    RankModel.findByIdAndRemove(req.params.id, async (e, item) => {
        if (e || !item) {
            return res.status(404).send({errors: [new APIError(RANK_NOT_FOUND)]});
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

async function clearNotesFromEveryHorseInRank(rank: Rank, committee: [string]) {
    const oldCommittee = rank.committee.map(item => item.id);

    for (const id of committee) {
        if (!oldCommittee.includes(id)) {
             await HorseModel.addNewJudgeToHorses(rank.id,id);
        }
    }

    for (const id of oldCommittee) {
        if (!committee.includes(id)) {
            await HorseModel.removeJudgeFromHorses(rank.id,id)
        }
    }
}

module.exports = router;
