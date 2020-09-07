require('./db');
const express = require('express');
const app = express();
const crypto = require('crypto');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const flash = require('connect-flash');
const MongoDBStore = require('connect-mongodb-session')(session);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
const User = mongoose.model('User');
const Album = mongoose.model('Album');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(flash());
require('./db');


//Authentication code based on https://miryang.dev/2019/04/11/nodejs-page-2/
const store = new MongoDBStore({
	uri: process.env.MONGODB_URI,
    //uri: "mongodb://kwangi1992:rhkswl12@localhost/final",
    collection: 'sessions'
});


//Authentication code based on https://miryang.dev/2019/04/11/nodejs-page-2/
store.on('error', function(err){
    console.log(err);
});
const sessionOptions = { 
	secret: 'secret for signing session id', 
	saveUninitialized: true, 
    resave: false,
    rolling: true,
    store: store 
};

app.use(session(sessionOptions));

//Authentication code based on https://miryang.dev/2019/04/11/nodejs-page-2/
app.use(passport.initialize());
app.use(passport.session());
//Authentication code based on https://miryang.dev/2019/04/11/nodejs-page-2/
passport.serializeUser(function (user, done) {
    done(null, user);
});
//Authentication code based on https://miryang.dev/2019/04/11/nodejs-page-2/
passport.deserializeUser(function (user, done) {
    done(null, user);
});


//Authentication code based on https://miryang.dev/2019/04/11/nodejs-page-2/
passport.use(new LocalStrategy({
    usernameField: 'userid',
    passwordField: 'password',
    passReqToCallback : true
    },
    function (req, userid, password, done){
        User.findOne({
            userid: userid,
            //crypto code based on https://miryang.dev/2019/04/11/nodejs-page-2/
            password: crypto.createHash('sha512').update(password).digest('base64')},
            function(err, user){
                if(err){
                    console.log(err);
                }
                else if(!user){
                    return done(null, false, req.flash('login_message','Login fail!!!!!!!!'));
                }
                else{
                    return done(null, user);
                }
        });
        
    }

));
function logincheck(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}

function alreadylogin(req, res, next){
    if(!(req.isAuthenticated())){
        return next();
    }
    res.redirect('home');
}

class Photo{
    constructor(name, url, date){
        this.name = name;
        this.url = url;
        this.date = date;

    }
    getUrl(){
        return this.url;
    }
    getDate(){
        return this.date;
    }
}

app.get('/others', function(req, res){
    const photos = [];
    Album.find({share: "yes"}, function(err, result){
        if(err){
            console.log(err);
        }
        else{
            for(let i = 0; i< result.length; i++){
                console.log(result[i].photos);
                for(let j = 0; j<result[i].photos.length; j++){
                    console.log(result[i].photos[j]);
                    photos.push(result[i].photos[j])
                }
            }
            res.render('share', {result: photos});
        }
    })
});
app.get('/', alreadylogin, function(req, res) {
	res.render('index');

});

app.post('/login', passport.authenticate('local', {failureRedirect: '/login', failureFlash: true}), function (req, res){
    console.log("success");
    res.redirect('home');
});

app.get("/login", function(req,res){
    res.render("login", {message: req.flash('login_message')});
});
app.get('/signup', function(req, res) {
	res.render('signup', {message: req.flash('singup_message')});
    
});

app.post('/signup', function(req, res){
    User.find({userid: req.body.userid}, function(err, result){
        if(result.length >0){
            console.log("exist");
            req.flash('singup_message','Same id already exits');
            res.redirect('/signup');
        }
        else{
            console.log("what");
            const newuser = new User({
                _id: new mongoose.Types.ObjectId(),
                userid: req.body.userid,
                //Crypto based on  https://miryang.dev/2019/04/11/nodejs-page-2/
                password: crypto.createHash('sha512').update(req.body.password).digest('base64'),
                email: req.body.email
            });
            newuser.save().then(result => {
                console.log(result);
                res.redirect("/");
            }).catch(err => {
                console.log(err);
            });
        }
    });
    
});
app.get('/logout', function (req, res){
    req.logout();
    res.redirect('/');
});


app.get('/home', logincheck, function(req, res){
    console.log("query", req.query);
    console.log(req.user.list);
    console.log(req.user.userid);
    Album.find({user: req.user._id}, function(err, result){
        if(req.query.name === undefined && req.query.date === undefined){
            res.render('home', {data: result});
            console.log("check result", result);
        }
        else if(req.query.name !== '' && req.query.date !== ''){
            const namefiltered = result.filter( x => x.name === req.query.name);
            const datefiltered = namefiltered.filter( x => x.date === req.query.date);
            console.log(datefiltered);
            res.render('home', {data: datefiltered});
        }
        else if(req.query.name !== ''){
            const filtered = result.filter( x => x.name === req.query.name);
            res.render('home', {data: filtered});
        }
        else if(req.query.date !== ''){
            const filtered = result.filter( x => x.date === req.query.date);
            res.render('home', {data: filtered});
        }
        else{
            res.render('home', {data: result});
            console.log("check result", result);
        }
        
        
    });

    User.find(req.user, (err, result)=>{
        console.log(result);
    });

  
});
//log in checker
app.get('/home/:id', logincheck, function(req,res){
    Album.findById(req.params.id, function (err, result){
        
        if(req.query.name === undefined && req.query.date === undefined){
            res.render('album', {data: result, photos: result.photos});
        }
        else if(req.query.name !== '' && req.query.date !== ''){
            const namefiltered = result.photos.filter( x => x.name === req.query.name);
            const datefiltered = namefiltered.filter( x => x.date === req.query.date);
            console.log(datefiltered);
            res.render('album', {data: result, photos: datefiltered});
        }
        else if(req.query.name !== ''){
            console.log("cehck");
            console.log(result.photos);
            const filtered = result.photos.filter( x => x.name === req.query.name);
            console.log(filtered);
            res.render('album', {data: result, photos: filtered});
        }
        else if(req.query.date !== ''){
            const filtered = result.photos.filter( x => x.date === req.query.date);
            res.render('album', {data: result, photos: filtered});
        }
        else{
            res.render('album', {data: result, photos: result.photos});
            console.log("check result", result);
        }
        

    });
});
app.get('/home/:id/add', logincheck, function(req,res){
    console.log(req.params.id);
    //res.render('add', {data: req.params.id});
    Album.findOne({_id:req.params.id}, function(err, post){
        if(err){
            console.log(err);
        }
        res.render('add', {post:post});
    });
    
});


app.post('/home/:id', function(req, res){
    //console.log("what");
    console.log(req.params.id);
    Album.findOneAndUpdate({_id:req.params.id}, { $push: {photos: new Photo(req.body.name, req.body.url, req.body.date)}}, function(err,result){
      if(err) {
          console.log(err);
      }
      console.log(result);
      res.redirect("/home/"+req.params.id);
    });
  });



app.get('/createalbum', logincheck, function(req, res){
    res.render('createalbum');
});
app.post('/createalbum', function(req,res){
    console.log(req.user);
    console.log(req.body);
    const newAlbum = new Album({
        _id: new mongoose.Types.ObjectId(),
        user : req.user._id,
        name : req.body.albumname,
        photos: [],
        date: req.body.date,
        share: req.body.share

    });
    newAlbum.save().then(result =>{
        console.log(result);
        res.redirect("/home");
    }).catch(err =>{
        console.log(err);
    });
    User.findOneAndUpdate({"userid" : req.user.userid}, { $push : {list : newAlbum._id}}, {returnNewDocument: true},
        function(err, result){
            if(err){
                console.log(err);
            }
            else{
                console.log(req.user.userid);
                console.log(result);
            }
        }
    
    
    );
    User.find(req.user, (err, result)=>{
        console.log(result);
    });


    
});





const port = process.env.PORT || 3000;
app.listen(port);