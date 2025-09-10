import { browser } from "$app/environment";

export class LocalStore<T> {
	private _value = $state<T>() as T;
	private _key = '';

	constructor(key: string, value: T) {
		this._value = value;
		this._key = key;

		if (browser) {
			const savedValue = localStorage.getItem(this._key);
			if (savedValue) this._value = JSON.parse(savedValue);
		}
	}

	get value() {
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
