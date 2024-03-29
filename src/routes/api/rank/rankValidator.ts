import {body, check, ValidationChain} from "express-validator/check";
import {
    DUPLICATED_JUDGES,
    DUPLICATED_NUMBERS,
    INCORRECT_ID,
    JUDGE_NOT_FOUND,
    RANK_IS_USED,
    RANK_NOT_FOUND,
    TOO_MANY_PARAMETERS, VALUE_IS_INVALID
} from "../../../models/errorMessages";
import {HorseModel, JudgeModel, RankModel} from "../../../data/MongoManager";
import {sanitizedString} from "../customSanitizers";
import {checkUniqueValues} from "../../../extensions";

export const rankDeleteValidator = [
    check('id')
        .isMongoId()
        .withMessage(INCORRECT_ID)
        .custom(async val => (await HorseModel.find({rank: val}).catch(e => console.log(e))).length == 0)
        .withMessage(RANK_IS_USED)
];

const checkJudgesInCommittee =
    (): ValidationChain => {
        return check('committee')
            .isArray()
            .custom(async val => checkUniqueValues(val) == val.length)
            .withMessage(DUPLICATED_JUDGES)
            .custom(async val => {
                    let pass = true;
                    for (const id of val) {
                        pass = (await JudgeModel.findById(id)) != null;
                        if (!pass) return false
                    }
                    return pass
                }
            )
            .withMessage(JUDGE_NOT_FOUND)
    };

const rankValidator = [
    sanitizedString('category').withMessage(VALUE_IS_INVALID("Kategoria")),
    check('committee.*')
        .isMongoId()
        .withMessage(INCORRECT_ID),
    checkJudgesInCommittee(),
    body()
        .custom(val => Object.keys(val).length === 4)
        .withMessage(TOO_MANY_PARAMETERS)
];

export const rankPostValidator = rankValidator.concat([
    check('number')
        .custom(async (val) =>
            !(await RankModel.all()).map(rank => rank.number).includes(val)
        )
        .withMessage(DUPLICATED_NUMBERS),
    check('finished').isBoolean().withMessage(VALUE_IS_INVALID("Zakończono")),

]);

export const rankPutValidator = rankValidator.concat([
    check('id')
        .custom(async val => (await RankModel.findById(val)) !== null)
        .withMessage(RANK_NOT_FOUND),
    check('number')
        .custom(async (val, {req}) => {
            if (val == (await RankModel.findById(req.params.id)).number)
                return true;

            return !(await RankModel.all()).map(rank => rank.number).includes(val)
        })
        .withMessage(DUPLICATED_NUMBERS)
]);

