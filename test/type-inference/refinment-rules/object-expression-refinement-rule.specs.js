import {expect} from "chai";
import sinon from "sinon";
import * as t from "babel-types";

import {RefinementContext} from "../../../lib/type-inference/refinment-context";
import {ObjectExpressionRefinementRule} from "../../../lib/type-inference/refinement-rules/object-expression-refinement-rule";
import {NumberType, StringType, RecordType} from "../../../lib/semantic-model/types";
import {Symbol, SymbolFlags} from "../../../lib/semantic-model/symbol";

describe("ObjectExpressRefinementRule", function () {
	let rule, context, objectExpression, sandbox;

	beforeEach(function () {
		sandbox = sinon.sandbox.create();
		context = new RefinementContext();
		sandbox.stub(context, "infer");
		sandbox.stub(context, "getSymbol");

		rule = new ObjectExpressionRefinementRule();
		objectExpression = t.objectExpression([
			t.objectProperty(t.identifier("name"), t.stringLiteral("Micha")),
			t.objectProperty(t.identifier("age"), t.numericLiteral(26))
		]);
	});

	afterEach(function () {
		sandbox.restore();
	});

	describe("canRefine", function () {
		it("returns true for an object expression", function () {
			expect(rule.canRefine(objectExpression)).to.be.true;
		});

		it("returns false otherwise", function () {
			expect(rule.canRefine(t.numericLiteral(4))).to.be.false;
		});
	});

	describe("refine", function () {
		const name = new Symbol("name", SymbolFlags.Property);
		const age = new Symbol("age", SymbolFlags.Property);

		beforeEach(function () {
			context.infer.withArgs(objectExpression.properties[0].value).returns(new StringType());
			context.infer.withArgs(objectExpression.properties[1].value).returns(new NumberType());
			context.getSymbol.withArgs(objectExpression.properties[0]).returns(name);
			context.getSymbol.withArgs(objectExpression.properties[1]).returns(age);
		});

		it("returns a record type", function () {
			// act
			const refined = rule.refine(objectExpression, context);

			// assert
			expect(refined).to.be.instanceOf(RecordType);
		});

		it("adds a property for each property defined in the object expression", function () {
			// act
			const refined = rule.refine(objectExpression, context);

			// assert
			expect(refined.hasProperty(name)).to.be.true;
			expect(refined.hasProperty(age)).to.be.true;
		});

		it("resolves the types for the properties using context.infer", function () {
			// act
			const refined = rule.refine(objectExpression, context);

			// assert
			expect(refined.getType(name)).to.be.instanceOf(StringType);
			expect(refined.getType(age)).to.be.instanceOf(NumberType);
		});
	});
});