"use strict";

var assert = require("assert");

var cl = require("./clause");

// class
function Formula() {
    this.clauses = [];
}

Formula.prototype.toString = function () {
    return this.clauses.join("\n");
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

Formula.prototype.declare = function (name, type) {
    if (cl.isNode(name)) {
        name = cl.nodeToCl(name);
    }
    if (typeof type === "undefined") {
        type = "String";
    }
    this.pushClause(cl.decl(name, type));
};

Formula.prototype.assign = function (left, right) {
    if (cl.isNode(left)) {
        left = cl.nodeToCl(left);
    }
    if (cl.isNode(right)) {
        right = cl.nodeToCl(right);
    }
    this.assert(cl.eq(left, right));
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
