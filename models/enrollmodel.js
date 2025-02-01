const mongoose = require('mongoose')
const enrollingschema = mongoose.Schema({
    name: String,
    class: Number,   
    subject: String,
})
const Enrolling = mongoose.model('Enrolling', enrollingschema)
module.exports = Enrolling;