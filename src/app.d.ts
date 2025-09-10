// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import '@tiptap/core';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		customExtension: {
			setSpoilerMark: () => ReturnType;
			unsetSpoilerMark: () => ReturnType;
			toggleSpoilerMark: () => ReturnType;
		}
	}
}

export { };
