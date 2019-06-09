// import {NOT_FOUND, TOO_MANY_PARAMETERS} from "../../models/errorMessages";
// import {RANKS} from "../../models/tableNames";
// import {getFirstMissingValueFromArray} from "../../extensions";
//
// app.get('/ranks', (req, res) => {
//     res.json(getTable(RANKS));
// });
//
// app.get('/ranks/:id', (req, res) => {
//     let fetched = getValueFromTable(RANKS, req.params.id);
//     if (fetched != null) {
//         res.json(fetched);
//     } else {
//         res.status(404).json(NOT_FOUND);
//     }
// });
//
// app.post('/ranks',
//     [
//         check('category').isString(),
//         check('committee.*').isString(),
//         check('committee').isArray(),
//
//     ],
//     (req, res) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(422).json({errors: errors.array()});
//         }
//
//         let rank = req.body;
//         rank.id = uuidv1();
//         rank.number = getFirstUnusedRankNumber();
//
//         if (Object.keys(req.body).length != 4) {
//             return res.status(422).json(TOO_MANY_PARAMETERS);
//         }
//         //todo walidacja czy takie ranki istnieja przy tworzeniu/edytowaniu konia
//         //todo walidacja czy rank ma dobrych judge
//         db.get(RANKS)
//             .push(rank)
//             .write();
//
//         io.emit(RANKS, getTable(RANKS));
//         res.json(rank);
//     });
//
// app.put('/ranks/:id', [
//     check('number').isInt(),
//     check('number', 'Number must be unique!')
//         .exists()
//         .custom((value, {req}) => value === getFirstUnusedRankNumber() || rankNumberWasNotUpdated(value, req.params.id)),
//     check('category').isString(),
//     check('committee.*').isString(),
//     check('committee').isArray(),
// ], function (req, res) {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         return res.status(422).json({errors: errors.array()});
//     }
//     let rank = req.body;
//     rank.id = req.params.id;
//
//     if (Object.keys(req.body).length != 4) {
//         return res.status(422).json(TOO_MANY_PARAMETERS);
//     }
//
//     db.get(RANKS)
//         .find({id: req.params.id})
//         .assign(rank)
//         .write();
//
//     if (db.get(RANKS)
//         .find({id: req.params.id}).value() == null) {
//         res.status(404).json(NOT_FOUND);
//     } else {
//         io.emit(RANKS, getTable(RANKS));
//         res.json(rank);
//     }
// });
//
// function rankNumberWasNotUpdated(value: number, id: string): boolean {
//     let rank = db.get(RANKS)
//         .find({id: id}).value();
//     if (rank == null) {
//         return true;
//     }
//
//     return rank.number == value;
// }
//
// function getFirstUnusedRankNumber(): number {
//     let numbers = db.get(RANKS).map(NUMBER).value();
//
//     return getFirstMissingValueFromArray(numbers);
// }
//
// app.delete('/ranks/:id', function (req, res) {
//     let deleteConfirmed = removeFromDb(RANKS, req.params.id);
//     if (deleteConfirmed) {
//         io.emit(RANKS, getTable(RANKS));
//         res.json();
//     } else {
//         res.status(404).json(NOT_FOUND);
//     }
// });
