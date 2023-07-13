const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  class: {
        type: Number,
        required: true

  },
  testNumber: {
    type: Number,
    required: true
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'uploads.files' // Reference to the GridFS collection
  },
  dueDate: {
    type: Date,
    required: true
  },
  teacherName:{
    type: String,
    require: true
  }

});

const assignment = mongoose.model('assignment', assignmentSchema);

module.exports = assignment;