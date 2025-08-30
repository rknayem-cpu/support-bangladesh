const mongoose = require('mongoose')


const postSchema = new mongoose.Schema({

    title:String,
    content:String,
    show:{
        type:Boolean,
        default:false,
    },
    likes:[],
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
    user:{
        ref:'User',
        type:mongoose.Schema.Types.ObjectId,
    },
    
})


module.exports = mongoose.model('Post',postSchema)