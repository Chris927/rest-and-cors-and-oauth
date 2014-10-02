var util = require('util'),
    restify = require('restify'),
    restifyValidator = require('restify-validator');

var server = restify.createServer();
server.use(restify.bodyParser());
server.use(restifyValidator);

var items = {};
var lastId = 0;

server.get({ name: 'items', path: '/history/:me' }, function(req, res, next) {
  var itemsAsArray = [];
  for (var i in items) {
    var item = items[i];
    var itemWithLinks = {
      who: item.who,
      title: item.title,
      uri: item.uri,
      links: {
        'delete': server.router.render('items.delete', { id: item.id })
      }
    };
    itemsAsArray.push(itemWithLinks);
  }
  res.send({
    items: itemsAsArray,
    links: {
      add: server.router.render('items.add', { me: req.params.me })
    }
  });
  next();
});

server.post({ name: 'items.add', path: '/items/:me' }, function(req, res, next) {
  req.assert('title').notEmpty();
  req.assert('uri').notEmpty();
  var errors = req.validationErrors();
  if (errors) return res.send(422, util.inspect(errors));
  var item = {
    id: ++lastId,
    who: req.params.me,
    title: req.params.title,
    uri: req.params.uri
  };
  items[item.id] = item;
  res.send(201, item);
});

server.del({ name: 'items.delete', path: '/items/:id' }, function(req, res, next) {
  if (!items[req.params.id]) return res.send(404);
  delete items[req.params.id];
  res.send(200);
});

server.listen(process.env.PORT || 3020, function() {
  console.log('%s listening at %s', server.name, server.url);
});
