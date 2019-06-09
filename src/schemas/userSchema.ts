import {client} from "../data/MongoManager";

export const userSchema = new client.Schema({
    name: Number,
    password: String
}, {
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
    },
});

userSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id
    }
});
