import {body, check, ValidationChain} from "express-validator/check";
import {
    DUPLICATED_NUMBERS,
    INCORRECT_ID,
    JUDGE_NOT_FOUND,
    RANK_IS_USED,
    RANK_NOT_FOUND,
    TOO_MANY_PARAMETERS
} from "../../../models/errorMessages";
import {HorseModel, JudgeModel, RankModel} from "../../../data/MongoManager";
import {sanitizedString} from "../customSanitizers";
import {checkUniqueValues} from "../../../extensions";

export const rankDeleteValidator = [
    check('id')
        .custom(async val => await HorseModel.find({rank: {id: val}}))
        .withMessage(RANK_IS_USED)
];

const checkCommittee =
    (): ValidationChain => {

        return check('committee')
            .isArray()
            .custom(async val => checkUniqueValues(val) && val.every(async id => await JudgeModel.findById(id).catch()))
            .withMessage(JUDGE_NOT_FOUND)
    };

const rankValidator = [
    sanitizedString('category'),
    check('committee.*')
        .isMongoId()
        .withMessage(INCORRECT_ID),
    checkCommittee()];

export const rankPostValidator = rankValidator.concat([
    body()
        .custom(val => Object.keys(val).length === 2)
        .withMessage(TOO_MANY_PARAMETERS)
]);

export const rankPutValidator = rankValidator.concat([
    check('id')
        .custom(async val => (await RankModel.findById(val)) !== null)
        .withMessage(RANK_NOT_FOUND),
    check('number')
        .custom(async val => (await RankModel.all()).map(rank => rank.number).includes(val))
        .withMessage(DUPLICATED_NUMBERS),
    check('ended').isBoolean(),
    body()
        .custom(val => Object.keys(val).length === 4)
        .withMessage(TOO_MANY_PARAMETERS)
]);

