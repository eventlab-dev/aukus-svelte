<script lang="ts">
	import { Editor } from '@tiptap/core';
	import { StarterKit } from '@tiptap/starter-kit';
	import { Placeholder } from '@tiptap/extensions';
	import { Image } from '@tiptap/extension-image';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		content: string;
		value?: string;
		editorState?: { editor: Editor | null };
		editable?: boolean;
		class?: string;
	};

	let {
		class: className,
		value = $bindable(''),
		editorState = $bindable({ editor: null }),
		content,
		editable = true
	}: Props = $props();

	let element: HTMLDivElement | undefined = $state();

	const editorStyles =
		'thin-scrollbar field-sizing-content h-[120px] min-h-16 w-full max-w-[632px] resize-none overflow-y-auto rounded-lg border-2 border-muted bg-transparent p-2 font-medium transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20';

	onMount(() => {
		if (!element) return;

		const editor = new Editor({
			element,
			content: content ? JSON.parse(content) : '',
			editable,
			editorProps: {
				attributes: {
					class: cn(editorStyles, className)
				}
			},
			extensions: [
				StarterKit,
				Placeholder.configure({
					placeholder: 'Ваш комментарий'
				}),
				Image.configure({ inline: true, HTMLAttributes: { class: 'emote' } })
			],
			onTransaction: ({ editor }) => {
				// force re-render so `editor.isActive` works as expected
				editorState = { editor };
			}
		});

		return () => editor.destroy();
	});

	$effect(() => {
		if (!editorState.editor) return;

		if (editorState.editor.isEmpty) {
			value = '';
		} else {
			value = JSON.stringify(editorState.editor.getJSON());
		}
	});
</script>

<div style="position: relative">
	<div bind:this={element}></div>
</div>

<style>
	:global(.emote) {
		display: inline-block;
		margin: 0 4px;
		height: 24px;
		vertical-align: middle;
	}

	:global(.tiptap p.is-editor-empty:first-child::before) {
		color: var(--color-muted-foreground);
		font-weight: 500;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
</style>
