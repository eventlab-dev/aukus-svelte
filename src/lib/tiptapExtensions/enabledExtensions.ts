import { Placeholder } from '@tiptap/extensions'
import { Image } from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'
import CleanPaste from './CleanPaste'
import SpoilerMark from './SpoilerMark'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import TableOfContents, {
	getHierarchicalIndexes,
	type TableOfContentData
} from '@tiptap/extension-table-of-contents'
import { createSectionPlugin } from './Sections'

export function initExtensions(
	props: {
		withTOC?: boolean
		sectionsMode?: 'full' | 'parse-only'
		onTOCupdate?: (data: TableOfContentData) => void
		placeholderText?: string
		withLinks?: boolean
	} = {}
) {
	const enabledExtensions = [
		StarterKit,
		CleanPaste,
		SpoilerMark,
		Highlight,
		TextAlign.configure({ types: ['heading', 'paragraph'] }),
		Image.configure({ inline: true, HTMLAttributes: { class: 'emote' } })
	]

	if (props.placeholderText) {
		enabledExtensions.push(Placeholder.configure({ placeholder: props.placeholderText }))
	}

	if (props.withLinks) {
		enabledExtensions.push(
			Link.configure({
				protocols: ['https'],
				openOnClick: false,
				HTMLAttributes: {
					rel: 'noopener noreferrer',
					target: '_blank'
				}
			})
		)
	}

	if (props.withTOC) {
		enabledExtensions.push(
			TableOfContents.configure({
				getIndex: getHierarchicalIndexes,
				onUpdate: props.onTOCupdate,
				scrollParent: () => {
					return (
						(document.getElementById('main-scroll-area')?.firstElementChild as HTMLElement) ??
						window
					)
				}
			})
		)
	}

	if (props.sectionsMode) {
		enabledExtensions.push(createSectionPlugin({ mode: props.sectionsMode }))
	}

	return enabledExtensions
}
