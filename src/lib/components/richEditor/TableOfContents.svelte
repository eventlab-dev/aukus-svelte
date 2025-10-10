<script lang="ts">
	import type { Editor } from '@tiptap/core'
	import type { TableOfContentDataItem } from '@tiptap/extension-table-of-contents'
	import { TextSelection } from '@tiptap/pm/state'

	type Props = {
		items: TableOfContentDataItem[]
		editor: Editor
		pos: { top: number; left: number }
	}

	const { items, editor, pos }: Props = $props()

	function onItemClick(e: MouseEvent, id: string) {
		e.preventDefault()

		if (editor) {
			const element = editor.view.dom.querySelector(`[data-toc-id="${id}"`)
			console.log({ element })
			if (!element) return

			const editorPos = editor.view.posAtDOM(element, 0)

			// set focus
			const tr = editor.view.state.tr

			tr.setSelection(new TextSelection(tr.doc.resolve(editorPos)))

			editor.view.dispatch(tr)

			editor.view.focus()

			// if (history.pushState) {
			// 	history.pushState(null, '', `#${id}`)
			// }

			// element.scrollIntoView({ behavior: 'smooth', block: 'center' })

			const sectionPadding = 12

			const mainScroll = document.getElementById('main-scroll-area')?.firstElementChild
			mainScroll?.scrollTo({
				top: element.getBoundingClientRect().top + mainScroll.scrollTop - pos.top - sectionPadding,
				behavior: 'smooth'
			})

			// window.scrollTo({
			// 	top: element.getBoundingClientRect().top + window.scrollY,
			// 	behavior: 'smooth'
			// })
		}
	}

	let element = $state<HTMLDivElement | undefined>(undefined)

	const elementWidth = $derived(element?.offsetWidth || 0)
</script>

<div
	bind:this={element}
	class="fixed w-fit rounded-2xl bg-card p-5"
	style="top: {pos.top}px; left: {pos.left - elementWidth - 30}px"
>
	<div class="mb-5">Быстрые ссылки</div>
	{#if items.length > 0}
		<div class="table-of-contents">
			{#each items as item (item.id)}
				<div
					class="data-[active=true]:text-normal data-[active=false]:text-muted-foreground"
					style="--level: {item.level}"
					data-active={item.isActive}
				>
					<a
						href={`#${item.id}`}
						onclick={(e) => onItemClick(e, item.id)}
						data-item-index={item.itemIndex}
					>
						{item.textContent}
					</a>
				</div>
			{/each}
		</div>
	{:else}
		<div>
			<p>Нет заголовков</p>
		</div>
	{/if}
</div>

<style>
	.table-of-contents {
		display: flex;
		flex-direction: column;
		/*font-size: 0.875rem;*/
		gap: 0.25rem;
		overflow: auto;
		text-decoration: none;

		> div {
			border-radius: 0.25rem;
			padding-left: calc(0.875rem * (var(--level) - 1));
			transition: all 0.2s cubic-bezier(0.65, 0.05, 0.36, 1);

			/*&:hover {
				background-color: var(--gray-2);
			}*/
		}

		/*.empty-state {
			color: var(--gray-5);
			user-select: none;
		}

		.is-active a {
			color: var(--color-primary);
		}

		.is-scrolled-over a {
			color: var(--gray-5);
		}*/

		a {
			color: var(--black);
			display: flex;
			gap: 0.25rem;
			text-decoration: none;

			&::before {
				content: attr(data-item-index) '.';
			}
		}
	}
</style>
