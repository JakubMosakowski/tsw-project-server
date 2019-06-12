import mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;
import {Schema} from "mongoose";
import {HorseModel} from "../../../data/MongoManager";
import {HORSE_NOT_FOUND} from "../../../models/errorMessages";

export const horseSchema = new Schema({
    name: String,
    country: String,
    number: Number,
    rank: {type: ObjectId, ref: 'Rank'},
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
        horseType: Number,
        head: Number,
        log: Number,
        legs: Number,
        movement: Number,
        _id: false
    }]
});

horseSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    }
});

horseSchema.statics = {
    async isExistingHorse(id) {
        return await this.findById(id)
            .then(result => {
                if (!result) throw new Error(HORSE_NOT_FOUND.msg)
            })
    },

    async all() {
        return await HorseModel.find({})
    }
};

horseSchema.pre('findOne', autoPopulateRank);
horseSchema.pre('find', autoPopulateRank);

function autoPopulateRank(next) {
    this.populate('rank');
    next()
}
