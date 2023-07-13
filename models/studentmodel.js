const mongoose = require('mongoose')
const gradeSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    grade:{
      type: String,
      required: true
    },
    mark: {
        type: Number,
        required: true
    },
    testNo: {
        type: Number,
        required: true
    }
  });
const studentschema = mongoose.Schema(
    {
       name: {
        type: String,
        required: [true,"Please Enter Name"]
       },
       year: {
        type: Number,
        required: [true, "Please Enter Grade Year"]
       },
       grade: [gradeSchema],
       subjects: [{
        type: String
       }]
    },
    {
        timestamps: true
    }
)

const Student = mongoose.model('Student',studentschema);
module.exports = Student;