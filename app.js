/* jshint strict: global, esversion: 6, devel: true, node: true */
'use strict';
const express = require('express');
const app = express();
const morgan = require('morgan');
const httpServer = require('http').createServer(app);
const socketio = require('socket.io');
const io = socketio.listen(httpServer);
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const port = process.env.PORT || 3006;
const basicAuth = require('express-basic-auth');

clearDB();

app.use(basicAuth({
    users: {'admin': 'admin'},
    challenge: true,
    unauthorizedResponse: getUnauthorizedResponse
}));

function getUnauthorizedResponse(req) {
    return req.auth
        ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected')
        : 'No credentials provided'
}

app.use(express.json());
app.use(morgan('tiny'));
app.use(express.urlencoded({extended: false}));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {

});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});


function clearDB() {
    const newState = {};
    db.setState(newState);
    db.write();
    //
    // db.defaults({messages: [], activeUsers: [], rooms: []})
    //     .write();
    // const room = {};
    // db.get('rooms')
    //     .push(room)
    //     .write();
}
