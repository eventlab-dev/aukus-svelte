<script lang="ts">
	import type { Editor } from '@tiptap/core'
	import ToggleGroup from '../ui/toggle-group/toggle-group.svelte'
	import { ToggleGroupItem } from '../ui/toggle-group'
	import BoldIcon from '@lucide/svelte/icons/bold'
	import ItalicIcon from '@lucide/svelte/icons/italic'
	import UnderlineIcon from '@lucide/svelte/icons/underline'
	import StrikethroughIcon from '@lucide/svelte/icons/strikethrough'
	import HighlightIcon from '@lucide/svelte/icons/highlighter'
	import ListIcon from '@lucide/svelte/icons/list'
	import OrderedListIcon from '@lucide/svelte/icons/list-ordered'
	import ClearIcon from '@lucide/svelte/icons/octagon-x'
	import MinusIcon from '@lucide/svelte/icons/minus'
	import LinkIcon from '@lucide/svelte/icons/link'
	import UnlinkIcon from '@lucide/svelte/icons/unlink'
	import { Button } from '../ui/button'

	type Props = {
		editorState: { editor: Editor | null }
	}
	const { editorState }: Props = $props()

	const headerType = $derived.by(() => {
		if (editorState.editor?.isActive('heading', { level: 1 })) return 'h1'
		if (editorState.editor?.isActive('heading', { level: 2 })) return 'h2'
		if (editorState.editor?.isActive('heading', { level: 3 })) return 'h3'
		if (editorState.editor?.isActive('paragraph')) return 'p'
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

	const listTypes = $derived.by(() => {
		const types = []
		if (editorState.editor?.isActive('bulletList')) types.push('bullet')
		if (editorState.editor?.isActive('orderedList')) types.push('ordered')
		return types
	})

	function setLink() {
		const previousUrl = editorState.editor?.getAttributes('link').href
		const url = prompt('URL', previousUrl || '')

		if (url === null) {
			return
		}

		if (url === '') {
			editorState.editor?.chain().focus().extendMarkRange('link').unsetLink().run()
			return
		}
		editorState.editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()

		// editorState.editor?.chain().focus().setLink({ href: url }).run()

		//   // update link
		//   try {
		//     editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
		//   } catch (e) {
		//     alert(e.message)
		//   }
		// }, [editor])
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex gap-3">
		<ToggleGroup variant="outline" type="single" value={headerType}>
			<ToggleGroupItem
				value="p"
				onclick={() => editorState.editor?.chain().focus().setParagraph().run()}>P</ToggleGroupItem
			>
			<ToggleGroupItem
				value="h3"
				onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 3 }).run()}
				>H3</ToggleGroupItem
			>
			<ToggleGroupItem
				value="h2"
				onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 2 }).run()}
				>H2</ToggleGroupItem
			>
			<ToggleGroupItem
				value="h1"
				onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 1 }).run()}
				>H1</ToggleGroupItem
			>
		</ToggleGroup>

		<ToggleGroup variant="outline" type="single">
			<ToggleGroupItem
				value="left"
				class="w-auto flex-none"
				onclick={() => editorState.editor?.chain().focus().setTextAlign('left').run()}
				>Left</ToggleGroupItem
			>
			<ToggleGroupItem
				value="center"
				class="w-auto flex-none"
				onclick={() => editorState.editor?.chain().focus().setTextAlign('center').run()}
				>Center</ToggleGroupItem
			>
			<ToggleGroupItem
				value="right"
				class="w-auto flex-none"
				onclick={() => editorState.editor?.chain().focus().setTextAlign('right').run()}
				>Right</ToggleGroupItem
			>
			<ToggleGroupItem
				value="justify"
				class="w-auto flex-none"
				onclick={() => editorState.editor?.chain().focus().setTextAlign('justify').run()}
				>Justify</ToggleGroupItem
			>
		</ToggleGroup>
	</div>
	<div class="flex gap-3">
		<ToggleGroup variant="outline" type="multiple" value={textFormats} size="lg">
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
			<ToggleGroupItem
				value="clear"
				class="w-auto flex-none"
				onclick={() => editorState.editor?.chain().focus().unsetAllMarks().run()}
				><ClearIcon></ClearIcon></ToggleGroupItem
			>
		</ToggleGroup>

		<ToggleGroup variant="outline" type="multiple" value={listTypes} size="lg">
			<ToggleGroupItem
				value="bullet"
				onclick={() => editorState.editor?.chain().focus().toggleBulletList().run()}
				><ListIcon /></ToggleGroupItem
			>
			<ToggleGroupItem
				value="ordered"
				onclick={() => editorState.editor?.chain().focus().toggleOrderedList().run()}
				><OrderedListIcon /></ToggleGroupItem
			>
			<ToggleGroupItem
				value="clear"
				class="w-auto flex-none"
				onclick={() => editorState.editor?.chain().focus().liftListItem('listItem').run()}
				><ClearIcon></ClearIcon></ToggleGroupItem
			>
		</ToggleGroup>

		<Button
			variant="outline"
			class=" w-auto flex-none"
			onclick={() => editorState.editor?.chain().focus().setHorizontalRule().run()}
			><MinusIcon></MinusIcon></Button
		>

		<Button variant="outline" onclick={setLink}><LinkIcon /></Button>
		<Button
			variant="outline"
			onclick={() => editorState.editor?.chain().focus().unsetLink().run()}
			disabled={!editorState.editor?.isActive('link')}><UnlinkIcon /></Button
		>
	</div>
</div>
