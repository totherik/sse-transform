sse-stream
===========

A transform stream for converting JavaScript objects or JSON streams into
[Server-Sent Events](https://developer.mozilla.org/en-US/docs/Server-sent_events).
Only known [fields](https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events#Fields)
are processed and all other fields are ignored.

#### Default Mode
In default mode JSON objects are delimited using CrLf (`\r\n`). Each encountered
JSON object is parsed and transformed into SSE format. If a JSON object isn't able
to be parsed an error event is emitted on the stream and no transform is performed.

##### Basic Usage
```javascript
'use strict';

var sse = require('sse-stream');
var through = require('through2');


var xform = sse();

xform.pipe(through(function (chunk, encoding, done) {
    console.log(chunk.toString('utf8'));
    done();
}));

xform.write('{"data":"foo"}\r\n');
xform.write('{"id":123,"data":"abc"}\r\n');
xform.write('{"event":"myevent","data":"foo\\nbar"}\r\n');
xform.write('{"event":"myevent2","data":"moo\\nmar"}\r\n');
xform.end();
```

##### Output
```bash
data:foo


id:123
data:abc


event:myevent
data:foo
data:bar


event:myevent2
data:moo
data:mar


```

#### Object Mode
In object mode each field processed such that if it is a string, newline delimiting rules
are applied and each newline results in a new field entry (see `data` fields below). If a
non-string-literal is encountered, the value is JSON.stringified during transform.

##### Basic Usage
```javascript
'use strict';

var sse = require('./');
var through = require('through2');


var xform = sse({ objectMode: true });

xform.pipe(through(function (chunk, encoding, done) {
    console.log(chunk.toString('utf8'));
    done();
}));

xform.write({ data: 'foo'});
xform.write({ id:123, data: 'abc' });
xform.write({ event: 'myevent', data: 'foo\nbar' });
xform.write({ event: 'myevent2', data: 'moo\nmar' });
xform.write({ event: 'myevent', data: { foo: true, bar: 123, baz: 'foo\nbar' }});
xform.end();
```

##### Output
```bash
data:foo


id:123
data:abc


event:myevent
data:foo
data:bar


event:myevent2
data:moo
data:mar


event:myevent
data:{"foo":true,"bar":123,"baz":"foo\nbar"}


```