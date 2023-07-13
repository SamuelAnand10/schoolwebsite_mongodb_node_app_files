const mongoose = require('mongoose')
const teachingSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true,
        },
        years:[{
            type: Number,
            required: true
        }]
    }
)

const teacherSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    subjects:[teachingSchema],

})

const Teacher = mongoose.model('Teacher',teacherSchema)
module.exports = Teacher;