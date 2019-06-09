import {Schema} from "mongoose";

export const rankSchema = new Schema({
    number: Number,
    category: String,
    committee: [String],
    finished: Boolean
}, {
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
    },
});

rankSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    }
});
