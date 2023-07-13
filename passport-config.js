const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const User = require('./models/usermodel')
function initialize(passport,getUserByEmail){
    const authenticateUser = async(email,password,done)=>{
        const user = await getUserByEmail(email)
        if (user == null){
            return done(null,false,{message: 'No user with that email found'})
        }
        try {
            if(await bcrypt.compare(password,user.password)){
                return done(null,user, console.log({message: 'valid'}))
            }
            else{
                return done(null,false, {message: 'Password incorrect'})
            }
        } catch (error) {
                return done(error)
        }

    }
    passport.use(new LocalStrategy({usernameField: 'email'},authenticateUser))
    passport.serializeUser((user,done)=> { 
        
        console.log(user.name)
        done(null,user.id)})
        passport.deserializeUser((id, done) => {
            User.findById(id)
                .then(user => {
                    return done(null, user);
                })
        });
        
        }
module.exports =  initialize