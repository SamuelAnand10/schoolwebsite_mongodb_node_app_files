
const mongoose = require('mongoose')
const userschema = mongoose.Schema({
    class: {type: Number},
    subject: {type: String},
    lessons:[{
        title: String,
        description: String,
        files:[{
            name: String,
            duty: String,
            file:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'uploads.files'
            }
        }]


    }]
})
const Classes = mongoose.model('Classes', userschema)
module.exports = Classes;