import {UserModel} from "../../data/MongoManager";
import {authValidator} from "./authValidator";
import {validationResult} from "express-validator/check";

const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const {
    JWT_KEY
} = process.env;

router.post('/', authValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
    }

    const user = await UserModel.findOne({login: req.body.login});

    console.log(user);
    console.log(JWT_KEY);
    const token = jwt.sign(user.toJSON(), JWT_KEY, {
        expiresIn: "24h"
    });

    res.json({
        success: true,
        message: 'Token has been created',
        token: token
    });
});

module.exports = router;
