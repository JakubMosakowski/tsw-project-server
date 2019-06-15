import {body, ValidationChain} from "express-validator/check";
import {LOGIN_ERROR, TOO_MANY_PARAMETERS} from "../../models/errorMessages";
import {sanitizedString} from "../api/customSanitizers";
import {UserModel} from "../../data/MongoManager";
import {User} from "../../models/user";

const bcrypt = require('bcrypt');

const checkUser =
    (): ValidationChain => {
        return body()
            .custom(async val => {
                const user = await UserModel.findOne({login: val.login}) as User;

                if (!user) return false;
                return bcrypt.compareSync(val.password, user.password)
            })
            .withMessage({
                success: false,
                message: LOGIN_ERROR.msg,
                token: null
            })
    };

export const authValidator = [
    sanitizedString('login'),
    sanitizedString('password'),
    checkUser(),
    body()
        .custom(val => Object.keys(val).length === 2)
        .withMessage(TOO_MANY_PARAMETERS)
];
