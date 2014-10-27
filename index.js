var util = require('util'),
    restify = require('restify'),
    passport = require('passport'),
    OAuth2 = require('oauth').OAuth2,
    BearerStrategy = require('passport-http-bearer').Strategy,
    restifyValidator = require('restify-validator'),
    request = require('request');

var clientId = '9d269857-1f26-4e5e-acf4-2f49d5f826d1';
var clientSecret = 'AONhdiI0UUPNW97NdPVJnxu9C5-QcXvPRaEKRWh1ljL0uQlkBAxxiiAxFDgodqHq68K2-VwMwOjM0j-vMGLN7Og';
var baseSite = 'http://localhost:8080/my-openid-connect-server';
var authorizePath = '/authorize';
var accessTokenPath = '/token';
var oauth2 = new OAuth2(clientId, clientSecret, baseSite, authorizePath, accessTokenPath);

passport.use(new BearerStrategy({
}, function(token, done) {
  console.log('token', token);
  function isUnauthorized(err) {
    return err && err.data && JSON.parse(err.data).error === 'invalid_grant';
  }
  oauth2.get(baseSite + '/userinfo', token, function(err, data, res) {
    if (isUnauthorized(err)) return done(null, false);
    if (err) return done(err);
    var userinfo = JSON.parse(data);
    console.log('userinfo', userinfo);
    done(null, userinfo.sub);
  });
}));

restify.CORS.ALLOW_HEADERS.push('authorization');

var server = restify.createServer();
server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.bodyParser());
server.use(restifyValidator);
if (!process.env.SKIP_AUTH) {
  server.use(passport.initialize());
  server.use(passport.authenticate('bearer', { session: false })); // ensures all routes are protected
}

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

server.get({ name: 'items', path: '/items' }, function(req, res, next) {
  var user = req.user;
  console.log('user', user);
  var itemsAsArray = [];
  for (var i in items) {
    var item = items[i];
    if (item.who == user) itemsAsArray.push(decorateItemWithMediaLinks(item));
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
    who: req.user,
    title: req.params.title,
    uri: req.params.uri
  };
  items[item.id] = item;
  res.send(201, decorateItemWithMediaLinks(item));
  next();
});

server.del({ name: 'items.delete', path: '/items/:id' }, function(req, res, next) {
  if (!items[req.params.id] || items[req.params.id].who != req.user) return res.send(404);
  delete items[req.params.id];
  res.send(200);
  next();
});

server.get({ name: 'items.get', path: '/items/:id' }, function(req, res, next) {
  if (!items[req.params.id] || items[req.params.id].who != req.user) return res.send(404);
  var item = items[req.params.id];
  res.send(200, decorateItemWithMediaLinks(item));
  next();
});

server.listen(process.env.PORT || 3020, function() {
  console.log('%s listening at %s', server.name, server.url);
});
