"use strict";

var assert = require("assert");

var cl    = require("./clause");
var sorts = require("./sorts");

var DEFAULT_SORT = sorts.STRING;

// classes
function Formula() {
    this.clauses = [];
    this.sorts   = {};
}

Formula.prototype.toString = function () {
    return this.clauses.join("\n");
};

Formula.prototype.addVariable = function (name, sort) {
    if (!contains(this.sorts, name)) {
        this.sorts[name] = [];
    }
    this.sorts[name].push(sort);
};

Formula.prototype.pushClause = function (newClause) {
    assert(newClause, "newClause should be truthy");
    this.clauses.push(newClause);
};

Formula.prototype.popClause = function (oldClause) {
    var poppedClause = this.clauses.pop();

    // sanity check: if the old clause was passed,
    // check if it was the one that got popped
    if (typeof oldClause !== "undefined") {
        assert(oldClause === poppedClause);
    }
};

Formula.prototype.assert = function (newClause) {
    this.pushClause(cl.assert(newClause));
};

Formula.prototype.unassert = function (oldClause) {
    if (typeof oldClause !== "undefined") {
        oldClause = cl.assert(oldClause);
    }
    this.popClause(oldClause);
};

Formula.prototype.declare = function (left, right) {

    var name;
    var sort = DEFAULT_SORT;
    var value;

    // get variable name
    if (cl.isNode(left)) {

        // the left side must be an identifier if it's a node
        if (left.type !== "Identifier") {
            throw Error("can't declare non-identifier");
        }

        name = left.name;

    // if it's not a node, assume it's an identifier
    } else {
        name = left;
    }

    // get variable sort
    if (typeof right !== "undefined" && right !== null) {
        if (cl.isNode(right)) {
            sort = cl.nodeToSort(right, this.sorts);
        } else {
            sort = cl.typeToSort(typeof right);
        }
    }

    // keep track of this variable and its sort
    this.addVariable(name, sort);

    // declare variable
    this.pushClause(cl.decl(name, sort));

    // assign variable if there is a right side
    if (typeof right !== "undefined" && right !== null) {

        // get variable value
        if (cl.isNode(right)) {
            value = cl.nodeToCl(right, this.sorts);

        // if it's not a node, assume it's a constant
        } else {
            value = cl.literal(right);
        }

        // assign variable
        this.assert(cl.eq(name, value));
    }
};

Formula.prototype.solve = function () {
    this.pushClause(cl.checkSat());
    this.pushClause(cl.getModel());
};

Formula.prototype.unsolve = function () {
    this.popClause(cl.getModel());
    this.popClause(cl.checkSat());
};

Formula.prototype.enterScope = function () {
    this.pushClause(cl.push());
};

Formula.prototype.exitScope = function () {

    // find the location of the last push clause
    var lastPushIndex = this.clauses.lastIndexOf(cl.push());

    // keep only the clauses from before the last push clause
    this.clauses = this.clauses.slice(0, lastPushIndex);
};

// exports
module.exports = {
    Formula: Formula
};
