import { UserModel} from "../../data/MongoManager";
import {authValidator} from "./authValidator";
import {validationResult} from "express-validator/check";
import {TOKEN_FAILED} from "../../models/errorMessages";
import {User} from "../../models/user";
import {APIError} from "../../models/APIError";

const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const {
    JWT_KEY,
} = process.env;

router.post('/login', authValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    const user = await UserModel.findOne({login: req.body.login}) as User;

    const token = createToken(user);

    res.json({
        success: true,
        message: 'Token has been created',
        token: token,
    });
});

function authorizeHeader(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).send({errors: [new APIError(TOKEN_FAILED)]});
    }

    jwt.verify(token.replace('Bearer ', ''), JWT_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send({errors: [new APIError(TOKEN_FAILED)]});
        }
        req.decoded = decoded;
        next();
    });
}

const createToken = (user) => {
    return jwt.sign(user.toJSON(), JWT_KEY, {
        expiresIn: "1y"
    });
};

module.exports = {
    authorizeHeader: authorizeHeader,
    router: router
};
