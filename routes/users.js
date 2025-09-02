var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


module.exports = router;
