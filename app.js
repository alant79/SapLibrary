const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require("multer");
const upload = multer({ dest: 'uploads/' })
const app = express();
const bodyParser = require('body-parser');
const expressSession = require('cookie-session')
const { MongoClient } = require('mongodb');
var collection, collectionFile

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: 512 * 1024 * 1024 }));
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
    res.status(500).send({ err: err.message });
  }
});

app.get('/getData', function (req, res) {
  try {
    const login = req.session._ctx.body.login || req.session.login

    if (!login) {
      res.Status(401);
      return
    }
    readUser(login).then(data => res.send(data))

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

    user = req.body.USER || req.body.user

    // filesFromReq = getFilesFromReq(req.body.files).then(()=> {
    collection.updateOne({ user }, {
      $set: {
        transactions: req.body.transactions, functions: req.body.functions, refs: req.body.refs,
        classes: req.body.classes, badies: req.body.badies, bapies: req.body.bapies, fms: req.body.fms, exprs: req.body.exprs,
        files: req.body.files, custdep: req.body.custdep
      }
    }, { upsert: true })

    // fs.writeFileSync(file,JSON.stringify(req.body, null, 4))
    res.send('ok');
    // })


  } catch (err) {
    console.log(err)
    res.status = 500;
    res.send({ err: err.message })
  }
});

app.get('/', function (req, res) {

  try {
    readAllUsers().then(data => {
      res.send(data)
    })

  } catch (err) {
    res.status = 500;
    res.send({ err: err.message })
  }
});

app.post('/setFile', upload.single('FILEDATA'), function (req, res) {
  const fileName = req.body.fileName || req.body.FILENAME
  collectionFile.updateOne({ fileName }, {
    $set: { file: fs.readFileSync(req.file.path) }
  }, { upsert: true })
  fs.unlinkSync(req.file.path)
  res.send('ok')
})

const getFilesFromReq = async (filelist) => {

  filelistReturn = filelist
  filelistReturn.map(fileEl => {
    const pathFile = path.join(__dirname, 'uploads', fileEl.filesfullname)
    fs.writeFile(pathFile, fileEl.filesData, function (err) {
      fileEl.filesdata = fs.readFile(pathFile, function (err) {
        fs.unlink(pathFile)
      })
    })
  })
  return filelistReturn
}

// app.post('/setFileBinary', function (req, res) {
//   const user = req.body.USER || req.body.user
//   const id = req.body.ID || req.body.id
//   const fileName = req.body.FILENAME || req.body.filename
//   var fileData = req.body.FILEDATA || req.body.filedata
//   var pathFile = path.join(__dirname, 'uploads', fileName)
//   fs.writeFile(pathFile, fileData, function (err) {
//     collection.updateOne({ user}, {
//       $set: { 'files.$[elem].filesdata': fileData }
//     }
//     ,
//       { arrayFilters: [{ "elem.filesid":  id }] }
//     ).then((r) => {
//       console.log(r)
//       fs.unlink(pathFile, function () {
//         res.send('ok')
//       });
//     })
//   })
// })

app.post('/setFileBinary', function (req, res) {
  const fileid = req.body.FILEID || req.body.fileid
  const username = req.body.USERNAME || req.body.username
  const filedata = req.body.FILEDATA || req.body.filedata
  console.log(filedata)
  // const filename = req.body.FILENAME || req.body.filename
  // var pathFile = path.join(__dirname, 'uploads', filename)
  // fs.writeFile(pathFile, filedata, function (err) {
  collection.updateOne({ fileid, username }, {
    $set: { 'filedata': filedata }
  }
    , { upsert: true }
  ).then(() => {

    // fs.unlink(pathFile, function () {
    res.send('ok')
    // });
    // })
  })

})


app.post('/getFile', function (req, res) {
  const fileName = req.body.fileName || req.body.FILENAME
  collectionFile.findOne({ fileName }).then(data => {
    const pathFile = path.join(__dirname, 'uploads', fileName)
    fs.writeFile(pathFile, data.file.buffer, function (err) {
      res.sendFile(pathFile)
      res.on('finish', function () {
        try {
          fs.unlinkSync(pathFile);
        } catch (e) {
          console.log("error removing ", e);
        }
      });
    })
  })
})

app.post('/getFileBinary', function (req, res) {
  const fileid = req.body.FILEID || req.body.fileid
  const username = req.body.USERNAME || req.body.username
  const filename = req.body.FILENAME || req.body.filename
  collection.findOne({ fileid, username }).then(data => {
    res.send({filedata: data.filedata})
    // const pathFile = path.join(__dirname, 'uploads', filename)
    // fs.writeFile(pathFile, data.filedata.buffer, function (err) {
    //   res.sendFile(pathFile)
    //   res.on('finish', function () {
    //     try {
    //       fs.unlinkSync(pathFile);
    //     } catch (e) {
    //       console.log("error removing ", e);
    //     }
    //   });
    // })
  })
})



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  res.status = 404;
  res.send(err)
  next(err);
});

const readUser = async (user) => {
  arr = []
  const customers = require(__dirname + '/customers.json');
  await collection.findOne({ user }).then(data => {
    userObj = { user }
    userObj.transactions = data.transactions
    userObj.functions = data.functions
    userObj.refs = data.refs
    userObj.classes = data.classes
    userObj.badies = data.badies
    userObj.bapies = data.bapies
    userObj.fms = data.fms
    userObj.exprs = data.exprs
    userObj.cust = customers
    userObj.files = data.files
    userObj.custdep = data.custdep
    arr.push(userObj)
  }
  ).catch(err => {
    userObj = { user }
    userObj.transactions = []
    userObj.functions = []
    userObj.refs = []
    userObj.classes = []
    userObj.badies = []
    userObj.bapies = []
    userObj.fms = []
    userObj.exprs = []
    userObj.cust = customers
    userObj.files = []
    userObj.custdep = []
    arr.push(userObj)
  })
  return arr
}

const readAllUsers = async () => {
  arr = []
  const data = await collection.find()
  doc = await data.next()
  while (doc != null) {
    arr.push(doc)
    doc = await data.next()
  }
  return arr
}

const server = app.listen(process.env.PORT || 3000, function () {
  console.log('Сервер запущен на порте: ' + server.address().port);
});

const uri = "mongodb+srv://alpe:12345@cluster0.cieys.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  console.log('Клиент Mongo запущен');
  collection = client.db("alpe").collection("sap-library");
  collectionFile = client.db("alpe").collection("test-for-file");
});


