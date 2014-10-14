var util = require('util'),
    restify = require('restify'),
    passport = require('passport'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    restifyValidator = require('restify-validator'),
    request = require('request');

passport.use(new BearerStrategy({
}, function(token, done) {
  console.log('token', token);
  request({
    url: 'http://localhost:8080/my-openid-connect-server/api/tokens/access', // TODO: hardcoded
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }, function(err, res, body) {
    if (err) return done(err);
    var tokens = JSON.parse(body);
    console.log('res.statusCode', res.statusCode);
    if (res.statusCode == 401) return done(new Error('not authorized: ' + tokens.error));
    if (res.statusCode >= 300) return done(new Error('unknown / unexpected result: ' + body));
    console.log('tokens', tokens);
    if (!tokens[0] || !tokens[0].userId) return done(new Error('missing userId in (first) token'));
    done(null, { id: tokens[0].userId });
  });
}));

restify.CORS.ALLOW_HEADERS.push('authorization');

var server = restify.createServer();
server.pre(function(req, res, next) {
  console.log('req.path', req.path());
  console.log('req.headers', req.headers);
  next();
});
server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.bodyParser());
server.use(restifyValidator);
server.use(passport.initialize());
server.use(passport.authenticate('bearer', { session: false })); // ensures all routes are protected
/* server.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}); */

var items = {};
var lastId = 0;

function decorateItemWithMediaLinks(item) {
  return {
    who: item.who,
    title: item.title,
    uri: item.uri,
    links: {
      'delete': server.router.render('items.delete', { id: item.id }),
      'get': server.router.render('items.get', { id: item.id })
    }
  };
}

server.get({ name: 'items', path: '/history' }, function(req, res, next) {
  var user = req.user;
  var itemsAsArray = [];
  for (var i in items) {
    var item = items[i];
    if (item.who == user.id) itemsAsArray.push(decorateItemWithMediaLinks(item));
  }
  res.send({
    items: itemsAsArray,
    links: {
      add: server.router.render('items.add')
    }
  });
  next();
});

server.post({ name: 'items.add', path: '/items' }, function(req, res, next) {
  req.assert('title').notEmpty();
  req.assert('uri').notEmpty();
  var errors = req.validationErrors();
  if (errors) return res.send(422, util.inspect(errors));
  var item = {
    id: ++lastId,
    who: req.user.id,
    title: req.params.title,
    uri: req.params.uri
  };
  items[item.id] = item;
  res.send(201, decorateItemWithMediaLinks(item));
  next();
});

server.del({ name: 'items.delete', path: '/items/:id' }, function(req, res, next) {
  if (!items[req.params.id] || items[req.params.id].who != req.user.id) return res.send(404);
  delete items[req.params.id];
  res.send(200);
  next();
});

server.get({ name: 'items.get', path: '/items/:id' }, function(req, res, next) {
  if (!items[req.params.id] || items[req.params.id].who != req.user.id) return res.send(404);
  var item = items[req.params.id];
  res.send(200, decorateItemWithMediaLinks(item));
  next();
});

server.listen(process.env.PORT || 3020, function() {
  console.log('%s listening at %s', server.name, server.url);
});
