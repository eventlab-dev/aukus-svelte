import { Placeholder } from '@tiptap/extensions'
import { Image } from '@tiptap/extension-image'
import StarterKit from '@tiptap/starter-kit'
import CleanPaste from './CleanPaste'
import SpoilerMark from './SpoilerMark'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'

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
	})
]

export default enabledExtensions
