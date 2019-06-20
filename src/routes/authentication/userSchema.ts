import {Schema} from "mongoose";

export const userSchema = new Schema({
    login: String,
    password: String
});

userSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    }
});
