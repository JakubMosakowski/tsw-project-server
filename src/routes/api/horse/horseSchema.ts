import {Schema} from "mongoose";
import {HorseModel} from "../../../data/MongoManager";
import {HORSE_NOT_FOUND} from "../../../models/errorMessages";
import {ObjectId} from "../rank/rankSchema";
import {RacingHorse} from "../../../models/horse";

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
    arbitratorValue: Number,
    notes: [{
        judge: {type: ObjectId, ref: 'Judge'},
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

horseSchema.set('toObject', {
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
                if (!result) throw new Error(HORSE_NOT_FOUND)
            })
    },
    async rankChanged(id, rankId): Promise<Boolean> {
        return (await HorseModel.findById(id)).rank.id == rankId;
    },
    async notesChanged(id, notes): Promise<Boolean> {
        const notesFromDb = (await HorseModel.findById(id)).notes.map(item => {
            return {
                judge: item.judge.id,
                horseType: item.horseType,
                head: item.head,
                log: item.log,
                legs: item.legs,
                movement: item.movement,
            }
        });
        return notesFromDb == notes;
    },
    async addNewJudgeToHorses(rankId: String, judgeId) {
        const horses = await HorseModel.find({rank: rankId}) as [RacingHorse];

        for (const item of horses) {
            item.notes.push({
                judge: judgeId,
                horseType: 0,
                head: 0,
                log: 0,
                legs: 0,
                movement: 0
            });

            await HorseModel.findByIdAndUpdate(item.id, item)
        }
    },
    async removeJudgeFromHorses(rankId: string, judgeId: string) {
        const horses = await HorseModel.find({rank: rankId}) as [RacingHorse];

        for (const item of horses) {
            const index = item.notes.map(item => item.judge.id).indexOf(judgeId);
            item.notes.splice(index, 1);

            await HorseModel.findByIdAndUpdate(item.id, item)
        }
    },
    async all() {
        return await HorseModel.find({})
    }
};

horseSchema.pre('findOne', autoPopulate);
horseSchema.pre('find', autoPopulate);

function autoPopulate(next) {
    this.populate('rank');
    this.populate('notes.judge');
    next()
}
