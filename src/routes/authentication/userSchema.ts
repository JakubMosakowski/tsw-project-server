import {Schema} from "mongoose";

export const userSchema = new Schema({
    login: String,
    password: String
});
