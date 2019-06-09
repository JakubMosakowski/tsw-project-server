import {Schema} from "mongoose";

export const horseSchema = new Schema({
    name: String,
    country: String,
    number: Number,
    rank: {
        number: Number,
        category: String,
        committee: [Number],
        finished: Boolean,
        _id: false
    },
    yearOfBirth: Number,
    color: String,
    sex: String,
    breeder: {
        name: String,
        country: String,
        _id: false
    },
    owner: {
        name: String,
        country: String,
        _id: false
    },
    lineage: {
        father: {
            name: String,
            country: String,
            _id: false
        },
        mother: {
            name: String,
            country: String,
            _id: false
        },
        mothersFather: {
            name: String,
            country: String,
            _id: false
        }
    },
    notes: [{
        type: Number,
        head: Number,
        log: Number,
        legs: Number,
        movement: Number,
        _id: false
    }]
}, {
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
    },
});

horseSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    }
});
