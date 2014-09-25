'use strict';

var test = require('tape');
var through = require('through2');
var sse = require('../index');


function transform(options, messages, callback) {
    var idx, src;

    idx = 0;

    src = sse(options);

    src.on('error', function () {
        // Just prevent throw.
    });

    src.on('end', function () {
        callback(null);
    });

    src.pipe(through(function (chunk, encoding, done) {
        callback(chunk.toString('utf8'), idx);
        idx += 1;
        done();
    }));

    messages.forEach(function (message) {
        src.write(message);
    });

    src.end();
}


test('valid fields', function (t) {
    var src = {
        event: 'test',
        id: 123,
        data: 'foo',
        retry: 10000,
        invalid: 'invalid'
    };

    transform({ objectMode: true }, [ src ], function (result) {
        if (result === null) {
            t.end();
            return;
        }

        t.ok(result);
        t.ok(result.match(/event\:test\n/));
        t.ok(result.match(/id\:123\n/));
        t.ok(result.match(/data\:foo\n/));
        t.ok(result.match(/retry\:10000\n/));
        t.ok(result.match(/\n\n$/));

        t.notOk(result.match(/invalid:invalid\n/));
    });
});


test('object mode', function (t) {
    var src = {
        data: 'foo'
    };

    transform({ objectMode: true }, [ src ], function (result) {
        if (result === null) {
            t.end();
            return;
        }

        t.ok(result);
        t.equal(result.toString('utf8'), 'data:foo\n\n');
    });
});


test('string mode', function (t) {
    var src = JSON.stringify({ data: 'foo' }) + '\r\n';

    transform({}, [ src ], function (result) {
        if (result === null) {
            t.end();
            return;
        }

        t.ok(result);
        t.equal(result.toString('utf8'), 'data:foo\n\n');
    });
});


test('newline', function (t) {
    var src = JSON.stringify({ data: 'foo\nbar' }) + '\r\n';

    transform({}, [ src ], function (result) {
        if (result === null) {
            t.end();
            return;
        }

        t.ok(result);
        t.ok(result.match(/data\:foo\n/));
        t.ok(result.match(/data\:bar\n/));
        t.ok(result.match(/\n\n$/));
    });
});


test('JSON object mode newline', function (t) {
    var src = { data: { foo: "bar\nbaz" } };

    transform({ objectMode: true }, [ src ], function (result) {
        if (result === null) {
            t.end();
            return;
        }

        t.ok(result);
        t.ok(result.match(/data\:{"foo":"bar\\nbaz"}\n/));
        t.ok(result.match(/\n\n$/));
    });
});


test('JSON string mode newline', function (t) {
    var src = JSON.stringify({ data: { foo: "bar\nbaz" } }) + '\r\n';

    transform({}, [ src ], function (result) {
        if (result === null) {
            t.end();
            return;
        }

        t.ok(result);
        t.ok(result.match(/data\:{"foo":"bar\\nbaz"}\n/));
        t.ok(result.match(/\n\n$/));
    });
});


test('Invalid JSON', function (t) {
    var src = '{"data":{}}\r\n{"data":{\r\n{"data":"foo"}\r\n';

    t.plan(6);

    transform({}, [ src ], function (result, idx) {
        if (result === null) {
            t.end();
            return;
        }

        t.ok(result);
        t.ok(result.match(/\n\n$/));

        // NOTE: Even though there are 3 items, only 2 chunks arrive
        // since the second is intentionally malformed.
        switch (idx) {
            case 0:
                t.ok(result.match(/data\:{}\n/));
                break;

            case 1:
                t.ok(result.match(/data\:foo\n/));
                break;

            default:
                t.notOk(true);
        }
    });
});


test('consecutive crlf', function (t) {
    var src = '{"data":{}}\r\n\r\n{"data":"foo"}\r\n';

    transform({}, [ src ], function (result, idx) {
        if (result === null) {
            t.end();
            return;
        }

        t.ok(result);

        // NOTE: Even though there are 3 items, only 2 chunks arrive
        // since the second is intentionally empty.
        switch (idx) {
            case 0:
                t.ok(result.match(/data\:{}\n/));
                break;

            case 1:
                t.ok(result.match(/data\:foo\n/));
                break;

            default:
                t.notOk(true);
        }
    });

});


test('null and undefined', function (t) {
    var src = { data: undefined, event: null };

    transform({ objectMode: true }, [ src ], function (result) {
        if (result === null) {
            t.end();
            return;
        }

        t.ok(result);
        t.ok(result.match(/data\:undefined\n/));
        t.ok(result.match(/event\:null\n/));
        t.ok(result.match(/\n\n$/));
    });
});


test('non-data newlines', function (t) {
    var src = { event: 'foo\nbar', data: 'baz\nbam', id: 123 };

    transform({ objectMode: true }, [ src ], function (result) {
        if (result === null) {
            t.end();
            return;
        }

        t.ok(result);
        t.ok(result.match(/event\:foo\n/));
        t.ok(result.match(/id\:123\n/));
        t.ok(result.match(/data\:baz\n/));
        t.ok(result.match(/data\:bam\n/));
        t.ok(result.match(/\n\n$/));
    })
});