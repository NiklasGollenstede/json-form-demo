(function(global) { 'use strict'; const factory = function IdbKeyValueStore(exports) {

/**
 * A very simple to use key-value store backed by the browsers IndexedDB:
 * ```js
 * const store = new IdbKeyValueStore({ name: 'some-name', });
 * (await store.set('some-key', 'any JSON value'));
 * const thatValue = (await store.get('some-key'));
 * ```
 */
class IdbKeyValueStore {

	/**
	 * Opens the DB. The instance accepts reads and writes immediately.
	 * @param  {string}  .name  Name of the DB to access (or create).
	 */
	constructor({ name, }) {
		this._db = null;
		this._init = getResult(Object.assign(global.indexedDB.open(name, 1), {
			onupgradeneeded({ target: { result: db, }, }) { db.createObjectStore('kv'); },
		})).then(db => { this._db = db; return db; });
	}

	/**
	 * Writes a value to the DB.
	 * @param {string|any}  key    The key to store under. Must be a valid IndexedDB key (at least strings work).
	 * @param {json|any}    value  The value to store. Must be a valid IndexedDB value (at least everything that can be stored as JSON works).
	 */
	async set(key, value) {
		const db = this._db || (await this._init);
		return getResult(db.transaction([ 'kv', ], 'readwrite').objectStore('kv').put(value, key));
	}

	/** Reads and returns a clone of the value saved for `key`. */
	async get(key) {
		const db = this._db || (await this._init);
		return getResult(db.transaction([ 'kv', ], 'readonly').objectStore('kv').get(key));
	}

	/** Removes the value saved for `key`. */
	async delete(key) {
		const db = this._db || (await this._init);
		return getResult(db.transaction([ 'kv', ], 'readwrite').objectStore('kv').delete(key));
	}
}

function getResult(request) { return new Promise((resolve, reject) => {
	request.onsuccess = ({ target: { result, }, }) => resolve(result);
	request.onerror = error => {
		reject(error); request.abort && request.abort();
		error.stopPropagation && error.stopPropagation();
	};
}); }

return IdbKeyValueStore;

}; if (typeof define === 'function' && define.amd) { define([ 'exports', ], factory); } else { const exp = { }, result = factory(exp) || exp; if (typeof exports === 'object' && typeof module === 'object') { module.exports = result; } else { global[factory.name] = result; } } })((function() { return this; })()); // eslint-disable-line
