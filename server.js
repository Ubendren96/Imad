var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool = require('pg').Pool;
var crypto = require('crypto');
var bodyParser = require('body-parser');
var session = require('express-session');

var app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(session({
    secret:'someRandomsecretValue',
    cookie:{maxAge:1000*60*60*24*30}
}));

var config = {
    user:'ubendren96',
    database : 'ubendren96',
    host : 'db.imad.hasura-app.io',
    port : '5432',
    password : process.env.DB_PASSWORD
};

var articals = {
    'articleOne' :{
    title : 'Artical One | Ubendren',
    heading :'Artical One',
    date : 'Aug 6, 2017',
    content :`
     <p>
            This is the content for my first artical.This is the content for my first artical.This is the content for my first artical.
            This is the content for my first artical.This is the content for my first artical.This is the content for my first artical.
            This is the content for my first artical.
    </p>     
    `
},
    'articleTwo' :{
        title : 'Artical Two | Ubendren',
    heading :'Artical Two',
    date : 'Aug 6, 2017',
    content :`
     <p>
            This is the content for my second artical.This is the content for my second artical.This is the content for my second artical.
            This is the content for my second artical.This is the content for my second artical.This is the content for my second artical.
            This is the content for my second artical.
    </p>     
    `
    },
    'articleThree' : {title : 'Artical Three | Ubendren',
    heading :'Artical Three',
    date : 'Aug 6, 2017',
    content :`
     <p>
            This is the content for my Third artical.This is the content for my Third artical.This is the content for my Third artical.
            This is the content for my Third artical.This is the content for my Third artical.This is the content for my Third artical.
            This is the content for my Third artical.
    </p>     
    `}
};
function createTemplate (data){
    var title = data.title;
    var date = data.date;
    var heading = data.heading;
    var content = data.content;
    var htmlTemplate = `'
    <html>
    <head>
        <title>
            ${title}
        </title>
        <meta name="viewport" content ="width=device-width , initial-scale=1"/>
        <link href="/ui/style.css" rel="stylesheet" />
    </head>
    <body>
        <div class = "container">
            <a href="/" >Home</a>
            <hr/>
            <div>
                ${date.toString()}
            </div>
            <h1>Personal</h1>
            <p>
                This is my personal information about me.
            </p>
            <h1>Professional</h1>
            <p>
                This is my list of experiences :
            </p>
            <ol>
                <li>Company A: Worked as someone seriously.</li>
                <li>Company B: Worked without seriousnous.</li>
            </ol>
                ${content}
        </div>
    </body>
    </html>
    `;
    return htmlTemplate;
}

app.get('/ui/main.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'main.js'));
});

var pool = new Pool(config);

app.get('/test-db',function(req,res){
   //make a select reequest
   //return a response with the results
   pool.query('select * from test',function(err,result){
      if(err){
          res.status(500).send(err.toString());
      } else{
          res.send(JSON.stringify(result.rows));
      }
   });
});

app.get('/artical-one', function (req, res){
    res.send("This is artical-one");
});

function hash(input,salt){
    var hashed = crypto.pbkdf2Sync(input,salt,10000,512,'sha512');
    return ["pbkdf2","10000",salt,hashed.toString('hex')].join('$');
}

app.post('/create-user',function(req,res){
   var username = req.body.username;
   var password = req.body.password;
   var salt = crypto.randomBytes(128).toString('hex');
   var dbstring = hash(password,salt);
   pool.query('INSERT INTO "user" (username,password) VALUES ($1,$2)',[username,dbstring],function(err,result){
      if(err){
          res.status(500).send(err.toString('hex'));
      } 
      else{
          res.send('User successfully created '+username);
      }
   });
});

//*
app.post('/login',function(req,res){

   var username = req.body.username;
   var password = req.body.password;
   
   pool.query('SELECT * FROM "user" WHERE username = $1',[username],function(err,result){
      if(err){
          res.status(500).send(err.toString());
      } else{
          if(result.rows.length === 0){
              res.status(403).send('username or password is invalid');
          }else{
              var dbString= result.rows[0].password;
              var salt = dbString.split('$')[2];
              var hashedpassword = hash(password,salt);
              
              if(hashedpassword === dbString){
                  req.session.auth={userId: result.rows[0].id};
                  res.send('User loged successfully!');
              }else{
                  res.status(403).send('username or password is invalid');
              }
          }
      }
   });
});

app.get('/check-login',function (req,res){
   if(req.session&&req.session.auth&&req.session.auth.userId){
       res.send('You are logged in : '+req.session.auth.userId.toString());
   } else{
       res.send('You are not logged in');
   }
});

app.get('/logout',function(req,res){
   delete req.session.auth;
   res.send('Logged out');
});

app.get('/hash/:input',function(req, res){
   var hashedString = hash(req.params.input,'this is any random string'); 
   res.send(hashedString);
});

var counter=0;
app.get('/counter',function (req, res){
    counter=counter+1;
    res.send(counter.toString());
});

app.get('/artical-two',function(req, res){
    res.send("This is artical-two");
});

app.get('/artical-three',function(req, res){
    res.send("This is artical-three");
});

var names=[];
app.get('/submit-name', function (req, res) {
  var name = req.query.name;
  names.push(name);
  res.send(JSON.stringify(names));
});

app.get('/articles/:articleName',function(req, res){
    
    pool.query("select * from article where title = '"+req.params.articleName+"'" , function(err,result){
       if(err){
           res.status(500).send(err.toString());
       } else{
           if(result.rows.length===0){
               res.status(404).send('Article not found');
           }else{
               var articleData = result.rows[0];
               res.send(createTemplate(articleData));
           }
       }
    });
});

app.get('/ui/style.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

app.get('/favicon.ico', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'favicon.ico'));
});

app.get('/ui/madi.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'madi.png'));
});


// Do not change port, otherwise your app won't run on IMAD servers
// Use 8080 only for local development if you already have apache running on 80
var port = 80;
app.listen(port, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
