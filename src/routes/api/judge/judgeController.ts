import {JudgeModel} from "../../../data/MongoManager";
import {JUDGE_NOT_FOUND} from "../../../models/errorMessages";
import {JUDGES} from "../../../models/tableNames";
import {io} from "../../../app";
import {judgeDeleteValidator, judgePostValidator, judgePutValidator} from "./judgeValidator";

const {validationResult} = require('express-validator/check');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const judges =
        await JudgeModel.all();
    res.json(judges)
});

router.post('/',
    judgePostValidator,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        }
        const judge = await JudgeModel.create(req.body);

        const judges = await JudgeModel.all();

        io.emit(JUDGES, judges);
        res.json(judges.find(item => item.id == judge.id));
    });

router.put('/:id', judgePutValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    let judge = req.body;
    judge.id = req.params.id;
    await JudgeModel.findByIdAndUpdate(judge.id, judge);

    const judges = await JudgeModel.all();

    io.emit(JUDGES, judges);
    res.json(judges.find(item => item.id == judge.id));
});

router.delete('/:id', judgeDeleteValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    JudgeModel.findByIdAndRemove(req.params.id, async (e, item) => {
        if (e || !item) {
            return res.status(404).send({errors: [JUDGE_NOT_FOUND]});
        } else {
            const judges = await JudgeModel.all();

            io.emit(JUDGES, judges);
            res.json();
        }
    });
});

module.exports = router;
