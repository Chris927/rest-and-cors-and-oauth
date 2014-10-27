# What?

This is an experimental REST service, providing CRUD for items, whereas an item
has a title and a URI.

Please *read the code* if in doubt about anything, it's all in [index.js](./index.js).

# How to Run?

```
node index.js
```

... will start the service, listening on port 3020.

By default, authentication is required against an external oauth provider. In
order to skip authentication, set an environment variable:

```
SKIP_AUTH=true
```

# How to Use?

Using curl, the following commands can be used to

- create an item

```
curl -d 'title=bla\&uri=http://test.com' http://localhost:3020/items
```

- query all items

```
curl http://localhost:3020/items
```

- update title of item 42

```
curl -X POST -d 'title=Changed%20Title' http://localhost:3020/items/42
```

- delete item with id 42

```
curl -X DELETE http://localhost:3020/items/42
```

