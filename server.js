//fcc-Pinterest Clone challenge  - https://www.freecodecamp.org/challenges/build-a-pinterest-clone

//CONFIGURATION=================================================================
//EXPRESS
const express = require("express");
var app = express();

//MONGO AND MONGOOSE  see http://mongoosejs.com/docs/index.html
const mongo = require("mongodb").MongoClient;
const mongoose = require("mongoose");
var dbURL = "mongodb://squinterest-app:c4rr07qu33n@ds255347.mlab.com:55347/squinterest";

mongoose.connect(dbURL,{ useMongoClient: true });
mongoose.Promise = global.Promise;
//Mongoose schema
//Users
var userSchema = new mongoose.Schema({
	twitterId: String,
  profilePic: String
},{collection:'users'});
var User = mongoose.model("User",userSchema);
//Pics
var picSchema = new mongoose.Schema({
	url : String,
  description: String,
  userid : String,
  userpic : String,
	likes : [String]
},{collection:"pics"});
var Pic = mongoose.model("Pic",picSchema);

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
    callbackURL: 'https://squinterest.herokuapp.com/auth/twitter/callback'
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
        console.log(JSON.stringify(profile));
        newUser.twitterId = profile.id;
        newUser.profilePic = profile.photos[0];

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
  Pic.find({}, function(err, pics) {
    if (err) {
      console.log("Error fetching Pics: " + err);
      res.redirect("/");
    }
    res.render("all", {user:req.user,pics: pics});
  }); 

});
app.post("/add", function(req,res) {
  if(req.user) {
    var newPic = new Pic();
    newPic.url = req.body.picurl;
    newPic.description = req.body.picdesc;  
    newPic.userid = req.user._id;
    newPic.likes = [];
    newPic.userpic = req.user.profilePic;

    newPic.save( function(err) {
      if(err) {
        console.log("Error adding new Pic: " + err);
        res.redirect('/');
      }
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});
app.get('/my', function(req,res) {
  Pic.find({userid:req.user._id}, function(err, pics) {
    if(err) {
      console.log("Error fetching my Pics: " + err);
    }
    res.render('my', {user:req.user,pics:pics});
  });
});
app.post("/like", function(req,res) {
  if(req.user) {
  Pic.findOne({_id:req.body.picid}, function (err, pic) {
    if(err) {
      console.log("Error fetching Pic: " + err);
      res.redirect('/');
    }
    var liked = false;
    for(var i = 0; i < pic.likes.length; i++) {
      if(pic.likes[i] == req.user._id) {
        liked = true;
        pic.likes.splice(i,1);
      }
    }
    if(!liked) {
      pic.likes.push(req.user._id);
    }
    pic.save( function (err) {
      if(err) {
        console.log("Error saving Pic: " + err);
        res.redirect('/');
      }      
      res.redirect('/');
    });
  });

  } else {
    res.redirect('/auth/twitter');
  }
});
app.post("/delete", function (req,res) {
  if(req.user) {
  Pic.remove({_id:req.body.picid}, function(err) {
    if(err) {
      console.log("Error removing Pic: " + err);
      res.redirect('/');
    }
    res.redirect('/');
  });

  } else {
    res.redirect('/auth/twitter');
  }
})
app.get("/auth/twitter", passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});
app.get('/logout',function(req,res) {
  if(req.user) {
    req.logout();
    res.redirect('/');
  } else {
    res.redirect('/');
  }
});
//PORT========================================================================
var listener = app.listen(process.env.PORT,function() {
    console.log("Your app is listening on port " + listener.address().port);
});