var express = require('express');
var hbs = require('hbs');
var fs = require('fs');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var glob = require('glob')
var dateFormat = require('dateformat');


let route_list = {}
glob.sync('./routes/*.js', {}).forEach(v => {
  let filename = path.basename(v, '.js')
  route_list[filename] = require(path.join(__dirname, 'routes', filename))
})

var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));


// set the view engine to use handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.set('view options', {
  layout: 'share/layout'
});
app.set('view cache', false);


app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use('/file', express.static(path.join(__dirname, 'module_files')));
app.use(express.static(path.join(__dirname, 'public')));



hbs.registerHelper('partial', function (name, context) {
  var partialhbs = fs.readFileSync(path.join('./','views','partial',name + '.hbs'), 'utf-8');
  var template = hbs.handlebars.compile(partialhbs);
  var result = template(context.data.root);
  return new hbs.handlebars.SafeString(result);
});

var blocks = {};
hbs.registerHelper('extend', function (name, context) {
  var block = blocks[name];
  if (!block) {
    block = blocks[name] = [];
  }

  block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
});

hbs.registerHelper('block', function (name, context) {
  var val = (blocks[name] || []).join('\n');
  // clear the block
  blocks[name] = [];
  return val;
});

//把毫秒数时间格式化
hbs.registerHelper('foramtdate', function(longtime) {
  var date = new Date(parseInt(longtime));
  return dateFormat(date, "yyyy-mm-dd HH:MM:ss");
});


for (let v in route_list) {
  if (v == 'home') {
    app.use('/', route_list[v])
  }
  app.use('/' + v, route_list[v]);
}


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error(req.url + ' Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



let port = 9888
app.listen(port, function () {
  console.log("extrajs启动 端口号:" + port);
});
