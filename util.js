"use strict";

// public API
function contains(array, object) {
    return array.indexOf(object) !== (-1);
}

function objContains(object, property) {
    return object.hasOwnProperty(property);
}

module.exports = {
    contains:    contains,
    objContains: objContains
};
