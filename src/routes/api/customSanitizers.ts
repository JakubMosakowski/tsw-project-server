import {check, ValidationChain} from "express-validator/check";

export const sanitizedString =
    (fieldName): ValidationChain => {
        return check(fieldName)
            .isString()
            .not()
            .isEmpty()
            .trim()
            .escape()
    };
