
const mongoose = require('mongoose')
const userschema = mongoose.Schema({
    people: [String],    
    messages: [{name: String,
        message: String}]
})
const Message = mongoose.model('Message', userschema)
module.exports = Message;