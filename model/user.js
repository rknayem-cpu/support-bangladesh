const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  imageUrl:String,
  emailV:String,
  fb:String,
  live:Boolean,
  phoneno:Number,
  pshow:{
    type:Boolean,
    default:false,
  },
  posts:[{
    ref:'Post',
    type:mongoose.Schema.Types.ObjectId,
  }],
  password: String,
  dateit: { 
        type: String, 
        default: () => {
            return new Date().toLocaleDateString("bn-BD", { 
                day: "numeric", 
                month: "long", 
                year: "numeric"
            });
        }
    },
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
