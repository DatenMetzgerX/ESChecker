import {MaybeType, NullType, AnyType} from "../../semantic-model/types/index";
/**
 * Unification rule that unifies an arbitrary type T with Maybe<T>, which results in the Type Maybe<T>.
 *
 * @implements {BaseTypeUnificationRule}
 */
export class TMaybeUnificationRule {
	canUnify(t1, t2) {
		const {maybe, other} = this._extractMaybeAndOther(t1, t2);

		return !!maybe && !(other instanceof NullType || other instanceof AnyType);
	}

	unify(t1, t2, unificator) {
		const {maybe, other} = this._extractMaybeAndOther(t1, t2);
		if (other.equals(maybe.of)) {
			return maybe;
		}

		const ofType = unificator.unify(other, maybe.of);
		return new MaybeType(ofType);
	}

	_extractMaybeAndOther(t1, t2) {
		const maybe = t1 instanceof MaybeType ? t1 : t2 instanceof MaybeType ? t2 : null;
		return { maybe, other: maybe === t1 ? t2 : t1 };
	}
}

export default TMaybeUnificationRule;