const serverless = require('serverless-http');
const app = require('../app');  // আপনার মূল Express অ্যাপ

module.exports.handler = serverless(app);  // Express অ্যাপকে serverless ফাংশন হিসেবে এক্সপোর্ট করা
