// /* jshint strict: global, esversion: 6, devel: true, node: true */
// 'use strict';
let express = require('express');
let morgan = require('morgan')
const port = process.env.PORT || 3000;

let app = express();

app.use(express.json());
app.use(morgan('tiny'));
app.use(express.urlencoded({extended: false}));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});



app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

