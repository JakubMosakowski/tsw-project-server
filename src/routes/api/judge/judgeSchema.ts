import {Schema} from "mongoose";
import {JudgeModel, RankModel} from "../../../data/MongoManager";

export const judgeSchema = new Schema({
    name: String,
    country: String
});

judgeSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    }
});

judgeSchema.set('toObject', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    }
});

judgeSchema.statics = {
    async all() {
        return await JudgeModel.find({})
    },

    async checkIfUsed(id): Promise<Boolean> {
        const ranks = await RankModel.all();
        return !ranks.some(rank => {
            return rank.committee.filter(item => (item.id === id)).length > 0;
        })
    }
};
