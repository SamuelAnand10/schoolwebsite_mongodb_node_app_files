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
const classes = require('./models/classesmodel')
const enroll = require('./models/enrollmodel')
const multer = require('multer');
const Grid = require('gridfs-stream');
const {GridFsStorage} = require('multer-gridfs-storage');
const methodOverride = require('method-override')
const bcrypt = require('bcrypt')
const path = require('path')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
var http = require('http').Server(app)
var io = require('socket.io')(http)
// Create upload middleware
const Message = require('./models/messagesmodel')




mongoose.connect('mongodb+srv://samueljoshuaanand10:L4KPNTr70G2VQkOv@cluster0.pdigwel.mongodb.net/Node-App?retryWrites=true&w=majority')
.then(()=> {
    
    console.log("mongoose database connected")
    http.listen(2224, ()=> {
    console.log("listening on port 2224")
})



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
    var studentAssignments = []
    const testvalue = await teacher.find();
    const doneAssignments = await assignment.find({ teacherName: req.user.name });
    const dontInclude = doneAssignments.map((assignment) => assignment.subject);
    

    const filteredSubjects = studentSubjects.filter((subject) => !dontInclude.includes(subject));
    
    if(filteredSubjects.length === 0){}
    else{
  
      console.log(filteredSubjects)
      const assignmentPromises = filteredSubjects.map((subj) => {
        console.log("subj:", subj);
        const teach = testvalue.find((t) => {
         console.log("Teacher:", t.name);
         return t.subjects.some((subject) => {
            console.log("Subject:", subject.name);
           console.log("Years:", subject.years);
            return subject.name === subj && subject.years.some((year) => year === studentClass);
          });
        });
  
        console.log("Teacher found for subject", subj, ":", teach);
  
       return assignment.find({ subject: subj, class: studentClass, teacherName: teach.name });
     });
     console.log("chicken", assignmentPromises)
        studentAssignments = await Promise.all(assignmentPromises);}
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


app.post('/enrolling', async(req,res)=>{
  const stud = await student.findOne({name: req.user.name})
  
  await enroll.create({
    name: req.user.name,
    class: stud.year,
    subject: req.body.subject,
  })

  res.redirect('/')
})



app.get('/enrollingdecision', async (req, res) => {
  try {
    const sir = await teacher.findOne({ name: req.user.name });

    const promises = sir.subjects.map(async (subject) => {
      return Promise.all(subject.years.map(async (year) => {
        return await enroll.find({ subject: subject.name, class: year });
      }));
    });
    console.log(promises)
    const results = await Promise.all(promises);
    console.log(results)
    const flattened = results.flatMap(enrollees => enrollees).filter(enrollees => enrollees.length > 0);
    console.log(flattened)

    res.render('enrolledDecision.ejs', { enrollees: flattened });
  } catch (error) {
    console.error('Error fetching enrolling decisions:', error);
    res.status(500).send('An error occurred while fetching enrolling decisions.');
  }
});

app.post('/enrollingdecision/:id', async (req, res) => {
  try {
    const enrolled = await enroll.findById(req.params.id);
    const verdict = req.body.choice;

    if (verdict === 'true') {
      const current = await student.findOne({ name: enrolled.name });
      current.subjects.push(enrolled.subject);
      await current.save();
    }

    await enroll.deleteOne({ _id: req.params.id });

    res.redirect('/enrollingdecision');
  } catch (error) {
    console.error('Error processing enrolling decision:', error);
    res.status(500).send('An error occurred while processing enrolling decision.');
  }
});


app.get('/messages/:user', async (req, res) => {
  const user = req.params.user;
  try {
    const allMessages = await Message.find();
    const messageInstance = allMessages.find(
      (current) =>
        current.people.includes(user) && current.people.includes(req.user.name)
    );

    if (!messageInstance) {
      const newMessageInstance = await Message.create({
        people: [user, req.user.name],
        messages:[]
      });
      res.send({ message: newMessageInstance, id: newMessageInstance._id });
    } else {
      res.send({ message: messageInstance, id: messageInstance._id });
    }
  } catch (error) {
    res.sendStatus(500);
    console.error(error);
  }
});

// Route to add a new message to the existing conversation
app.post('/message/:id', async (req, res) => {
  try {
    const messageInstance = await Message.findById(req.params.id);
    if (!messageInstance) {
      return res.sendStatus(404); // Not found
    }

    messageInstance.messages.push(req.body);
    await messageInstance.save();

    io.emit('message', req.body); // Emit the new message to all connected clients

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
    console.error(error);
  }
});




io.on('connection', (socket) => {
  console.log('a user connected')
})

app.get('/allchats', async (req, res) => {
  if (req.user.duty === 'student') {
    const stud = await student.findOne({ name: req.user.name });
    const studentSubjects = stud.subjects;
    const studentClass = stud.year;

    const allteachers = await teacher.find();
    console.log(allteachers)
    console.log(studentClass,studentSubjects)

    const teachers = allteachers.filter((teach) =>
      teach.subjects.some((subject) => studentSubjects.includes(subject.name) && subject.years.includes(studentClass))
    );
    console.log(teachers)
    res.render('allchatsstudents.ejs', { teachers: teachers });
  } 
  else {
    const prof = await teacher.findOne({ name: req.user.name });
    const distinctSubjects = prof.subjects.map((subject) => subject.name);

    const allStudents = await student.find();
    const kido = [];

    allStudents.forEach((stud) => {
      const distinctStudent = stud.subjects;

      distinctStudent.forEach((guy) => {
        distinctSubjects.forEach((sub) => {
          if (guy === sub) {
            const taught = prof.subjects.some((indi) => indi.name === sub && indi.years.includes(stud.year));
            if (taught) {
              kido.push(stud);
            }
          }
        });
      });
    });
    console.log(kido)
    res.render('allchatsteacher.ejs', { students: kido });
  }
});

app.get('/chat/:messanger', (req, res) => {
  // Assuming the 'user' object contains the logged-in user's information
  res.render('chat.ejs', { username: req.user.name, messanger: req.params['messanger'] });
});


app.get('/lessonsStudents/:subject', async(req,res)=>{
  const person = await student.findOne({name: req.user.name})
  const subjects = await classes.findOne({class: person.year, subject: req.params.subject})
  res.render('lessonsStudents.ejs',{lessons: subjects,name: req.user.name})
})

app.get("/classesStudents", async (req, res) => {
  const stud = await student.findOne({ name: req.user.name });
  const subjects = await Promise.all(stud.subjects.map(async (subject) => {
    var indie = await classes.findOne({ class: stud.year, subject: subject });
    if (!indie) {
      indie = await classes.create({ subject: subject, class: stud.year, lessons: [] });
    }
    return indie;
  }));

  res.render('classesS.ejs', { lessons: subjects });
});

app.get('/classesTeachers', async (req, res) => {
  try {
    const prof = await teacher.findOne({ name: req.user.name });
    
    const subjects = await Promise.all(prof.subjects.flatMap(async (subject) => {
      // Use regular for loop instead of map
      const yearPromises = [];
      for (const year of subject.years) {
        const indie = await classes.findOne({ class: year, subject: subject.name });
        if (!indie) {
          const newIndie = await classes.create({ subject: subject.name, class: year, lessons: [] });
          yearPromises.push(newIndie); // Push the new document to the array
        } else {
          yearPromises.push(indie); // Push the existing document to the array
        }
      }
      return yearPromises;
    }));

    // Flatten the array of arrays of promises
    const resolvedSubjects = await Promise.all(subjects.flat());

    res.render('classesT.ejs', { lessons: resolvedSubjects });
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    // Respond with an error message or redirect to an error page
    res.status(500).send('Internal Server Error');
  }
});



app.get('/lessonsTeachers/:subject/:class', async(req,res)=>{
  const subjects = await classes.findOne({class: req.params.class, subject: req.params.subject})
  res.render('lessonsTeachers.ejs',{lessons: subjects,name: req.user.name})
})

app.get('/deleteLessons/:id/:title', async(req,res)=>{
    const lesson = await classes.findById(req.params.id)
    const lessonIndex = lesson.lessons.findIndex(lesson => lesson.title === req.params.title);
    if (lessonIndex !== -1) {
      lesson.lessons.splice(lessonIndex, 1);
      await lesson.save();
    }

 
    res.render('lessonsTeachers.ejs',{lessons: lesson,name: req.user.name})
})

app.get('/deleteFiles/:id/:file/:title', async (req, res) => {
  try {
    const PleaseWork = new mongoose.mongo.GridFSBucket(connect.db, {
      bucketName: "uploads"
    });

    // Delete the file from GridFS
    console.log("File in question:", req.params.file);
    

    // Find the lesson in the classes schema
    const lesson = await classes.findById(req.params.id);
    console.log(lesson)
    // Find the specific lesson with matching title
    const spec = lesson.lessons.find(lesson => lesson.title === req.params.title);
    console.log(spec)
    // Find the index of the file in the spec's files array
    const lessonIndex = spec.files.findIndex(file => file.file.equals(new mongoose.Types.ObjectId(req.params.file)));
    console.log(lessonIndex)
    if (lessonIndex !== -1) {
      // Remove the file from the files array
      spec.files.splice(lessonIndex, 1);

      // Save the updated lesson and spec
      await lesson.save();
      
await PleaseWork.delete(new mongoose.Types.ObjectId(req.params.file));
      // Redirect to the appropriate view based on user role
      if (req.user.duty === 'teacher') {
        res.render('lessonsTeachers.ejs', { lessons: lesson, name: req.user.name });
      } else {
        res.render('lessonsStudents.ejs', { lessons: lesson, name: req.user.name });
      }
    } else {
      // Handle the case where the file wasn't found in the spec's files array
      console.log('File not found in lesson spec:', req.params.file);
      res.status(404).send('File not found.');
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).send('An error occurred while deleting the file.');
  }
});


app.post('/uploadFile/:id/:title',upload.single('file'), async(req,res)=>{
  const lesson = await classes.findById(req.params.id)
  const specific = lesson.lessons.find(lesson=> lesson.title === req.params.title)
  await specific.files.push({
    name: req.user.name,
    duty: req.user.duty,
    file: req.file.id,
  })
  await specific.save()
  await lesson.save()

  if(req.user.duty === 'teacher'){
    res.render('lessonsTeachers.ejs',{lessons: lesson,name: req.user.name})}
    else{
      res.render('lessonsStudents.ejs',{lessons: lesson,name: req.user.name})
    }
})


app.get('/newLesson/:id',async(req,res)=>{
  res.render('newLesson.ejs',{id: req.params.id})
})


app.post('/newLesson/:id',async(req,res)=>{
  
  const lecture = await classes.findById(req.params.id)
  

  const check = lecture.lessons.find(lesson=> lesson.title === req.body.title)
  if(!check){
  const lesson = {
      title: req.body.title,
      description: req.body.description,
      files:[]
    }


  await lecture.lessons.push(lesson)
  await lecture.save()

  res.render('lessonsTeachers.ejs',{lessons: lecture,name: req.user.name})}
  else{
    res.render('newLesson.ejs', {id: req.params.id})
  }
})

app.get('/updateLessons/:id/:title',async(req,res)=>{
  const lesson = await classes.findById(req.params.id)
  const lect = lesson.lessons.find(lesson=> lesson.title === req.params.title)
  res.render('updateLesson.ejs',{lesson: lect, id: req.params.id})
})

app.post('/updateLessons/:id/:title', async(req,res)=>{
  const lesson = await classes.findById(req.params.id)
  var instant = lesson.lessons.find(lesson=> lesson.title === req.params.title)
  var checker = lesson.lessons.find(lesson=> lesson.title === req.body.title && !(lesson._id.equals(new mongoose.Types.ObjectId(instant._id))))
  
  if(!checker){
  instant.title = req.body.title
  instant.description = req.body.description
  await instant.save()
  await lesson.save()

  res.render('lessonsTeachers.ejs',{lessons: lesson,name: req.user.name})}
  else{
    res.redirect('/updateLesson/'+ req.params.id + '/'+ req.params.title)
  }
})
