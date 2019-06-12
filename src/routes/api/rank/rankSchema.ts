import mongoose = require('mongoose');

export const ObjectId = mongoose.Schema.Types.ObjectId;
import {Schema} from "mongoose";
import {RankModel} from "../../../data/MongoManager";
import {RANK_NOT_FOUND} from "../../../models/errorMessages";

export const rankSchema = new Schema({
    number: Number,
    category: String,
    committee: [
        {type: ObjectId, ref: 'Judge'}
    ],
    finished: Boolean
});

rankSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    }
});

rankSchema.statics = {
    async isExistingRank(id) {
        return await this.findById(id)
            .then(result => {
                if (!result) throw new Error(RANK_NOT_FOUND.msg)
            })
    },

    async all() {
        return await RankModel.find({})
    }
};

rankSchema.pre('findOne', autoPopulateCommittee);
rankSchema.pre('find', autoPopulateCommittee);

function autoPopulateCommittee(next) {
    this.populate('committee');
    next()
}

