
const mongoose = require('mongoose')

const pendingUserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  emailVCode: String,
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 min পরে auto delete
});
const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

module.exports= PendingUser
