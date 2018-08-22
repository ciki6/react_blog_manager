let express = require('express');
let session = require('express-session');

let path = require('path');
let logger = require('morgan');
// let ueditor = require('ueditor');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let fs = require('fs');
let multer  = require('multer');
let upload = multer({ dest: 'uploads/' });

let db = require('./db.js');
let routes = require('./routes/index');
let user = require('./controller/user');

let app = express();
let router = express.Router();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json({ 
	"limit": "50000kb"
}));
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(cookieParser());
app.use(session({
	name: 'admin.sid',
	resave: true, // don't save session if unmodified  
	saveUninitialized: false, // don't create session until something stored  
	secret: 'FD7A2B5FAC263248'
}));

//静态文件目录
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../../resource')));

app.get('/favicon.ico', function(req, res, next) {
	res.sendfile(path.join(__dirname, '../public/favicon.ico')); // 发送静态文件
});

app.get('/login', function(req, res, next) {
	if(req.session.userid) {
		res.redirect('/home');
	}
	else {
		res.sendfile(path.join(__dirname, '../public/dist/index.html')); // 发送静态文件
	}
});

app.get('/checkAuth', function(req, res, next) {
	if(req.session.userid) {
		res.redirect(`${req.query.url}`);
	}
	else {
		res.redirect('/login');
	}
});

app.get('/toLogin', user.toLogin);

app.get('/logout', function(req, res, next) {
	req.session.userid = null;
	res.redirect('/login');
});

app.use(function(req, res, next) {
	if (req.session.userid) {
		next();
	} else {
		res.redirect('/login');
	}
});

app.post("/upload", upload.single('pic-upload'), function(req, res) {
	// rich test editor upload image request
  if (!req.file) {
    res.json({
      code: 400,
      message: '上传失败'
    });
    return;
  }


// 重命名文件
  let oldPath = path.join(__dirname, '../'+req.file.path);
  let newPath = path.join(__dirname, '../public/uploads/' + req.file.originalname);
  fs.rename(oldPath, newPath, (err) => {
    console.log(oldPath);
    console.log(newPath);
    if (err) {
      res.json({
        code: 400,
        message: '上传失败',
        err: err
      });
    } else {
      res.json({
        code: 200,
        message: '上传成功',
        data: {
          link: 'http://localhost:3001/public/uploads/' + req.file.originalname
        }
      });
    }
  });
});


app.use('/', routes);

// development error handler will print stacktrace
if (app.get('env') === 'development') {
	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler no stacktraces leaked to user
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

module.exports = app;