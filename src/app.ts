import {connectToDb} from "./data/MongoManager";

const horses = require('./routes/api/horse/horses');
const judges = require('./routes/api/judges');
const ranks = require('./routes/api/ranks');
const authentication = require('./routes/api/authentication/authentication');

const express = require('express');
const cors = require('cors');
const app = express();
const morgan = require('morgan');
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(morgan('tiny'));

app.use('/api/horses', horses);
// app.use('api/judges', judges);
// app.use('api/ranks', ranks);
// app.use('login', authentication);

const socket = require('socket.io');
let server;
export let io;
const http = require('http');

connectToDb().then(() => {
    server = http.createServer(app).listen(port, () => {
        console.log("Express server listening on port " + port);
    });
    io = socket.listen(server);
}).catch(e => console.log(e));


// setupDb();
// setupHeaders();
// setupGetters();
// setupPosts();
// setupUpdates();
// setupDeletes();
// setupSockets();

// function setupDb() {
//     db.defaults({
//         horses: [],
//         judges: [],
//         ranks: [],
//         users: [
//             {
//                 name: "admin",
//                 password: bcrypt.hashSync("12345", 8)
//             }
//         ]
//     }).write();
// }

// function getTable(tableName: string) {
//     return db.get(tableName).value();
// }
//
// function getValueFromTable(tableName: string, id: string) {
//     return db.get(tableName)
//         .find({id: id}).value();
// }

// app.post('/reloadDb', (req, res) => {
//     setupDb();
//     fillDb(
//         () => {
//             res.status(200).send();
//         },
//         () => {
//             res.status(400).send();
//         }
//     );
//
//
// });

// function fillDb(onFinished, onError) {
//     Promise.all([API.getJudges(), API.getHorses(), API.getRanks()]).then(values => {
//         db.set(JUDGES, values[0].data)
//             .write();
//
//         const horses = values[1].data.map(item => {
//             item.rank = getTable(RANKS).find(it => it.id == item.rankId);
//             delete item.rankId;
//         });
//         db.set(HORSES, horses)
//             .write();
//
//         db.set(RANKS, values[2].data)
//             .write();
//         onFinished();
//     }).catch(err => {
//         console.log(err);
//         onError();
//     });
// }
//
// function removeFromDb(dbName: string, id: string): boolean {
//     let toRemove = db.get(dbName).find({id: id}).value();
//     if (toRemove) {
//         db.get(dbName)
//             .remove(toRemove)
//             .write();
//     }
//
//     return toRemove != null;
// }

//
//
// function setupSockets() {
//     io.on('connection', () => {
//         io.emit(JUDGES, getTable(JUDGES));
//         io.emit(HORSES, getTable(HORSES));
//         io.emit(RANKS, getTable(RANKS));
//     });
// }

