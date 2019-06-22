import {body, check, ValidationChain} from "express-validator/check";
import {HorseModel, RankModel} from "../../../data/MongoManager";
import {
    ARBITRATOR_VALUE_WRONG,
    DUPLICATED_NUMBERS, GAP_BETWEEN_NUMBERS,
    HORSE_NOT_FOUND, NOTES_NOT_IN_RANGE, NOTES_WRONG, RANK_IS_ENDED,
    RANK_NOT_FOUND, TOO_MANY_PARAMETERS, VALUE_IS_INVALID, WRONG_SIZE_OF_LIST
} from "../../../models/errorMessages";
import {sanitizedString} from "../customSanitizers";
import {checkUniqueValues} from "../../../extensions";
const MAX_PUT_PARAMS = 11;
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
            .withMessage(NOTES_NOT_IN_RANGE)
    };

const validateNotesIds =
    (): ValidationChain => {
        return check('notes')
            .isArray()
            .custom(async (val, {req}) => {
                const {committee} = (await RankModel.findById(req.body.rank));
                const ids = val.map(item => item.judge);

                return checkUniqueValues(ids) == committee.length
                    && ids.every(i => committee.find(judge => judge.id == i) !== undefined)
            })
            .withMessage(NOTES_WRONG)
    };

const checkCorrectnessOfNumbers =
    (): ValidationChain => {
        return checkGaps()
            .custom(async val => {
                const correctLength = (await HorseModel.find({})).length;

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
        return check('horseNumberList')
            .custom(val => checkUniqueValues(val) == val.length)
            .withMessage(DUPLICATED_NUMBERS);
    };

const validateRankEnded =
    (): ValidationChain => {
        return sanitizedString('rank')
            .isMongoId()
            .custom(async (val, {req}) => {
                const rank = await RankModel.findById(val);
                const horse = await HorseModel.findById(req.params.id).catch();
                if (!horse && rank.ended) {
                    return false
                }

                return rank.ended
                    && (HorseModel.rankChanged(req.params.id, val) || HorseModel.notesChanged(req.params.id, req.body.notes))
            })
            .withMessage(RANK_IS_ENDED)
    };

const horseValidator = [
    validateRankEnded(),
    sanitizedString('name').withMessage(VALUE_IS_INVALID("Nazwa")),
    sanitizedString('country').withMessage(VALUE_IS_INVALID("Kraj")),
    isExistingRank(),
    check('yearOfBirth')
        .isInt()
        .custom(val => val > 1950 && val < new Date().getFullYear()).withMessage(VALUE_IS_INVALID("Rok urodzenia")),
    sanitizedString('color').withMessage(VALUE_IS_INVALID("Kolor")),
    sanitizedString('sex').withMessage(VALUE_IS_INVALID("Płeć")),
    sanitizedString('breeder.name').withMessage(VALUE_IS_INVALID("Nazwa hodowcy")),
    sanitizedString('breeder.country').withMessage(VALUE_IS_INVALID("Kraj hodowcy")),
    sanitizedString('owner.name').withMessage(VALUE_IS_INVALID("Nazwa właściciela")),
    sanitizedString('owner.country').withMessage(VALUE_IS_INVALID("Kraj właściciela")),
    sanitizedString('lineage.father.name').withMessage(VALUE_IS_INVALID("Nazwa ojca")),
    sanitizedString('lineage.father.country').withMessage(VALUE_IS_INVALID("Kraj ojca")),
    sanitizedString('lineage.mother.name').withMessage(VALUE_IS_INVALID("Nazwa matki")),
    sanitizedString('lineage.mother.country').withMessage(VALUE_IS_INVALID("Kraj matki")),
    sanitizedString("lineage.mothersFather.name").withMessage(VALUE_IS_INVALID("Nazwa ojca matki")),
    sanitizedString('lineage.mothersFather.country').withMessage(VALUE_IS_INVALID("Kraj ojca matki")),
];

export const horsePostValidator = horseValidator.concat([
    body()
        .custom(val => Object.keys(val).length === 9)
        .withMessage(TOO_MANY_PARAMETERS)
]);

export const horsePutValidator = horseValidator.concat([
    check('id')
        .custom(async val => (await HorseModel.findById(val)) !== null)
        .withMessage(HORSE_NOT_FOUND),
    validateNotesIds(),
    check('arbitratorValue')
        .isInt()
        .custom(val => val >= 0).withMessage(ARBITRATOR_VALUE_WRONG),
    validateNoteNumber('notes.*.horseType'),
    validateNoteNumber('notes.*.head'),
    validateNoteNumber('notes.*.log'),
    validateNoteNumber('notes.*.legs'),
    validateNoteNumber('notes.*.movement'),
    body()
        .custom(val => Object.keys(val).length === MAX_PUT_PARAMS)
        .withMessage(TOO_MANY_PARAMETERS)
]);

export const horseRearrangeValidator = [
    isExistingHorse('horseNumberList.*.id'),
    check('horseNumberList.*.newNumber').isInt(),
    checkCorrectnessOfNumbers()
];
