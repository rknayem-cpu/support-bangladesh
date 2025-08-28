const mongoose = require('mongoose')


const postSchema = new mongoose.Schema({

    title:String,
    content:String,
    likes:[],
    user:{
        ref:'User',
        type:mongoose.Schema.Types.ObjectId,
    },
    
})


module.exports = mongoose.model('Post',postSchema)