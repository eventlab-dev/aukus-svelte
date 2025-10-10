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
import { SectionPlugin } from '$lib/components/richEditor/SectionPlugin'

export function initExtensions(props: { onTOCupdate?: (data: TableOfContentData) => void } = {}) {
	const enabledExtensions = [
		StarterKit,
		CleanPaste,
		SpoilerMark,
		Highlight,
		TextAlign.configure({ types: ['heading', 'paragraph'] }),
		Placeholder.configure({ placeholder: 'Ваш комментарий' }),
		Image.configure({ inline: true, HTMLAttributes: { class: 'emote' } }),
		Link.configure({
			protocols: ['https'],
			openOnClick: false,
			HTMLAttributes: {
				rel: 'noopener noreferrer',
				target: '_blank'
			}
		}),
		TableOfContents.configure({
			getIndex: getHierarchicalIndexes,
			onUpdate: props.onTOCupdate,
			scrollParent: () => {
				return (
					(document.getElementById('main-scroll-area')?.firstElementChild as HTMLElement) ?? window
				)
			}
		}),
		SectionPlugin
	]
	return enabledExtensions
}
