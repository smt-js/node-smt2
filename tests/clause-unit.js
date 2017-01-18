/* eslint-env jasmine */

"use strict";

var esprima = require("esprima");

var smt2 = require("../index.js");

// helpers
function parseCode(code) {
    return esprima.parse(code).body[0];
}

// tests
describe("clause", function () {
    it("should exist", function () {
        expect(smt2.clause).toBeDefined();
    });

    it("should be aliased to 'cl'", function () {
        expect(smt2.cl).toBeDefined();
        expect(smt2.cl).toBe(smt2.clause);
    });

    it("should have all methods", function () {
        var cl = smt2.clause;

        expect(cl.isNode).toBeDefined();
        expect(cl.contains).toBeDefined();
        expect(cl.assert).toBeDefined();
        expect(cl.literal).toBeDefined();
        expect(cl.push).toBeDefined();
        expect(cl.pop).toBeDefined();
        expect(cl.id).toBeDefined();
        expect(cl.cat).toBeDefined();
        expect(cl.decl).toBeDefined();
        expect(cl.eq).toBeDefined();
        expect(cl.len).toBeDefined();
        expect(cl.not).toBeDefined();
        expect(cl.getModel).toBeDefined();
        expect(cl.checkSat).toBeDefined();
        expect(cl.nodeToSort).toBeDefined();
        expect(cl.typeToSort).toBeDefined();
        expect(cl.nodeToCl).toBeDefined();
    });

    describe("function", function () {
        var cl = smt2.clause;

        describe("isNode", function () {
            it("should return false for non-nodes", function () {
                expect(cl.isNode(false)).toBe(false);
                expect(cl.isNode(true)).toBe(false);
                expect(cl.isNode("a")).toBe(false);
                expect(cl.isNode(3)).toBe(false);
                expect(cl.isNode(null)).toBe(false);
                expect(cl.isNode(NaN)).toBe(false);
            });

            it("should return true for nodes", function () {
                var declaration = parseCode("var n = 3 + 2;");
                var declarator  = declaration.declarations[0];
                var identifier  = declarator.id;
                var expression  = declarator.init;
                var left        = expression.left;
                var right       = expression.right;

                expect(cl.isNode(declaration)).toBe(true);
                expect(cl.isNode(declarator)).toBe(true);
                expect(cl.isNode(identifier)).toBe(true);
                expect(cl.isNode(expression)).toBe(true);
                expect(cl.isNode(left)).toBe(true);
                expect(cl.isNode(right)).toBe(true);
            });
        });

        describe("contains", function () {

        });

        describe("assert", function () {

        });

        describe("literal", function () {

        });

        describe("push", function () {

        });

        describe("pop", function () {

        });

        describe("id", function () {

        });

        describe("cat", function () {

        });

        describe("decl", function () {

        });

        describe("eq", function () {

        });

        describe("len", function () {

        });

        describe("not", function () {

        });

        describe("getModel", function () {

        });

        describe("checkSat", function () {

        });

        describe("nodeToSort", function () {
            it("should convert literals", function () {
                var stringLiteral = parseCode("\"lol\"").expression;
                var numberLiteral = parseCode("3").expression;

                expect(cl.nodeToSort(stringLiteral)).toBe(smt2.sorts.STRING);
                expect(cl.nodeToSort(numberLiteral)).toBe(smt2.sorts.NUMBER);
            });

            it("should convert literals", function () {
                var stringLiteral = parseCode("\"lol\"").expression;
                var numberLiteral = parseCode("3").expression;

                expect(cl.nodeToSort(stringLiteral)).toBe(smt2.sorts.STRING);
                expect(cl.nodeToSort(numberLiteral)).toBe(smt2.sorts.NUMBER);
            });
        });

        describe("typeToSort", function () {
            it("should convert types", function () {
                expect(cl.typeToSort(typeof "a")).toBe(smt2.sorts.STRING);
                expect(cl.typeToSort(typeof 3)).toBe(smt2.sorts.NUMBER);
                expect(cl.typeToSort(typeof true)).toBe(smt2.sorts.BOOLEAN);
            });
        });

        describe("nodeToCl", function () {
            it("should throw when given non-nodes", function () {
                expect(function () {
                    cl.nodeToCl(3);
                }).toThrow();
                expect(function () {
                    cl.nodeToCl("a");
                }).toThrow();
            });

            it("should convert literals", function () {
                var stringLiteral = parseCode("\"lol\"").expression;
                var numberLiteral = parseCode("3").expression;

                expect(cl.nodeToCl(stringLiteral)).toBe("\"lol\"");
                expect(cl.nodeToCl(numberLiteral)).toBe(3);
            });

            it("should convert expressions", function () {
                var numbers = parseCode("3 + 5").expression;
                var strings = parseCode("\"a\" + \"b\"").expression;
                var mixed   = parseCode("\"a\" + 3").expression;

                expect(cl.nodeToCl(numbers)).toBe("(+ 3 5)");
                expect(cl.nodeToCl(strings)).toBe("(Concat \"a\" \"b\")");
                expect(cl.nodeToCl(mixed)).toBe("(Concat \"a\" 3)");
            });
        });
    }); // functions
}); // module
