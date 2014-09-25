'use strict';

var SSE_FIELDS = ['id', 'event', 'data', 'retry'];


exports.parse = function parse(str) {
    try {
        return { error: null, data: JSON.parse(str) };
    } catch (err) {
        return { error: err, data: undefined };
    }
};


/**
 * Convert a Javascript object to Server Sent Event
 * @param data - a javascript object containing and ot the fields "event", "data", "id", or "retry"
 */
exports.transform = function transform(data) {
    var result, i, j, field, value;

    result = '';

    // 4 is number of supported fields
    for (i = 0; i < 4; i++) {
        field = SSE_FIELDS[i];

        if (data.hasOwnProperty(field)) {
            value = data[field];

            if (typeof value === 'string') {

                // http://dev.w3.org/html5/eventsource/#parsing-an-event-stream
                value = value.split(/\u000D\u000A|\u000D|\u000A/);
                if (field === 'data') {
                    for (j = 0; j < value.length; j++) {
                        result += field + ':' + value[j] + '\n';
                    }
                } else {
                    result += field + ':' + value[0] + '\n';
                }

            } else {
                // All other fields/values, including primitives are stringified
                result += field + ':' + JSON.stringify(value) + '\n';
            }

        }
    }

    return result && result + '\n';
};