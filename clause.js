"use strict";

var assert = require("assert");

// helpers
function unsupported(message) {
    return "unsupported " + message;
}

function unsupportedNodeType(message, type) {
    return unsupported(message + " node of type " + type);
}

function unsupportedValueType(message, type) {
    return unsupported(message + " value of type " + type);
}

function isNode(node) {
    return typeof node.type !== "undefined";
}

function cl(name) {
    var internals     = name;
    var argsAfterName = Array.prototype.slice.call(arguments, 1);

    if (argsAfterName.length > 0) {
        internals += " " + argsAfterName.join(" ");
    }

    return "(" + internals + ")";
}

// public API
function decl(name, type) {
    return cl("declare-variable", name, type);
}

function assertClause(a) {
    return cl("assert", a);
}

// string functions
function cat(a, b) {
    return cl("Concat", a, b);
}

function contains(a, b) {
    return cl("Contains", a, b);
}

function len(a) {
    return cl("Length", a);
}

function regex(a) {
    return cl("Str2Reg", a);
}

// functions
function ite(test, yes, no) {
    return cl("ite", test, yes, no);
}

// commands
function getModel() {
    return cl("get-model");
}

function checkSat() {
    return cl("check-sat");
}

function push() {
    return cl("push");
}

function pop() {
    return cl("pop");
}

// binary operations
function binary(op, a, b) {
    return cl(op, a, b);
}

function eq(a, b) {
    return binary("=", a, b);
}

function or(a, b) {
    return binary("or", a, b);
}

function and(a, b) {
    return binary("and", a, b);
}

// unary operations
function not(a) {
    return cl("not", a);
}

function sortof(a) {
    return cl(a, "Type");
}

// nodes
function id(a) {
    return a;
}

function literal(value) {
    if (value === null) {
        return null;
    }
    if (value instanceof RegExp) {
        return regex(value);
    }
    switch (typeof value) {
        case "number": {
            return value;
        }
        case "string": {
            return "\"" + value + "\"";
        }
        default: {
            throw Error(unsupportedValueType("creating literals from", typeof value));
        }
    }
}

// recursive conversion
function nodeToCl(node) {

    // sanity check: naively checking that a node was passed
    assert(isNode(node), "nodeToCl should be passed a node");

    switch (node.type) {
        case "Literal": {
            return literal(node.value);
        }

        // case "Pattern":
        case "Identifier": {
            return id(node.name);
        }
        case "ConditionalExpression": {
            return ite(nodeToCl(node.test), nodeToCl(node.alternate), nodeToCl(node.consequent));
        }
        case "LogicalExpression": {
            switch (node.operator) {
                case "||": {
                    return or(nodeToCl(node.left), nodeToCl(node.right));
                }
                case "&&": {
                    return and(nodeToCl(node.left), nodeToCl(node.right));
                }
                default: {
                    throw Error(unsupported("SMT2 logical expressions with operator " + node.operator));
                }
            }

            // eslint-disable-next-line no-unreachable
            break;
        }
        case "UnaryExpression": {
            if (node.prefix) {
                switch (node.operator) {
                    case "typeof": {
                        return sortof(nodeToCl(node.argument));
                    }
                    case "!": {
                        return not(nodeToCl(node.argument));
                    }
                    default: {
                        throw Error(unsupported("SMT2 unary expressions with operator " + node.operator));
                    }
                }
            } else {
                throw Error(unsupported("SMT2 non-prefix unary expressions"));
            }

            // eslint-disable-next-line no-unreachable
            break;
        }
        case "BinaryExpression": {
            switch (node.operator) {
                case "<":
                case ">":
                case "-":
                case "*":
                case "/": {
                    return binary(node.operator, nodeToCl(node.left), nodeToCl(node.right));
                }
                case "+": {
                    return cat(nodeToCl(node.left), nodeToCl(node.right));
                }
                case "==":
                case "===": {
                    return eq(nodeToCl(node.left), nodeToCl(node.right));
                }
                case "!==": {
                    return not(eq(nodeToCl(node.left), nodeToCl(node.right)));
                }
                default: {
                    throw Error(unsupported("SMT2 binary expressions with operator " + node.operator));
                }
            }

            // eslint-disable-next-line no-unreachable
            break;
        }

        // unhandled cases
        case "ArrayExpression": {
            return literal("__ARRAY__");
        }
        case "ObjectExpression": {
            return literal("__OBJECT__");
        }
        case "FunctionExpression": {
            return literal("__FUNCTION__");
        }
        case "MemberExpression": {
            if (!node.computed) {
                if (node.property.type === "Identifier" && node.property.name === "length") {
                    return len(node.object.name);
                }
            }
            return literal("__MEMBER_ACCESS__");
        }
        case "CallExpression": {
            if (node.callee.name === "require") {
                return literal("__LIBRARY__");
            }
            return literal("__FUNCTION_CALL__");
        }
        default: {
            throw Error(unsupportedNodeType("generating SMT2 from", node.type));
        }
    }
}

module.exports = {
    isNode:   isNode,
    contains: contains,
    assert:   assertClause,
    literal:  literal,
    push:     push,
    pop:      pop,
    id:       id,
    cat:      cat,
    decl:     decl,
    eq:       eq,
    len:      len,
    not:      not,
    getModel: getModel,
    checkSat: checkSat,
    nodeToCl: nodeToCl
};
