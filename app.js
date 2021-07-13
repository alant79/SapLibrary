const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const bodyParser = require('body-parser');
const expressSession = require('cookie-session')

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressSession({
  secret: 'keyboard cat', resave: true,
  saveUninitialized: true, cookie: { maxAge: 60000, secure: true }
}))

app.post('/auth', function (req, res) {
  try {
    const { login, password } = req.body;
    const users = require(__dirname + '/users.json');
    let fl = false;
    users.forEach(el => {

      if (el.login == login && el.password == password) {
        fl = true;
        req.session.login = el.login
        req.session.admin = el.admin
        res.send({ isAdmin: el.admin })
      }
    });

    if (!fl) {
      res.sendStatus(500);
    }

  } catch (err) {
    res.status(500).send({err: err.message});
  }
});

app.get('/getData', function (req, res) {
  try {
    const login = req.session._ctx.body.login || req.session.login
    const admin = req.session._ctx.body.admin || req.session.admin
    if (!login) {
      res.Status(401);
      return
    }

    const users = require(__dirname + '/users.json');

    resObj = []

    if (admin) {
      users.forEach(el => {
        readUser(el.login, resObj)
      })
    } else {
      readUser(login, resObj)
    }
    res.send(resObj)

  } catch (err) {
    res.status = 500;
    res.send({ err: 'Ошибка ' + err.name + ":" + err.message + ":" + err.stack })
  }
});

app.post('/setData', function (req, res) {
  try {
    const login = req.session._ctx.body.user || req.session.login
    const admin = req.session._ctx.body.admin || req.session.admin
    if (!login) {
      res.Status(401);
      return
    }

    user =  req.body.USER || req.body.user
    const file = path.join(__dirname, `${user.toLowerCase()}.json`)
    fs.unlinkSync(file)
    //fs.writeFileSync(__dirname + `/${user.toLowerCase()}.json`,JSON.stringify(req.body, null, 4))
    res.send('ok');

  } catch (err) {
    console.log(err)
    res.status = 500;
    res.send({ err: err.message })
  }
});

app.get('/', function (req, res) {
    res.send('ok')
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  res.status = 404;
  res.send(err)
  next(err);
});

const readUser = (user, resObj) => {
  const functionGroups = require(__dirname + '/functions.json');
  try {
    const data = require(__dirname + `/${user.toLowerCase()}.json`);
    userObj = { user }
    const functionsArr = []
    userObj.transactions = data.transactions
    functionGroups.forEach(fg => {
      functionsArr.push(fg)
      data.functions.filter(f => f.functionParent == fg.functionId).forEach(f => {
        functionsArr.push(f)
      })
    })
    userObj.functions = functionsArr
    resObj.push(userObj)
  } catch (err) { 
    res.status = 500;
    res.send({ err: err.message })
  }
}
 
const server = app.listen(process.env.PORT || 3000, function () {
  console.log('Сервер запущен на порте: ' + server.address().port);
});