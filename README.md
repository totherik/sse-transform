sse-stream
===========

A transform stream ot converting JavaScript objects or JSON streams into
[Server-Sent Events](https://developer.mozilla.org/en-US/docs/Server-sent_events).

#### Basic Usage

``javascript
'use strict';

var sse = require('../');
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

Outputs
```bash
data:foo


data:abc
id:123


event:myevent
data:foo
data:bar


event:myevent2
data:moo
data:mar


```


#### Modes
##### Object
When value is string, split on newline and emit multiple `data:` entries.
When value is not-string, JSON.stringify value.


##### Non-Object
Objects are delimited by CrLf (`\r\n`) and parsed as JSON. Once parsed, resulting value
is transformed using Object Mode.
