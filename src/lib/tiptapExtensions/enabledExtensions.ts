import { Placeholder } from "@tiptap/extensions";
import { Image } from '@tiptap/extension-image';
import StarterKit from "@tiptap/starter-kit";
import CleanPaste from "./CleanPaste";
import SpoilerMark from "./SpoilerMark";

const enabledExtensions = [
	StarterKit,
	CleanPaste,
	SpoilerMark,
	Placeholder.configure({ placeholder: 'Ваш комментарий' }),
	Image.configure({ inline: true, HTMLAttributes: { class: 'emote' } }),
]

export default enabledExtensions;
