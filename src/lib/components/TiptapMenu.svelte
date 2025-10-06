<script lang="ts">
	import type { Editor } from '@tiptap/core'
	import { Button } from './ui/button'

	type Props = {
		editor: Editor
	}
	const { editor }: Props = $props()
</script>

<div class="control-group">
	<div class="flex w-[500px] flex-wrap gap-3">
		<Button
			onclick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
			class={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
		>
			H1
		</Button>
		<Button
			onclick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
			class={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
		>
			H2
		</Button>
		<Button
			onclick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
			class={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
		>
			H3
		</Button>
		<Button
			onclick={() => editor.chain().focus().setParagraph().run()}
			class={editor.isActive('paragraph') ? 'is-active' : ''}
		>
			Paragraph
		</Button>
		<Button
			onclick={() => editor.chain().focus().toggleBold().run()}
			class={editor.isActive('bold') ? 'is-active' : ''}
		>
			Bold
		</Button>
		<Button
			onclick={() => editor.chain().focus().toggleItalic().run()}
			class={editor.isActive('italic') ? 'is-active' : ''}
		>
			Italic
		</Button>
		<Button
			onclick={() => editor.chain().focus().toggleStrike().run()}
			class={editor.isActive('strike') ? 'is-active' : ''}
		>
			Strike
		</Button>
		<Button
			onclick={() => editor.chain().focus().toggleHighlight().run()}
			class={editor.isActive('highlight') ? 'is-active' : ''}
		>
			Highlight
		</Button>
		<Button
			onclick={() => editor.chain().focus().setTextAlign('left').run()}
			class={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
		>
			Left
		</Button>
		<Button
			onclick={() => editor.chain().focus().setTextAlign('center').run()}
			class={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
		>
			Center
		</Button>
		<Button
			onclick={() => editor.chain().focus().setTextAlign('right').run()}
			class={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
		>
			Right
		</Button>
		<Button
			onclick={() => editor.chain().focus().setTextAlign('justify').run()}
			class={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}
		>
			Justify
		</Button>
	</div>
</div>
