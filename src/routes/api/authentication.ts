// import {JUDGES, USERS} from "../../models/tableNames";
// import {User} from "../../models/user";
// import {NOT_FOUND, TOO_MANY_PARAMETERS} from "../../models/errorMessages";
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// app.post('/login', (req, res) => {
//     let user = db.get(USERS).find({name: req.body.name}).value() as User;
//
//     if (!user) return res.status(404).send(NOT_FOUND);
//     let passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
//     if (!passwordIsValid) return res.status(401).send({auth: false, token: null});
//     let token = jwt.sign({name: user.name}, "config.secret", {
//         expiresIn: 86400 // expires in 24 hours
//     });
//     res.status(200).send({auth: true, token: token, user: user});
// });
//
// app.post('/judges',
//     [
//         check('name').isString(),
//         check('country').isString(),
//     ],
//     (req, res) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(422).json({errors: errors.array()});
//         }
//
//         let judge = req.body;
//         judge.id = uuidv1();
//
//         if (Object.keys(req.body).length != 3) {
//             return res.status(422).json(TOO_MANY_PARAMETERS);
//         }
//
//         db.get(JUDGES)
//             .push(judge)
//             .write();
//
//         io.emit(JUDGES, getTable(JUDGES));
//         res.json(judge);
//     });
//TODO correct jwt verification

// const verifyOptions = {
//     expiresIn:  "12h",
//     algorithm:  ["RS256"]
// };
//
// const legit = jwt.verify(token, publicKEY, verifyOptions);
