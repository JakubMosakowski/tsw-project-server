import {Schema} from "mongoose";
import {HorseModel} from "../../../data/MongoManager";
import {HORSE_NOT_FOUND} from "../../../models/errorMessages";
import {ObjectId} from "../rank/rankSchema";

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

horseSchema.statics = {
    async isExistingHorse(id) {
        return await this.findById(id)
            .then(result => {
                if (!result) throw new Error(HORSE_NOT_FOUND.msg)
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
