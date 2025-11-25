// Section.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Node as ProseMirrorNode } from 'prosemirror-model'

let debugCounter = 200

export function createSectionPlugin(params: { mode: 'full' | 'parse-only' } = { mode: 'full' }) {
	return Node.create({
		name: 'section',
		group: 'block',
		content: 'heading block*', // heading first, then any block nodes
		defining: true,

		parseHTML() {
			return [{ tag: 'section' }]
		},

		renderHTML({ HTMLAttributes }) {
			return ['section', mergeAttributes(HTMLAttributes, { class: 'tiptap-section' }), 0]
		},

		addProseMirrorPlugins() {
			const plugin = new Plugin({
				key: new PluginKey('autoSectionWrapper'),

				appendTransaction(transactions, oldState, newState) {
					// console.log('flag 1')
					if (!transactions.some((tr) => tr.docChanged)) return null

					const { doc, schema } = newState
					const { section, heading } = schema.nodes

					// Step 1: flatten all top-level nodes (unwrap any sections)
					const flatNodes: ProseMirrorNode[] = []
					doc.forEach((node) => {
						if (node.type === section) {
							node.forEach((inner) => flatNodes.push(inner))
						} else {
							flatNodes.push(node)
						}
					})

					if (params?.mode === 'parse-only') {
						// return flat structure for parsing mode
						const newDoc = schema.topNodeType.create(null, flatNodes)
						if (JSON.stringify(newDoc.toJSON()) === JSON.stringify(doc.toJSON())) {
							return null
						}
						const tr = newState.tr.replaceWith(0, doc.content.size, newDoc.content)
						return tr
					}

					// console.log(
					// 	'flag 2',
					// 	flatNodes.map((n) => n.type.name)
					// )

					// Step 2: rebuild sections based on headings
					const newSections: ProseMirrorNode[] = []
					let buffer: ProseMirrorNode[] = []

					for (const node of flatNodes) {
						if (node.type === heading && node.attrs.level < 3) {
							if (buffer.length > 0) {
								newSections.push(section.create({}, buffer))
								buffer = []
							}
							buffer.push(node)
						} else {
							buffer.push(node)
						}
					}

					if (buffer.length) {
						newSections.push(section.create({}, buffer))
					}

					// if last item already empty paragraph, skip adding another
					if (newSections.length > 0) {
						const lastNode = newSections[newSections.length - 1]
						if (lastNode.type === schema.nodes.paragraph && lastNode.content.size === 0) {
							// pass
						} else {
							const emptyParagraph = schema.nodes.paragraph.create()
							newSections.push(emptyParagraph)
						}
					}

					const newDoc = schema.topNodeType.create(null, newSections)

					// console.log('flag 3 new', newDoc.toJSON(), doc.toJSON())

					// Step 3: skip if structurally identical
					if (JSON.stringify(newDoc.toJSON()) === JSON.stringify(doc.toJSON())) {
						return null
					}

					if (debugCounter > 0) {
						debugCounter--
						// console.log('Auto-wrapping content in sections:')
						// console.log('Old doc:', doc.toJSON())
						// console.log('New doc:', JSON.stringify(newDoc.toJSON(), null, 2))
					} else {
						return null
					}

					const tr = newState.tr.replaceWith(0, doc.content.size, newDoc.content)
					return tr
				}
			})

			return [plugin]
		}
	})
}
