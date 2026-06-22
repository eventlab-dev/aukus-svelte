<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import type { CanvasFile, PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	type Props = {
		playerSlug: string
	}

	const { playerSlug }: Props = $props()

	const app = getAppManager()
	const { usersStore, canvasStore, playersMovesStore } = app

	const canEdit = $derived(
		Boolean(
			usersStore.myUser &&
				(usersStore.myUser.slug === playerSlug ||
					usersStore.myUser.moder_for.includes(playerSlug) ||
					usersStore.myUser.roles.includes('admin'))
		)
	)

	async function handleSave() {
		try {
			await canvasStore.saveCanvasChanges()
			canvasStore.editMode = false
		} catch (error) {
			console.error('Failed to save canvas:', error)
			alert('Ошибка при сохранении изменений')
		}
	}

	let fileInput = $state<HTMLInputElement | null>(null)

	async function handleUpload(event: Event) {
		const input = event.target as HTMLInputElement
		const file = input?.files?.[0]
		if (!file) return

		if (file.size > 1024 * 1024 * 5) {
			alert('Файл слишком большой. Максимальный размер файла: 5 МБ.')
			return
		}

		const image = new window.Image()
		image.src = URL.createObjectURL(file)
		image.onload = async () => {
			try {
				await canvasStore.uploadImageMutation.mutateAsync({
					body: {
						file,
						height: image.naturalHeight,
						width: image.naturalWidth
					},
					path: {
						player_slug: playerSlug
					}
				})
				URL.revokeObjectURL(image.src)
				await canvasStore.canvasQuery.refetch()
				canvasStore.discardCanvasChanges()
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (err: any) {
				URL.revokeObjectURL(image.src)
				alert('Ошибка при загрузке изображения: ' + err.detail)
			}
		}
	}

	function handleDelete() {
		if (!canvasStore.selectedImage) return
		canvasStore.deleteImage(canvasStore.selectedImage.id)
	}

	function handleClose() {
		canvasStore.discardCanvasChanges()
		canvasStore.editMode = false
	}

	function handleFlip() {
		if (!canvasStore.selectedImage) return

		const newImage: CanvasFile = {
			...canvasStore.selectedImage,
			scale_x: canvasStore.selectedImage.scale_x * -1
		}
		canvasStore.updateImage(newImage)
	}

	const isAttached = $derived(canvasStore.selectedImage?.attach_move_id !== null)
	const lastMove = $derived<PlayerMoveItem | undefined>(playersMovesStore.playerMoves[0])

	function handleAttach() {
		if (!canvasStore.selectedImage) return

		if (canvasStore.selectedImage.attach_move_id === null && lastMove) {
			// attach

			const moveElement = document.getElementById(`move-card-${lastMove.id}`)
			if (!moveElement) return
			const scrollArea = document.getElementById('main-scroll-area')?.firstElementChild
			if (!scrollArea) return
			const moveY = moveElement.getBoundingClientRect().top + scrollArea.scrollTop

			const newImage: CanvasFile = {
				...canvasStore.selectedImage,
				attach_move_id: lastMove.id,
				y: canvasStore.selectedImage.y - moveY
			}
			canvasStore.updateImage(newImage)
			return
		} else if (canvasStore.selectedImage.attach_move_id !== null) {
			// detach

			const moveElement = document.getElementById(
				`move-card-${canvasStore.selectedImage.attach_move_id}`
			)
			if (!moveElement) return
			const scrollArea = document.getElementById('main-scroll-area')?.firstElementChild
			if (!scrollArea) return

			const moveY = moveElement.getBoundingClientRect().top + scrollArea.scrollTop
			const newImage: CanvasFile = {
				...canvasStore.selectedImage,
				attach_move_id: null,
				y: canvasStore.selectedImage.y + moveY
			}
			canvasStore.updateImage(newImage)
			return
		}
	}

	const noImageSelected = $derived(!canvasStore.selectedImage)
</script>

{#if canEdit}
	<div class="sticky top-15 left-1/2 z-200 flex w-fit -translate-x-1/2 justify-center gap-3">
		{#if canvasStore.editMode}
			<Button onclick={handleClose} variant="destructive">Закрыть</Button>
			<Button
				onclick={handleSave}
				variant="default"
				loading={canvasStore.updateCanvasMutation.isPending}
			>
				Сохранить
			</Button>
			<input
				bind:this={fileInput}
				class="hidden"
				type="file"
				accept=".jpg, .jpeg, .png, .gif, .webp, .svg, .avif"
				onchange={handleUpload}
			/>
			<Button
				onclick={() => {
					fileInput?.click()
				}}
				variant="secondary"
			>
				Загрузить изображение
			</Button>
			<Tooltip>
				<TooltipTrigger>
					<Button variant="secondary" onclick={handleFlip} disabled={noImageSelected}>Отразить</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom" class="z-200">
					Отразить выбранное изображение по горизонтали
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger>
					<Button variant="secondary" onclick={handleAttach} disabled={noImageSelected}>
						{!isAttached ? 'Закрепить' : 'Открепить'}
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom" class="z-200">
					Изображение закрепится возле хода игрока
				</TooltipContent>
			</Tooltip>
			<Button onclick={handleDelete} disabled={noImageSelected} variant="secondary" class="ml-5">
				Удалить
			</Button>
		{:else}
			<Button onclick={() => canvasStore.editMode = true}>Редактировать</Button>
		{/if}
	</div>
{/if}
