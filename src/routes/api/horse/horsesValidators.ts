import {check} from "express-validator/check";

export const horseValidator = [
    check('name').isString(),
    check('country').isString(),
    check('rankId').isString(),
    check('yearOfBirth').isInt(),
    check('color').isString(),
    check('sex').isString(),
    check('breeder.name').isString(),
    check('breeder.country').isString(),
    check('owner.name').isString(),
    check('owner.country').isString(),
    check('lineage.father.name').isString(),
    check('lineage.father.country').isString(),
    check('lineage.mother.name').isString(),
    check('lineage.mother.country').isString(),
    check('lineage.mothersFather.name').isString(),
    check('lineage.mothersFather.country').isString()
];

export const horsePutValidator = horseValidator.concat([
    check('notes').isArray(),
    check('notes.*.type').isNumeric(),
    check('notes.*.head').isNumeric(),
    check('notes.*.log').isNumeric(),
    check('notes.*.legs').isNumeric(),
    check('notes.*.movement').isNumeric(),
]);

export const horseRearrangeValidator= [
    check('horseNumber.*.id').isInt(),
    check('horseNumber.*.newNumber').isInt(),
];
