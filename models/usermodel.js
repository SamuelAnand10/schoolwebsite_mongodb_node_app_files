
const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
const userschema = mongoose.Schema({
    name:{
        type: String,
        required: [true, 'please enter name']
    },
    email:{
        type: String,
        required: [true, 'please enter email'],
        
    },
    password:{
        type: String,
        required: [true, 'please enter password']
    },
    duty:{
        type: String,
        required: true,
        default: 'student'
    }
})

userschema.plugin(passportLocalMongoose,{ usernameField: 'email' })
const User = mongoose.model('User', userschema)
module.exports = User;