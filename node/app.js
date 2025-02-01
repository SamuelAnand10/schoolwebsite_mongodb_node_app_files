if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}
const crypto = require('crypto')
const assignment = require('./models/assignmentmodel')
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const { MongoClient } = require('mongodb');
const { GridFSBucket } = require('mongodb');
const student = require('./models/studentmodel')
const user = require('./models/usermodel')
const teacher = require('./models/teachermodel')
const multer = require('multer');
const Grid = require('gridfs-stream');
const {GridFsStorage} = require('multer-gridfs-storage');
const methodOverride = require('method-override')
const bcrypt = require('bcrypt')
const path = require('path')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
mongoose.connect('mongodb+srv://samueljoshuaanand10:L4KPNTr70G2VQkOv@cluster0.pdigwel.mongodb.net/Node-App?retryWrites=true&w=majority')
.then(()=> {
    console.log("mongoose database connected")
    app.listen(3000, ()=> {
    console.log("listening on port 3000")
})




// Create upload middleware



} ).catch((error)=> {console.log(error)})
const initializePassport = require('./passport-config.js')
const { ObjectID } = require('mongodb')
const { default: cluster } = require('cluster')
const { config } = require('dotenv')
const { ObjectId } = require('mongoose/lib/types')


initializePassport(passport, (email)=> user.findOne({email: email}))
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.set('view-engine','ejs')
app.use(flash())
app.use(session({secret: process.env.SESSION_SECRET,
                 resave:false,
                 saveUninitialized: false,
            
            
            }))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/',checkAuthenticated, async (req, res) => {
  try{
    if (req.user && req.user.name) {
      const currentName = req.user.name;
      
      const currentStudent = await student.findOne({name: currentName})
      const arrayOfSubjects = await currentStudent.subjects
      console.log(arrayOfSubjects)
      if(arrayOfSubjects === null || undefined){
        arrayOfSubjects = []
      }
      res.render('index.ejs', { name: currentName, student: currentStudent, arrayOfSubjects });
    } else {
      // Handle the case when req.user or req.user.name is undefined
      res.redirect('/login'); // Redirect to the login page or any other appropriate action
    }}
    catch(error){
      console.log({message: error})
    }
  });
  
const mongoURI = "mongodb+srv://samueljoshuaanand10:L4KPNTr70G2VQkOv@cluster0.pdigwel.mongodb.net/Node-App?retryWrites=true&w=majority"  
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({ storage: storage });


const url = mongoURI;
const connect = mongoose.createConnection(url,{
  useNewUrlParser: true,
  useUnifiedTopology: true
});

connect.once('open',()=> {
  const PleaseWork = new mongoose.mongo.GridFSBucket(connect.db,{
    bucketName: 'uploads'
  });
});      

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log(req.body);
    const role = req.user.duty;
    if (role === 'teacher') {
      // Create a new assignment object
      const lastItem = await assignment.findOne().sort({ testNumber: -1 }).exec();
      const testNumber = lastItem ? lastItem.testNumber + 1 : 1;
      const [value1, value2] = req.body.specificClass.split(',');
      console.log(value1);
      console.log(value2);
      const newAssignment = {
        subject: value1.trim(),
        class: parseInt(value2.trim()),
        testNumber: testNumber,
        file: req.file.id, // Store the uploaded file ID in the assignment
        dueDate: req.body.date,
        teacherName: req.user.name
      };
      console.log(newAssignment);
      await assignment.create(newAssignment);
      res.redirect('/createAssignment');
    } else {
      const uploadAssignment = String(req.body.currentAssignment)
      console.log(uploadAssignment)
      const quest = await assignment.findById(uploadAssignment)
      const newAssignment = {
        subject: quest.subject,
        class: quest.class,
        testNumber: quest.testNumber,
        file: req.file.id,
        dueDate: new Date(),
        teacherName: req.user.name
      };
      await assignment.create(newAssignment);
      res.redirect('/studentAssignments');
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/download/:file', async (req, res) => {
  try {
    const fileId = req.params.file;
    console.log(fileId)
    const PleaseWork = new mongoose.mongo.GridFSBucket(connect.db, {
      bucketName: 'uploads'
    });

    const file = await PleaseWork.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    if (!file || file.length === 0) {
      return res.status(404).send('File not found here');
    }

    const downloadStream = PleaseWork.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    downloadStream.on('error', (error) => {
      console.log(error);
      res.status(500).send('Internal Server Error');
    });

    res.set('Content-Type', file[0].contentType);
    res.set('Content-Disposition', `attachment; filename="${file[0].filename}"`);

    downloadStream.pipe(res);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

  
  

app.get('/login',checkNotAuthenticated, (req,res)=>{
res.render('login.ejs')})

app.post('/login',passport.authenticate('local',{
    successRedirect:'/logindirect',
    failureRedirect:'/login',
    failureFlash: true 
}))


app.get('/logindirect',async(req,res)=>{
    if(req.user.duty === 'teacher'){
        res.redirect('/teacher')
    }
    else{
        res.redirect('/')
    }

})
app.get('/profile', async(req,res)=> {
    const currentStudent = await student.findOne({name: req.user.name})
    console.log(currentStudent.year)
    res.render('profile.ejs',{name: currentStudent.name,year: currentStudent.year, email: req.user.email, role: req.user.duty })
})


app.get('/register', (req,res)=>{
res.render('register.ejs')})

app.post('/register', async(req,res)=> {
try {
    const hashpassword = await bcrypt.hash(req.body.password,10)
    const NewUser ={
        name: req.body.name,
        email: req.body.email,
        password: hashpassword,
        duty: 'student'
    }
    await user.insertMany([NewUser])
    const NewStudent= {
        name: req.body.name,
        year: req.body.year
    }
    await student.create(NewStudent)
    res.redirect('/login')
     
} 
catch (error){
    res.status(500).json({message: error.message})
};
})

app.delete('/logout', (req, res) => {
    req.logout((error)=>{
        if(error){
            console.error(error)
        }
         res.redirect('/login')
    })
   
  })
  
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  else{
    res.redirect('/login')}
  }
  
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }
    next()
  }



  app.get('/registerteacher', async(req,res)=> {
    const teach = new teacher({ name: 'unknown' });
    await teach.save();
    res.render('teacherRegister.ejs', {subjects: teach.subjects})
  })



  app.post('/registerteacher', async(req,res)=>{
    try {
        
        const {name,email,password} = req.body;
        const hashedpassword = await bcrypt.hash(password,10)
        console.log(req.body)
        
        const sub = [];
        const numSubjects = (Object.keys(req.body).length - 3) / 2;
        // Iterate over the form data and combine names and years into a single array
        for (let i = 0; i < numSubjects; i++) {
          const subject = {
            name: req.body[`subjects[${i}][name]`],
            years: req.body[`subjects[${i}][years]`].split(',')
          };
          sub.push(subject);
        }
        console.log(sub)
  const newUser = new user({
    name,
    email,
    password: hashedpassword,
    duty: 'teacher'
  });
  const newTeacher =  teacher({
    name,
    subjects: sub
  })
  await user.create(newUser)
  await teacher.create(newTeacher)
  await teacher.deleteOne({name: 'unknown'})
  res.redirect('/login')
        
        
}  
catch (error) {
        console.error(error)
        res.status(500).json({message: error.message})
    }
  })

  app.get('/teacher',async(req,res)=> {
    res.render('teacher.ejs',{name: req.user.name})
  })

app.get('/teacherProfile', async(req,res)=> {
    const teach = await teacher.findOne({name: req.user.name })
    console.log(teach.subjects)
    res.render('teacherProfile.ejs',{name: req.user.name, email: req.user.email, role: req.user.duty, subjects: teach.subjects })
})


app.get('/myStudents', async (req, res) => {
  try {
    const prof = await teacher.findOne({ name: req.user.name });
    const distinctSubjects = prof.subjects.map((subject) => subject.name);
    console.log(distinctSubjects);

    const allStudents = await student.find();
    let kido = [];
    let kidoArrays = [];

    allStudents.forEach((stud) => {
      let arraySubjects = [];
      const distinctStudent = stud.subjects;

      distinctStudent.forEach((guy) => {
        distinctSubjects.forEach((sub) => {
          if (guy === sub) {
            const taught = prof.subjects.some((indi) => indi.name === sub && indi.years.some((year) => year === stud.year));
            console.log(taught)
            if (taught) {
              kido.push(stud);
              arraySubjects.push(sub);
            }
          }
        });
      });
      console.log(arraySubjects)
      kidoArrays.push(arraySubjects);
    });
    console.log(kido);
    console.log(kidoArrays);

    res.render('myStudents.ejs', { students: kido, studentArray: kidoArrays });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/adjustGrades/:subject/:name', async(req,res)=> {
  const studentName = req.params.name
  const distinctSubject = req.params.subject
  const stud = await student.findOne({name:studentName })
  const kid = await stud.grade
  res.render('adjustGrades.ejs',{student: stud, distinctSubject,kid })
})

app.post('/adjustGrades', async (req, res) => {
  try {
    const kid = req.body.kid
    const test = req.body.test
    const subject = req.body.subject
    console.log(req.body)
console.log('1')
console.log(kid,test,subject)
    // Validate input
    if (!kid || !test || !subject) {
      throw new Error('Invalid request. Missing required fields.');
    }
    const kiddo = await student.findOne({ name: kid });
    console.log('2')
    if (!kiddo) {
      throw new Error('Student not found.');
    }
    console.log('3')
    // Remove grade by ID
    const studentName = kid;
    try {
      const updatedStudent = await student.findOneAndUpdate(
        { name: studentName },
        { $pull: { grade: { _id: new mongoose.Types.ObjectId(test) } } },
        { new: true }
      );
      console.log('Updated student:', updatedStudent);
    } catch (error) {
      console.error('Error occurred during findOneAndUpdate:', error);
    }
    
    console.log('4')
    // Retrieve updated student document
    
    const distinctSubject = subject;
    const stud = await student.findOne({ name: studentName });
    console.log('5')
    if (!student) {
      throw new Error('Failed to retrieve updated student information.');
    }

    const grades = student.grade;

    res.render('adjustGrades.ejs', { student: stud, distinctSubject, kid: grades });
  } catch (error) {
    // Handle errors
    res.status(500).send(error.message);
  }
});

app.get('/updateGrades/:id/:name', async (req, res) => {
  try {
    const stud = await student.findOne({ name: req.params.name });
    const GRADE = await stud.grade.id(req.params.id);
    res.render('updateGrades.ejs', { grade: GRADE, name: req.params.name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/updateGrades/:name/:id', async (req, res) => {
  try {
    const kido = await student.findOne({ name: req.params.name });

    if (kido) {
      const gradeToUpdate = kido.grade.id(req.params.id);
      
      if (gradeToUpdate) {
        gradeToUpdate.grade = req.body.grade;
        gradeToUpdate.mark = req.body.mark;

        await kido.save();

        res.render('adjustGrades.ejs',{student: kido, distinctSubject: gradeToUpdate.subject,kid: kido.grade })
      } else {
        res.status(404).send('Grade not found');
      }
    } else {
      res.status(404).send('Student not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});




app.get('/createAssignment', async(req,res)=> {
  const assigned = await assignment.find({teacherName: req.user.name})
  const prof = await teacher.findOne({name: req.user.name})
  var teach = prof.subjects
  if(prof.subjects === undefined){
    var teach = []
  }
  console.log(teach)
  res.render('createAssignment.ejs',{classes: teach, tasks: assigned})
})

app.post('/delete/:id/:testNumber/:class/:subject', async (req, res) => {
  try {
    const PleaseWork = new mongoose.mongo.GridFSBucket(connect.db, {
      bucketName: 'uploads'
    });
    const specific = await student.find({year: req.params.class})
    const kids = specific.flatMap(student => student.grade.filter(g => g.subject === req.params.subject));
    kids.forEach(element => {
      try {
        var ele = element.grade.find(g => g.testNo === req.params.testNumber);
        if(!ele){
          var newValue = {
            subject: req.params.subject,
            grade: 'F',
            mark: 0,
            testNo: req.params.testNumber
          }
          element.grade.push(newValue);
        }
      } catch (error) {
        console.error('Error updating grades:', error);
        // Handle the error accordingly
        res.status(500).send('Error updating grades');
        return;
      }
    });
    const assignmentId = req.params.id;

    // Find the assignment by ID
    const assign = await assignment.findById(assignmentId);

    // Check if the assignment exists
    if (!assign) {
      return res.status(404).send('Assignment not found');
    }

    PleaseWork.delete(new mongoose.Types.ObjectId(assign.file))
    // Delete the assignment from the database
    await assignment.findByIdAndRemove(assignmentId);

    // Redirect to the assignments page
    res.redirect('/createAssignment');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/studentAssignments', async (req, res) => {
  try {
    const stud = await student.findOne({ name: req.user.name });
    const studentSubjects = stud.subjects;
    const studentClass = stud.year;

    const doneAssignments = await assignment.find({ teacherName: req.user.name });
    const dontInclude = doneAssignments.map((assignment) => assignment.subject);

    const filteredSubjects = studentSubjects.filter((subject) => !dontInclude.includes(subject));

    const assignmentPromises = filteredSubjects.map(async (subj) => {
      const teach = await teacher.findOne({ 'subjects.name': subj, 'subjects.years': { $elemMatch: { holds: studentClass } } });
      return assignment.find({ subject: subj, class: studentClass, teacherName: teach.name });
    });

    const studentAssignments = await Promise.all(assignmentPromises);

    res.render('studentAssignments.ejs', { assigned: studentAssignments.flat(), doneAlready: doneAssignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/submitAssignment/:currentAssignment', async(req,res)=> {
  console.log(req.params.currentAssignment)
  const id = await assignment.findById(req.params.currentAssignment)
  const fileId = id.file
  const fileURL = '/download/'+ fileId
  res.render('submitAssignment.ejs',{assigned: id, fileURL: fileURL})
})

app.get('/resubmit/:rewrite',upload.single('file'), async(req,res)=>{
  const RESUBMIT = await assignment.findById(req.params.rewrite)
  res.render('resubmit.ejs',{overwritting: RESUBMIT})
})

app.post('/resubmit/:redo', upload.single('file'), async (req, res) => {
  try {
    const PleaseWork = new mongoose.mongo.GridFSBucket(connect.db,{
      bucketName: "uploads"
    })
    const redoParams = req.params.redo;
    const gone = await assignment.findById(redoParams);

    if (!gone) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Delete the file from the file storage (assuming 'gfs' is the GridFSBucket)
    await PleaseWork.delete(new mongoose.Types.ObjectId(gone.file));

    // Delete the assignment from the database
    await assignment.deleteOne({ _id: gone._id });

    const newAssignment = new assignment({
      subject: gone.subject,
      class: gone.class,
      testNumber: gone.testNumber,
      file: req.file.id,
      dueDate: gone.dueDate,
      teacherName: gone.teacherName
    });

    // Save the new assignment to the database
    await newAssignment.save();

    res.redirect('/studentAssignments');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/viewSubmissions/:checker', async (req, res) => {
  const check = await assignment.findById(req.params.checker)

  // Retrieve the submitted assignments for the specified subject, class, testNumber, and teacherName
  const kidsSubmitted = await assignment.find({
    subject: check.subject,
    class: check.class,
    testNumber: check.testNumber,
       // Exclude assignments submitted by the current teacher
  });

console.log(kidsSubmitted)
  const filteredKids = kidsSubmitted.filter((assignment)=>  assignment.teacherName !== req.user.name)
  // Retrieve the students who are assigned to the specified subject and class
  const kiddos = await student.find({ year: check.class, subjects: {$elemMatch: {holds: check.subject}} });
  var remaining = 0
  if(kiddos.length !== 0){
   remaining = kiddos.length - filteredKids.length;
  }
  console.log("KIDDOS:")
  console.log(kiddos)
  console.log("FILTERED KIDS:")
  console.log(filteredKids)
  res.render('submissions.ejs', { remaining: remaining, submitted: filteredKids, dueAt: check.dueDate});
});

app.get('/markSubmission/:submission', async(req,res)=> {
  const markIt = await assignment.findById(req.params.submission)
  res.render('markSubmission.ejs',{subbed: markIt})
})

app.post('/marksSubmission/:subby', async(req,res)=>{
  const PleaseWork = new mongoose.mongo.GridFSBucket(connect.db,{
    bucketName: "uploads"
  })
  const sub = await assignment.findById(req.params.subby)
  const presentKid = await student.findOne({name: sub.teacherName})
  const newGrade= {
      subject: sub.subject,
      grade: req.body.grade,
      mark: req.body.mark,
      testNo: sub.testNumber 
  }
  await presentKid.grade.push(newGrade);
  await presentKid.save()
  await PleaseWork.delete(new mongoose.Types.ObjectId(sub.file));

  // Delete the assignment from the database
  await assignment.deleteOne({ _id: sub._id });
  res.redirect('/createAssignment');
})

app.get('/enroll', async(req,res)=>{
    const distinctSubject = await teacher.distinct('subjects.name');
  res.render('enroll.ejs', {subs: distinctSubject})

})

app.post('/enroll', async (req, res) => {
  try {
    const current = await student.findOne({ name: req.user.name });
    current.subjects.push(req.body.subject);
    await current.save(); // Save the updated student document
    res.redirect('/'); // Redirect to the desired page after enrollment
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});
