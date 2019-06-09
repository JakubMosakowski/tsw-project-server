import {Schema} from "mongoose";

export const judgeSchema = new Schema({
    name: String,
    country: String
}, {
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
    },
});

judgeSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    }
});
