<script lang="ts">
	import { Editor } from '@tiptap/core'
	import { onMount } from 'svelte'
	import { cn } from '$lib/utils'
	import { initExtensions } from '$lib/tiptapExtensions/enabledExtensions'
	import TiptapMenu from './TiptapMenu.svelte'
	import { type TableOfContentDataItem } from '@tiptap/extension-table-of-contents'
	import TableOfContents from './TableOfContents.svelte'

	type Props = {
		content: string
		value?: string
		editorState?: { editor: Editor | null }
		editable?: boolean
		class?: string
		withMenu?: boolean
		extensions: Parameters<typeof initExtensions>[0]
	}

	let {
		class: className,
		value = $bindable(''),
		editorState = $bindable({ editor: null }),
		content,
		editable = true,
		withMenu = false,
		extensions: extensionsParams
	}: Props = $props()

	let element: HTMLDivElement | undefined = $state()

	const editorStyles =
		'thin-scrollbar field-sizing-content h-[120px] min-h-16 w-full max-w-[632px] resize-none overflow-y-auto rounded-lg border-2 border-muted bg-transparent p-2 font-medium transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20'

	let tocData = $state<TableOfContentDataItem[]>([])

	onMount(() => {
		if (!element) return

		const extensions = initExtensions({
			...extensionsParams,
			onTOCupdate: (data) => (tocData = data)
		})

		const editor = new Editor({
			element,
			content: content ? JSON.parse(content) : '',
			enablePasteRules: false,
			editable,
			editorProps: {
				attributes: {
					class: cn(editorStyles, className, 'prose prose-invert p-0')
				}
			},
			extensions,
			onTransaction: ({ editor }) => {
				// force re-render so `editor.isActive` works as expected
				editorState = { editor }
			}
		})

		return () => editor.destroy()
	})

	// const activeToc = $derived(tocData.find((item) => item.isActive) || null)

	// $inspect(tocData, 'TOC Data')
	// $inspect(activeToc, 'Active TOC Item')

	const editor = $derived(editorState.editor)

	$effect(() => {
		if (editor) {
			editor.commands.setContent(content ? JSON.parse(content) : '')
		}
	})

	$effect(() => {
		if (!editorState.editor) return

		if (editorState.editor.isEmpty) {
			value = ''
		} else {
			value = JSON.stringify(editorState.editor.getJSON())
		}
	})

	const editorTopLeft = $derived.by(() => {
		if (!element) return { top: 0, left: 0 }
		const rect = element.getBoundingClientRect()
		return { top: rect.top + window.scrollY, left: rect.left + window.scrollX }
	})
</script>

<div class="relative">
	{#if withMenu && editorState.editor}
		<div class="mb-3">
			<TiptapMenu {editorState} />
		</div>
	{/if}
	<div bind:this={element}></div>

	{#if editor}
		<TableOfContents items={tocData} {editor} pos={editorTopLeft} />
	{/if}
</div>

<style>
	:global(.emote) {
		display: inline-block;
		margin: 0 4px;
		height: 24px;
		vertical-align: middle;
		user-select: all;
		transition: all 0.3s ease;
	}

	:global(.tiptap p.is-editor-empty:first-child::before) {
		color: var(--color-muted-foreground);
		font-weight: 500;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}

	:global(.spoiler) {
		position: relative;
		display: inline;
		background-color: var(--color-muted);
		color: var(--color-muted);
		transition: all 0.3s ease;
		border-radius: var(--radius-xs);

		& > img {
			opacity: 0;
		}

		&:hover {
			background-color: inherit;
			color: inherit;
		}

		&:hover > img {
			opacity: 1;
		}
	}

	:global(.tiptap a) {
		color: var(--color-primary);
		text-decoration: underline;
	}

	:global(.tiptap-section) {
		padding: 12px;
		background-color: var(--color-card);
		border-radius: var(--radius-2xl);
		margin-bottom: 12px;
	}

	:global(.tiptap h1),
	:global(.tiptap h2),
	:global(.tiptap h3) {
		padding: 0px;
		margin: 0px;
	}

	:global(.tiptap h1) {
		font-weight: 600;
	}
	:global(.tiptap h2) {
		font-weight: 600;
	}
	:global(.tiptap h3) {
		font-weight: 600;
	}

	:global(.tiptap p) {
		margin-top: 20px;
		margin-bottom: 20px;
	}

	:global(.tiptap li) {
		margin-top: 0px;
		margin-bottom: 0px;
	}
</style>
