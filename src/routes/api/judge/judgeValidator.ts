import {body, check} from "express-validator/check";
import {JUDGE_IS_USED, JUDGE_NOT_FOUND, TOO_MANY_PARAMETERS} from "../../../models/errorMessages";
import {JudgeModel} from "../../../data/MongoManager";
import {sanitizedString} from "../customSanitizers";

export const judgeDeleteValidator = [
    check('id').custom(async val => await JudgeModel.checkIfUsed(val)).withMessage(JUDGE_IS_USED)
];

export const judgePostValidator = [
    sanitizedString('name'),
    sanitizedString('country'),
    body().custom(val => Object.keys(val).length === 2).withMessage(TOO_MANY_PARAMETERS)
];

export const judgePutValidator = judgePostValidator.concat([
    check('id').custom(async val => (await JudgeModel.findById(val)) !== null).withMessage(JUDGE_NOT_FOUND)
]);

