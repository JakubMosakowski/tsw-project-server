// import {JUDGES} from "../../models/tableNames";
// import {NOT_FOUND, TOO_MANY_PARAMETERS} from "../../models/errorMessages";
//
// app.get('/judges', (req, res) => {
//     res.json(getTable(JUDGES));
// });
//
// app.get('/judges/:id', (req, res) => {
//     let fetched = getValueFromTable(JUDGES, req.params.id);
//     if (fetched != null) {
//         res.json(fetched);
//     } else {
//         res.status(404).json(NOT_FOUND);
//     }
// });
//
// app.put('/judges/:id', [
//     check('name').isString(),
//     check('country').isString(),
// ], function (req, res) {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(422).json({errors: errors.array()});
//     }
//     let judge = req.body;
//     judge.id = req.params.id;
//
//     if (Object.keys(req.body).length != 3) {
//         return res.status(422).json(TOO_MANY_PARAMETERS);
//     }
//     db.get(JUDGES)
//         .find({id: req.params.id})
//         .assign(judge)
//         .write();
//
//     if (db.get(JUDGES)
//         .find({id: req.params.id}).value() == null) {
//         res.status(404).json(NOT_FOUND);
//     } else {
//         io.emit(JUDGES, getTable(JUDGES));
//         res.json(judge);
//     }
// });
//
// app.delete('/judges/:id', function (req, res) {
//     let deleteConfirmed = removeFromDb(JUDGES, req.params.id);
//     if (deleteConfirmed) {
//         io.emit(JUDGES, getTable(JUDGES));
//
//         res.json();
//     } else {
//         res.status(404).json(NOT_FOUND);
//     }
// });
