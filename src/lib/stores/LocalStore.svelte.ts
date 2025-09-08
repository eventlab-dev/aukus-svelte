export class LocalStore<T> {
	private _value = $state<T>() as T;
	private _key = '';
	private _isFirst = true;

	constructor(key: string, value: T) {
		this._value = value;
		this._key = key;
	}

	get value() {
		if (this._isFirst) {
			const savedValue = localStorage.getItem(this._key);

			if (savedValue) this._value = JSON.parse(savedValue);

			this._isFirst = false;
		}

		return this._value;
	}

	set value(val: T) {
		localStorage.setItem(this._key, JSON.stringify(val));
		this._value = val;
	}
}

function storable<T>(key: string, value: T) {
	return new LocalStore(key, value);
}

export default storable;
