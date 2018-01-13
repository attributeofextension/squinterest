//fcc-Pinterest Clone challenge  - https://www.freecodecamp.org/challenges/build-a-pinterest-clone

//CONFIGURATION=================================================================
//EXPRESS
const express = require("express");
var app = express();

//MONGO AND MONGOOSE  see http://mongoosejs.com/docs/index.html
const mongo = require("mongodb").MongoClient;
const mongoose = require("mongoose");
var dbURL = "mongodb://nightlife-app:c4rr07qu33n@ds237717.mlab.com:37717/night-life-app";

mongoose.connect(dbURL,{ useMongoClient: true });
mongoose.Promise = global.Promise;
//Mongoose schema
//Users
var userSchema = new mongoose.Schema({
	name:String,
	email:String,
	password: String,
	twitterId: String
},{collection:'users'});
var User = mongoose.model("User",userSchema);
//Businesses
var businessSchema = new mongoose.Schema({
	location : String,
	id : String,
	name : String,
	rating : String,
	url : String,
	img_url : String,
	rsvp : [String]
},{collection:"businesses"});
var Business = mongoose.model("Business",businessSchema);

//BODY PARSER https://github.com/expressjs/body-parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//COOKIE PARSER
const cookieParser = require("cookie-parser");
app.use(cookieParser());

//FLASH 
const flash = require("connect-flash");
app.use(flash());

//BCRYPT
const bcrypt = require("bcrypt");
const saltRounds = 10;

//EXPRESS-SESSION
const expressSession = require('express-session');
app.use(expressSession({secret:'carrot'}));


//PASSPORT
const passport = require("passport");
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
  done(null, user._id);
});
passport.deserializeUser(function(id,done) {
  User.findById(id, function(err,user) {
    done(null,user);
  });
});
//
//HANDLEBARS
const exphbs = require("express-handlebars")
app.engine('handlebars',exphbs({defaultLayout:'main'}));
app.set('view engine','handlebars');


//PASSPORT STRATEGIES===========================================================
const TwitterStrategy = require('passport-twitter').Strategy;

passport.use(new TwitterStrategy({
    consumerKey: "x9m8ZXLgfMuFbUlSerNH4E30I",
    consumerSecret: "oTb4KDYkQoT8Mw9Mz2IM7d747h3WrY3a6DoApn1qFBE3bD5MU5",
    callbackURL: 'localhost:8080/auth/twitter/callback'
  },
  function(token, tokenSecret, profile, cb) {

    User.findOne({ twitterId: profile.id }, function (err, user) {
      if(err) {
        console.log("Error findin Twitter User: " + err);
        throw err;
      }
        if(user) {
            return cb(null, user);
        } else {
        var newUser = new User();
        newUser.twitterId = profile.id;

        newUser.save(function(err){
           if(err) {
                console.log("Error saving Twitter User: " + err); 
                throw err;
           }
           return cb(null,newUser);
        });
    }
    });
  }
));
//ROUTING=======================================================================
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.render("all", {user:req.user});
});

app.get("/auth/twitter", passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});

//PORT========================================================================
var listener = app.listen(8080,function() {
    console.log("Your app is listening on port " + listener.address().port);
});