import assert from "assert";

/**
 * The scope contains information about a variable scope in JavaScript.
 */
export class Scope {

	/**
	 * Creates a new scope with the given parent scope.
	 * @param {Scope?} parent the parent scope
     */
	constructor(parent) {
		this.parent = parent;
		this._children = [];
		this._symbols = new Map();
	}

	/**
	 * Adds the given symbol to this scope
	 * @param {Symbol} symbol the symbol to add
     */
	addSymbol(symbol) {
		assert(symbol, "symbol cannot be undefined");
		assert(!this._symbols.has(symbol.name), `Another symbol with the name ${symbol.name} already exists`);

		this._symbols.set(symbol.name, symbol);
	}

	/**
	 * Replaces the symbol thiz with that
	 * @param {Symbol} thiz the symbol to replace
	 * @param {Symbol} that the symbol that replaces the thiz symbol
     */
	replaceSymbol(thiz, that) {
		assert(that, "that cannot be undefined", "!!");
		assert(this._symbols.has(thiz.name), "Can only replaces symbol contained in this scope", "symbols.has(thiz.name)");
		assert(thiz.name === that.name, "The name of the symbols need to be equal", "===");

		this._symbols.set(that.name, that);
	}

	/**
	 * Tests if this scope contains a symbol with the given name.
	 * @param {string} name the name of the symbol
	 * @returns {boolean} true if this scope contains a symbol with the given name
     */
	hasOwnSymbol(name) {
		return this._symbols.has(name);
	}

	/**
	 * Tests if this or any parent scope contains a symbol with the given name
	 * @param {string} name the name of the symbol
	 * @returns {boolean} true if the scope or any parent scope contains a symbol with the given name
     */
	hasSymbol(name) {
		return this._symbols.has(name) || !!this.parent && this.parent.hasSymbol(name);
	}

	/**
	 * Returns all symbols defined in this scope
	 * @returns {Iterator.<Scope>}
     */
	get symbols() {
		return this._symbols.values();
	}

	/**
	 * Returns all symbols available in this scope. This includes all the symbols of this and all parent scopes.
	 * @returns {Iterator.<Scope>} an iterator over all symbols
	 */
	* getAllSymbols() {
		let currentScope = this;
		while (currentScope) {
			for (const symbol of currentScope.symbols) {
				yield symbol;
			}

			currentScope = currentScope.parent;
		}
	}

	/**
	 * Indicator if this is the global scope
	 * @returns {boolean} true if it is the global scope
     */
	get isGlobal() {
		return !this.parent;
	}

	/**
	 * Gets the symbol with the defined name from the current scope without resolving it from a parent if it is not
	 * defined in this scope
	 * @param {String} name the name of the symbol
	 * @returns the symbol or undefined if it does not exist
     */
	getOwnSymbol(name) {
		return this._symbols.get(name);
	}

	/**
	 * Resolves the symbol with the given name in this scope. The resolve algorithm searches for the symbol in this and in
	 * all parent scopes
	 * @param {string} name the name of the symbol to find
	 * @returns {Symbol} the found symbol with the given name or null if no symbol with the given name exists.
     */
	resolveSymbol(name) {
		const symbol = this.getOwnSymbol(name);
		if (!symbol && this.parent) {
			return this.parent.resolveSymbol(name);
		}

		return symbol;
	}

	/**
	 * Creates a new scope that is a child scope of this scope
	 * @returns {Scope} the created scope
     */
	createChild() {
		const child = new Scope(this);
		this._children.push(child);
		return child;
	}

	/**
	 * Dumps the scope with all it's child scopes to the output stream
	 * @param {WriteStream} stream writeable stream that is used as target
	 * @param {string} [intend=''] intention to use for this scope
     */
	dump(stream, intend="") {
		stream.write(intend + "--\n");
		for (const symbol of this.symbols) {
			stream.write(intend + symbol + "\n");
		}

		const childIntend = intend + "-|\t";
		for (const child of this._children) {
			child.dump(stream, childIntend);
		}
	}
}

export default Scope;

