import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const CleanPaste = Extension.create({
	name: 'cleanPaste',

	addOptions() {
		return {
			// Allow:
			// - Printable ASCII (20–7E)
			// - Latin Extended, Greek, Cyrillic, and common symbols (00A0–03FF)
			// - Currency symbols (20A0–20CF)
			// - General punctuation, arrows, math symbols (2000–2BFF)
			// - Emoji & pictographs (1F000–1FAFF)
			// - All Unicode letters, numbers, marks, punctuation, and symbols

			regexPattern:
				/[^\p{L}\p{N}\p{P}\p{S}\p{M}\s\x20-\x7E\u00A0-\u03FF\u2000-\u2BFF\u20A0-\u20CF\u1F000-\u1FAFF]/gu
		}
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey('cleanPaste'),
				props: {
					handlePaste: (view, event) => {
						const clipboardData = event.clipboardData
						if (!clipboardData) return false

						const text = clipboardData.getData('text/plain')
						if (!text) return false

						const cleanText = text.replace(this.options.regexPattern, '')

						// Stop the default paste
						event.preventDefault()

						// Insert the cleaned text
						const { tr, selection } = view.state
						const { from, to } = selection
						const newText = view.state.schema.text(cleanText)
						const transaction = tr.replaceWith(from, to, newText)
						view.dispatch(transaction)

						return true
					}
				}
			})
		]
	}
})

export default CleanPaste
