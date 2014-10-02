var util = require('util'),
    restify = require('restify'),
    restifyValidator = require('restify-validator');

var server = restify.createServer();
server.use(restify.bodyParser());
server.use(restifyValidator);

var items = [];

server.get('/history/:me', function(req, res, next) {
  res.send({
    items: items,
    links: {
      add: { location: '/history/' + req.params.me, method: 'POST' }
    }
  });
  next();
});

server.post('/history/:me', function(req, res, next) {
  req.assert('title').notEmpty();
  req.assert('uri').notEmpty();
  var errors = req.validationErrors();
  if (errors) return res.send(422, util.inspect(errors));
  var item = {
    who: req.params.me,
    title: req.params.title,
    uri: req.params.uri
  };
  items.push(item);
  res.send(201, item);
});

server.listen(process.env.PORT || 3020, function() {
  console.log('%s listening at %s', server.name, server.url);
});
