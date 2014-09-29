'use strict';

var through = require('through2');
var Transform = require('./lib/transform');


module.exports = function sse(options) {
    var stream, buffer;

    options = options || {};
    if (!options.hasOwnProperty('decodeStrings')) {
        options.decodeStrings = false;
    }

    if (options.objectMode) {
        stream = through(options, function (chunk, enc, next) {
            chunk = Transform.transform(chunk);
            stream.push(new Buffer(chunk));
            next();
        });
        return stream;
    }

    buffer = new Buffer(0);
    stream = through(options, function(chunk, enc, next) {
        var i, offset, data, parsed;

        // Force utf8 string encoding
        if (enc === 'buffer') {
            chunk = chunk.toString('utf8');
        }

        chunk = buffer + chunk;
        offset = 0;

        for (i = 0; i < chunk.length - 1; i++) {
            // `\r\n`
            if (chunk.charCodeAt(i) === 13 && chunk.charCodeAt(i + 1) === 10) {

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

        buffer = chunk.slice(offset);
        next();
    });

    return stream;
};
