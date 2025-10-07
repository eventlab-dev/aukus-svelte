<script lang="ts">
	import type { Editor } from '@tiptap/core'
	import ToggleGroup from './ui/toggle-group/toggle-group.svelte'
	import { ToggleGroupItem } from './ui/toggle-group'
	import BoldIcon from '@lucide/svelte/icons/bold'
	import ItalicIcon from '@lucide/svelte/icons/italic'
	import UnderlineIcon from '@lucide/svelte/icons/underline'
	import StrikethroughIcon from '@lucide/svelte/icons/strikethrough'
	import HighlightIcon from '@lucide/svelte/icons/highlighter'

	type Props = {
		editorState: { editor: Editor | null }
	}
	const { editorState }: Props = $props()

	const headerType = $derived.by(() => {
		if (editorState.editor?.isActive('heading', { level: 1 })) return 'h1'
		if (editorState.editor?.isActive('heading', { level: 2 })) return 'h2'
		if (editorState.editor?.isActive('heading', { level: 3 })) return 'h3'
		return undefined
	})

	const textFormats = $derived.by(() => {
		const formats = []
		if (editorState.editor?.isActive('bold')) formats.push('bold')
		if (editorState.editor?.isActive('italic')) formats.push('italic')
		if (editorState.editor?.isActive('strike')) formats.push('strike')
		if (editorState.editor?.isActive('highlight')) formats.push('highlight')
		if (editorState.editor?.isActive('underline')) formats.push('underline')
		return formats
	})
</script>

<div class="flex gap-3">
	<ToggleGroup variant="outline" type="single" value={headerType}>
		<ToggleGroupItem
			value="h1"
			onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 1 }).run()}
			>H1</ToggleGroupItem
		>
		<ToggleGroupItem
			value="h2"
			onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 2 }).run()}
			>H2</ToggleGroupItem
		>
		<ToggleGroupItem
			value="h3"
			onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 3 }).run()}
			>H3</ToggleGroupItem
		>
	</ToggleGroup>
	<ToggleGroup variant="outline" type="multiple" value={textFormats}>
		<ToggleGroupItem
			value="bold"
			onclick={() => editorState.editor?.chain().focus().toggleBold().run()}
		>
			<BoldIcon />
		</ToggleGroupItem>
		<ToggleGroupItem
			value="italic"
			onclick={() => editorState.editor?.chain().focus().toggleItalic().run()}
		>
			<ItalicIcon />
		</ToggleGroupItem>
		<ToggleGroupItem
			value="underline"
			onclick={() => editorState.editor?.chain().focus().toggleUnderline().run()}
			><UnderlineIcon /></ToggleGroupItem
		>
		<ToggleGroupItem
			value="strike"
			onclick={() => editorState.editor?.chain().focus().toggleStrike().run()}
			><StrikethroughIcon /></ToggleGroupItem
		>
		<ToggleGroupItem
			value="highlight"
			onclick={() => editorState.editor?.chain().focus().toggleHighlight().run()}
			><HighlightIcon /></ToggleGroupItem
		>
	</ToggleGroup>
	<ToggleGroup variant="outline" type="single">
		<ToggleGroupItem
			value="left"
			onclick={() => editorState.editor?.chain().focus().setTextAlign('left').run()}
			>Left</ToggleGroupItem
		>
		<ToggleGroupItem
			value="center"
			onclick={() => editorState.editor?.chain().focus().setTextAlign('center').run()}
			>Center</ToggleGroupItem
		>
		<ToggleGroupItem
			value="right"
			onclick={() => editorState.editor?.chain().focus().setTextAlign('right').run()}
			>Right</ToggleGroupItem
		>
		<ToggleGroupItem
			value="justify"
			onclick={() => editorState.editor?.chain().focus().setTextAlign('justify').run()}
			>Justify</ToggleGroupItem
		>
	</ToggleGroup>
</div>
