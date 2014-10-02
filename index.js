var restify = require('restify');

var server = restify.createServer();
server.use(restify.bodyParser());

var items = [];

server.get('/history/:me', function(req, res, next) {
  res.send({
    items: [],
    links: {
      add: { location: '/history/' + req.params.me, method: 'POST' }
    }
  });
  next();
});

server.post('/history/:me', function(req, res, next) {
  var item = {
    who: req.params.me,
    title: req.params.title,
    uri: req.params.uri
  };
  res.send(201, item);
});

server.listen(process.env.PORT || 3020, function() {
  console.log('%s listening at %s', server.name, server.url);
});
