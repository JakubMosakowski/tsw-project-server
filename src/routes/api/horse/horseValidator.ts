import {body, check, ValidationChain} from "express-validator/check";
import {HorseModel, RankModel} from "../../../data/MongoManager";
import {
    DUPLICATED_NUMBERS, GAP_BETWEEN_NUMBERS,
    HORSE_NOT_FOUND,
    NUMBER_OF_NOTES_WRONG,
    RANK_NOT_FOUND, TOO_MANY_PARAMETERS, WRONG_SIZE_OF_LIST
} from "../../../models/errorMessages";
import {sanitizedString} from "../customSanitizers";

const isExistingRank =
    (): ValidationChain => {
        return sanitizedString('rank')
            .isMongoId()
            .custom(async val => await RankModel.isExistingRank(val))
            .withMessage(RANK_NOT_FOUND)
    };

const isExistingHorse =
    (fieldName): ValidationChain => {
        return sanitizedString(fieldName)
            .isMongoId()
            .custom(async val => await HorseModel.isExistingHorse(val))
            .withMessage(HORSE_NOT_FOUND)
    };

const validateNoteNumber =
    (fieldName): ValidationChain => {
        return check(fieldName)
            .isNumeric()
            .custom(val => val >= 0 && val <= 20 && val % 0.5 == 0)
    };

const validateNotesLength =
    (): ValidationChain => {
        return check('notes')
            .isArray()
            .custom(async (val, {req}) =>
                (await RankModel.findById(req.body.rank)).committee.length == val.length)
            .withMessage(NUMBER_OF_NOTES_WRONG)
    };

const checkCorrectnessOfNumbers =
    (): ValidationChain => {
        return checkGaps()
            .custom(async val => {
                const correctLength = await HorseModel.find({}).length;

                return val.length == correctLength
            })
            .withMessage(WRONG_SIZE_OF_LIST);
    };

const checkGaps =
    (): ValidationChain => {
        return checkUniqueness()
            .custom(val =>
                val.map(item => item.newNumber).sort().some((item, index) => item != index + 1))
            .withMessage(GAP_BETWEEN_NUMBERS);
    };

const checkUniqueness =
    (): ValidationChain => {
        return check('horseNumberList').custom(val => {
            let uniqueValues = [];
            val.forEach((item) => {
                if (!uniqueValues.includes(item)) {
                    uniqueValues.push(item)
                }
            });

            return uniqueValues.length !== val.length
        }).withMessage(DUPLICATED_NUMBERS);
    };

const horseValidator = [
    sanitizedString('name'),
    sanitizedString('country'),
    isExistingRank(),
    check('yearOfBirth').isInt().custom(val => val > 1950 && val < new Date().getFullYear()),
    sanitizedString('color'),
    sanitizedString('sex'),
    sanitizedString('breeder.name'),
    sanitizedString('breeder.country'),
    sanitizedString('owner.name'),
    sanitizedString('owner.country'),
    sanitizedString('lineage.father.name'),
    sanitizedString('lineage.father.country'),
    sanitizedString('lineage.mother.name'),
    sanitizedString('lineage.mother.country'),
    sanitizedString("lineage.mothersFather.name"),
    sanitizedString('lineage.mothersFather.country')
];

export const horsePostValidator = horseValidator.concat([
    body().custom(val => Object.keys(val).length === 9).withMessage(TOO_MANY_PARAMETERS)
]);

export const horsePutValidator = horseValidator.concat([
    check('id').custom(async val => (await HorseModel.findById(val)) !== null).withMessage(HORSE_NOT_FOUND),
    validateNotesLength(),
    validateNoteNumber('notes.*.horseType'),
    validateNoteNumber('notes.*.head'),
    validateNoteNumber('notes.*.log'),
    validateNoteNumber('notes.*.legs'),
    validateNoteNumber('notes.*.movement'),
    body().custom(val => Object.keys(val).length === 10).withMessage(TOO_MANY_PARAMETERS)
]);

export const horseRearrangeValidator = [
    isExistingHorse('horseNumberList.*.id'),
    check('horseNumberList.*.newNumber').isInt(),
    checkCorrectnessOfNumbers()
];
