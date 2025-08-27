var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')

mongoose.connect('mongodb+srv://hubweb86:bWbrKagGrzWgiG2Y@cluster0.ndhgpus.mongodb.net/?retryWrites=true&w=majority');


module.exports = router;
