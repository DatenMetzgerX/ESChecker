import {expect} from "chai";
import * as t from "babel-types";
import sinon from "sinon";

import {ReturnStatementRefinementRule} from "../../../lib/type-inference/refinement-rules/return-statement-refinement-rule";
import {FunctionType, TypeVariable, NumberType, VoidType} from "../../../lib/semantic-model/types";
import {RefinementContext} from "../../../lib/type-inference/refinement-context";
import {SymbolFlags, Symbol} from "../../../lib/semantic-model/symbol";
import {Program} from "../../../lib/semantic-model/program";
import {TypeInferenceContext} from "../../../lib/type-inference/type-inference-context";

describe("ReturnStatementRefinementRule", function () {
	let rule, context, program;

	beforeEach(function () {
		program = new Program();
		context = new RefinementContext(null, new TypeInferenceContext(program));
		sinon.stub(context, "infer");
		sinon.stub(context, "unify");
		rule = new ReturnStatementRefinementRule();
	});

	describe("canRefine", function () {
		it ("returns true for a return statement declaration", function () {
			// arrange
			const returnStatement = t.returnStatement(t.identifier("x"));

			// act, assert
			expect(rule.canRefine(returnStatement)).to.be.true;
		});

		it("returns false in the other cases", function () {
			// arrange
			const identifier = t.identifier("x");

			// act, assert
			expect(rule.canRefine(identifier)).to.be.false;
		});
	});

	describe("refine", function () {
		it("throws if the enclosing function is anonymous", function () {
			// arrange
			const returnStatement = t.returnStatement(t.identifier("x"));
			const arrowFunction = t.arrowFunctionExpression([], t.blockStatement([returnStatement]));

			// act, assert
			expect(() => rule.refine(arrowFunction)).to.throw("Type inference failure: return statements inside of anonymous functions are not yet supported");
		});

		it("sets the return type of the enclosing function to the evaluated type of the return expression", function () {
			// arrange
			const returnStatement = t.returnStatement(t.binaryExpression("*", t.identifier("x"), t.numericLiteral(2)));
			const functionDeclaration = t.functionDeclaration(t.identifier("duplicate"), [], t.blockStatement([returnStatement]));
			returnStatement.parent = functionDeclaration;

			const functionSymbol = new Symbol("duplicate", SymbolFlags.Function);
			program.symbolTable.setSymbol(functionDeclaration.id, functionSymbol);

			const functionType = new FunctionType(null, [], new TypeVariable());
			context.setType(functionSymbol, functionType);

			sinon.spy(context, "replaceType");
			context.infer.withArgs(returnStatement.argument).returns(new NumberType());
			context.unify.returns(new NumberType());

			// act
			rule.refine(returnStatement, context);

			// assert
			sinon.assert.calledWith(context.unify, functionType.returnType, sinon.match.instanceOf(NumberType), returnStatement);
			sinon.assert.calledWith(context.replaceType, functionSymbol);

			expect(context.getType(functionSymbol)).to.have.property("returnType").that.is.an.instanceOf(NumberType);
		});

		it("sets the return type of the enclosing function to VoidType if the return statement has no argument (just return;)", function () {
			// arrange
			const returnStatement = t.returnStatement();
			const functionDeclaration = t.functionDeclaration(t.identifier("duplicate"), [], t.blockStatement([returnStatement]));
			returnStatement.parent = functionDeclaration;

			const functionSymbol = new Symbol("duplicate", SymbolFlags.Function);
			program.symbolTable.setSymbol(functionDeclaration.id, functionSymbol);

			const functionType = new FunctionType(null, [], new TypeVariable());
			context.setType(functionSymbol, functionType);
			context.unify.returns(new VoidType());

			sinon.spy(context, "replaceType");

			// act
			rule.refine(returnStatement, context);

			// assert
			sinon.assert.calledWith(context.unify, functionType.returnType, sinon.match.instanceOf(VoidType), returnStatement);
			sinon.assert.calledWith(context.replaceType, functionSymbol);
			expect(context.getType(functionSymbol)).to.have.property("returnType").that.is.an.instanceOf(VoidType);
		});

		it("the type of a return statement is void", function () {
			// arrange
			const returnStatement = t.returnStatement(t.binaryExpression("*", t.identifier("x"), t.numericLiteral(2)));
			const functionDeclaration = t.functionDeclaration(t.identifier("duplicate"), [], t.blockStatement([returnStatement]));
			returnStatement.parent = functionDeclaration;

			const functionSymbol = new Symbol("duplicate", SymbolFlags.Function);
			program.symbolTable.setSymbol(functionDeclaration.id, functionSymbol);

			const functionType = new FunctionType(null, [], new TypeVariable());
			context.setType(functionSymbol, functionType);

			context.infer.withArgs(returnStatement.argument).returns(new NumberType());
			context.unify.returns(new NumberType());

			// act, assert
			expect(rule.refine(returnStatement, context)).to.be.instanceOf(VoidType);
		});
	});
});