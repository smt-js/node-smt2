/* eslint-env jasmine */

"use strict";

var esprima = require("esprima");

var smt2 = require("../index.js");

// helpers
function parseStatement(code) {
    return esprima.parse(code).body[0];
}

function join(lines) {
    return lines.join("\n");
}

// tests
describe("formula", function () {
    it("should exist", function () {
        expect(smt2.formula).toBeDefined();
    });

    describe("Formula", function () {
        it("should exist", function () {
            expect(smt2.formula.Formula).toBeDefined();
        });

        it("should be instantiable", function () {
            var f = new smt2.formula.Formula();

            expect(f).not.toBe(null);
        });

        it("should have all methods", function () {
            var f = new smt2.formula.Formula();

            expect(f.toString).toBeDefined();
            expect(f.pushClause).toBeDefined();
            expect(f.popClause).toBeDefined();
            expect(f.assert).toBeDefined();
            expect(f.unassert).toBeDefined();
            expect(f.declare).toBeDefined();
            expect(f.solve).toBeDefined();
            expect(f.unsolve).toBeDefined();
            expect(f.enterScope).toBeDefined();
            expect(f.exitScope).toBeDefined();
        });

        describe("method", function () {

            // formula
            var f = null;

            beforeEach(function () {
                f = new smt2.formula.Formula();
            });

            afterEach(function () {
                f = null;
            });

            // NOTE:
            //      due to this being the only method that can inspect the
            //      formula, it is implicitly tested in other tests
            describe("toString", function () {
                it("should work for an empty formula", function () {
                    expect(f.toString()).toBe("");
                });
            });

            describe("pushClause", function () {
                it("should add a string", function () {
                    f.pushClause("lol");
                    expect(f.toString()).toBe("lol");
                });

                it("should add several strings", function () {
                    f.pushClause("lol");
                    f.pushClause("rofl");
                    expect(f.toString()).toBe("lol\nrofl");
                });
            });

            describe("declare", function () {
                it("should support declaration", function () {
                    var declarator = parseStatement("var rofl;").declarations[0];

                    f.declare("lol");
                    f.declare(declarator.id, declarator.init);

                    expect(f.toString()).toBe(join([
                        "(declare-variable lol String)",
                        "(declare-variable rofl String)"
                    ]));
                });

                it("should support redeclaration", function () {

                    pending("no SSA yet");

                    f.declare("lol");
                    f.declare("lol");
                    f.declare("lol");

                    expect(f.toString()).toBe(join([
                        "(declare-variable lol1 String)",
                        "(declare-variable lol2 String)",
                        "(declare-variable lol3 String)"
                    ]));
                });

                it("should support definition from literal", function () {
                    var declaratorFoo = parseStatement("var foo = \"bar\";").declarations[0];
                    var declaratorBaz = parseStatement("var baz = 10;").declarations[0];

                    f.declare("lol", "rofl");
                    f.declare("cat", "3");
                    f.declare("N", 3);
                    f.declare(declaratorFoo.id, declaratorFoo.init);
                    f.declare(declaratorBaz.id, declaratorBaz.init);
                    f.declare("doge", declaratorBaz.init);

                    expect(f.toString()).toBe(join([
                        "(declare-variable lol String)",
                        "(assert (= lol \"rofl\"))",
                        "(declare-variable cat String)",
                        "(assert (= cat \"3\"))",
                        "(declare-variable N Int)",
                        "(assert (= N 3))",
                        "(declare-variable foo String)",
                        "(assert (= foo \"bar\"))",
                        "(declare-variable baz Int)",
                        "(assert (= baz 10))",
                        "(declare-variable doge Int)",
                        "(assert (= doge 10))"
                    ]));
                });

                it("should support definition from expression", function () {
                    var declaration = parseStatement("var lol = \"a\" + \"b\"");
                    var declarator  = declaration.declarations[0];
                    var identifier  = declarator.id;
                    var expression  = declarator.init;

                    var intDeclaration = parseStatement("var lmao = 2 + 4");
                    var intDeclarator  = intDeclaration.declarations[0];
                    var intIdentifier  = intDeclarator.id;
                    var intExpression  = intDeclarator.init;

                    f.declare("rofl", expression);
                    f.declare(identifier, expression);
                    f.declare(intIdentifier, intExpression);

                    expect(f.toString()).toBe(join([
                        "(declare-variable rofl String)",
                        "(assert (= rofl (Concat \"a\" \"b\")))",
                        "(declare-variable lol String)",
                        "(assert (= lol (Concat \"a\" \"b\")))",
                        "(declare-variable lmao Int)",
                        "(assert (= lmao (+ 2 4)))"
                    ]));
                });
            });
        }); // methods
    }); // class
}); // module
