const serverless = require('serverless-http');
const app = require('../app');  // express-generator এর app.js ফাইল থেকে import করো

module.exports.handler = serverless(app);