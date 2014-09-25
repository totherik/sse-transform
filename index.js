'use strict';

var through = require('through2');
var Transform = require('./lib/transform');


module.exports = function sse(options) {
    var stream, buffer;

    options = options || {};

    if (options.objectMode) {
        return stream = through(options, function (chunk, enc, next) {
            chunk = Transform.transform(chunk);
            stream.push(new Buffer(chunk));
            next();
        });
    }


    buffer = new Buffer(0);
    stream = through(options, function(chunk, enc, next) {
        var i, offset, data, parsed;

        chunk = Buffer.concat([buffer, chunk]);
        offset = 0;

        for (i = 0; i < chunk.length; i++) {
            // `\r\n`
            if (chunk[i] === 13 && chunk[i + 1] === 10) {

                data = chunk.slice(offset, i);
                parsed = Transform.parse(data);

                if (parsed.error) {
                    stream.emit('error', parsed.error);
                } else if (parsed.data) {
                    data = Transform.transform(parsed.data);
                    stream.push(new Buffer(data));
                }

                i += 2;
                offset = i;

            }
        }

        if (offset <= chunk.length) {
            buffer = chunk.slice(offset);
        }

        next();
    });

    return stream;
};