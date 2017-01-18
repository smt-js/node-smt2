"use strict";

var assert = require("assert");

var smt2sorts = require("./sorts");

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

function unsupportedSortInference(message) {
    return unsupported("determining SMT2 sorts from" + message);
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
function isNode(node) {
    if (node === null) {
        return false;
    }

    if (!node.hasOwnProperty("type")) {
        return false;
    }

    return true;
}

function typeToSort(type) {
    switch (type) {
        case "string": {
            return smt2sorts.STRING;
        }
        case "number": {
            return smt2sorts.NUMBER;
        }
        case "boolean": {
            return smt2sorts.BOOLEAN;
        }
        default: {
            throw Error(unsupported("creating SMT2 sorts from JS type " + type));
        }
    }
}

function decl(name, sort) {
    return cl("declare-variable", name, sort);
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

function add(a, b) {
    return binary("+", a, b);
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
        case "boolean":
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

function nodeToSort(node, sorts) {

    // sanity check: naively checking that a node was passed
    assert(isNode(node), "nodeToSort should be passed a node");

    switch (node.type) {

        // convert literals' JS types to SMT2 sorts
        case "Literal": {
            return typeToSort(typeof node.value);
        }

        // use existing sort data to get sorts of identifiers
        case "Identifier": {
            if (typeof sorts[node.name] === "undefined") {
                throw Error(unsupportedSortInference("undefined variables"));
            }

            return sorts[node.name];
        }
        case "ConditionalExpression": {
            return smt2sorts.BOOLEAN;
        }
        case "LogicalExpression": {
            switch (node.operator) {
                case "||":
                case "&&":
                default: {
                    throw Error(unsupportedSortInference("logical expressions with operator " + node.operator));
                }
            }

            // eslint-disable-next-line no-unreachable
            break;
        }
        case "UnaryExpression": {
            if (node.prefix) {
                switch (node.operator) {

                    // case "typeof": {
                    //     return undefined;
                    // }
                    case "!": {
                        return smt2sorts.BOOLEAN;
                    }
                    default: {
                        throw Error(unsupportedSortInference("unary expressions with operator " + node.operator));
                    }
                }
            } else {
                throw Error(unsupportedSortInference("non-prefix unary expressions"));
            }

            // eslint-disable-next-line no-unreachable
            break;
        }
        case "BinaryExpression": {
            switch (node.operator) {
                case "<":
                case ">": {
                    return smt2sorts.BOOLEAN;
                }
                case "-":
                case "*":
                case "/": {
                    return smt2sorts.NUMBER;
                }
                case "+": {
                    var leftSort  = nodeToSort(node.left, sorts);
                    var rightSort = nodeToSort(node.right, sorts);

                    // if either side is a string, result will be a string
                    if (leftSort === smt2sorts.STRING || rightSort === smt2sorts.STRING) {
                        return smt2sorts.STRING;
                    }

                    // otherwise, it's a number
                    return smt2sorts.NUMBER;
                }
                case "==":
                case "===":
                case "!==": {
                    return smt2sorts.BOOLEAN;
                }
                default: {
                    throw Error(unsupportedSortInference("binary expressions with operator " + node.operator));
                }
            }

            // eslint-disable-next-line no-unreachable
            break;
        }

        // explicitly unhandled cases
        case "ArrayExpression": {
            return smt2sorts.STRING;
        }
        case "ObjectExpression": {
            return smt2sorts.STRING;
        }
        case "FunctionExpression": {
            return smt2sorts.STRING;
        }
        case "MemberExpression": {
            return smt2sorts.STRING;
        }
        case "CallExpression": {
            return smt2sorts.STRING;
        }
        case "Pattern": {
            return smt2sorts.STRING;
        }
        default: {
            throw Error(unsupportedSortInference("node of type " + node.type));
        }
    }
}

function nodeToCl(node, sorts) {

    // sanity check: naively checking that a node was passed
    assert(isNode(node), "nodeToCl should be passed a node");

    switch (node.type) {
        case "Literal": {
            return literal(node.value);
        }
        case "Identifier": {
            return id(node.name);
        }
        case "ConditionalExpression": {
            return ite(nodeToCl(node.test, sorts), nodeToCl(node.alternate, sorts), nodeToCl(node.consequent, sorts));
        }
        case "LogicalExpression": {
            switch (node.operator) {
                case "||": {
                    return or(nodeToCl(node.left, sorts), nodeToCl(node.right, sorts));
                }
                case "&&": {
                    return and(nodeToCl(node.left, sorts), nodeToCl(node.right, sorts));
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

                    // case "typeof": {
                    //     return undefined;
                    // }
                    case "!": {
                        return not(nodeToCl(node.argument, sorts));
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
                    return binary(node.operator, nodeToCl(node.left, sorts), nodeToCl(node.right, sorts));
                }

                // NOTE:
                //      this case is special because sometimes we add strings
                //      and sometimes we add numbers; strings use "Concat",
                //      and numbers use "+"
                case "+": {
                    var sort = nodeToSort(node, sorts);
                    var binaryFunction;

                    if (sort === smt2sorts.STRING) {
                        binaryFunction = cat;
                    } else {
                        binaryFunction = add;
                    }

                    return binaryFunction(nodeToCl(node.left, sorts), nodeToCl(node.right, sorts));
                }

                case "==":
                case "===": {
                    return eq(nodeToCl(node.left, sorts), nodeToCl(node.right, sorts));
                }
                case "!==": {
                    return not(eq(nodeToCl(node.left, sorts), nodeToCl(node.right, sorts)));
                }
                default: {
                    throw Error(unsupported("SMT2 binary expressions with operator " + node.operator));
                }
            }

            // eslint-disable-next-line no-unreachable
            break;
        }

        // explicitly unhandled cases
        case "Pattern": {
            return literal("__PATTERN__");
        }
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
    isNode:     isNode,
    contains:   contains,
    assert:     assertClause,
    literal:    literal,
    push:       push,
    pop:        pop,
    id:         id,
    cat:        cat,
    decl:       decl,
    eq:         eq,
    len:        len,
    not:        not,
    getModel:   getModel,
    checkSat:   checkSat,
    nodeToSort: nodeToSort,
    typeToSort: typeToSort,
    nodeToCl:   nodeToCl
};
