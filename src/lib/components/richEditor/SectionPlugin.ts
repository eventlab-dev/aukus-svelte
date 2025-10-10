// Section.ts
import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Node as ProseMirrorNode } from 'prosemirror-model'

let debugCounter = 50

export const SectionPlugin = Node.create({
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
			appendTransaction: (transactions, oldState, newState) => {
				// console.log('flag 1')
				// only run when doc actually changed
				if (!transactions.some((tr) => tr.docChanged)) return null

				const { doc, schema } = newState
				const { section, heading } = schema.nodes

				// console.log('flag 2')

				const nonSections = doc.content.content.filter((n) => n.type !== section)

				// If the top-level is already all sections, nothing to do
				// console.log(
				// 	'all types',
				// 	doc.content.content.map((n) => n.type.name)
				// )
				if (
					nonSections.length === 1 &&
					nonSections[0].type.name === 'paragraph' &&
					nonSections[0].content.size === 0 &&
					nonSections[0].childCount === 0
				) {
					// console.log('doc is only sections')
					return null
				}

				const newSections: ProseMirrorNode[] = []
				let buffer: ProseMirrorNode[] = []

				// iterate top-level nodes
				doc.forEach((node) => {
					// If we hit an existing section node, flush buffer and keep it as-is
					if (node.type === section) {
						if (buffer.length) {
							newSections.push(section.create({}, buffer))
							buffer = []
						}
						// push existing section without wrapping it
						newSections.push(node)
						return
					}

					// If this node is a heading, it should start a new section
					if (node.type === heading) {
						if (buffer.length) {
							newSections.push(section.create({}, buffer))
							buffer = []
						}
						buffer.push(node)
					} else {
						// normal block (paragraph, list, etc.) — append to buffer
						buffer.push(node)
					}
				})

				// flush remaining buffer
				if (buffer.length) {
					newSections.push(section.create({}, buffer))
				}

				const newDoc = schema.topNodeType.create(null, newSections)

				// console.log('flag 3', newDoc.toJSON())

				// structural equality check (avoid instance identity issues)
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

				// replace whole doc (note: this will change selection; see note below)
				const tr = newState.tr.replaceWith(0, doc.content.size, newDoc.content)
				return tr
			}
		})

		return [plugin]
	}
})
