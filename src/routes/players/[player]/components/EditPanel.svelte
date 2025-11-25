<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { CanvasFile, PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'

	type Props = {
		playerSlug: string
	}

	const { playerSlug }: Props = $props()

	const { usersStore, canvasStore, playersMovesStore } = getAppManagerContext()
	const { myUser } = usersStore
	const { editMode, updateCanvasMutation, selectedImage, canvasQuery, uploadImageMutation } =
		canvasStore
	const { playerMoves } = playersMovesStore

	const canEdit = $derived(
		Boolean(
			$myUser &&
				($myUser.slug === playerSlug ||
					$myUser.moder_for.includes(playerSlug) ||
					$myUser.roles.includes('admin'))
		)
	)

	async function handleSave() {
		try {
			await canvasStore.saveCanvasChanges()
			canvasStore.discardCanvasChanges()
			editMode.set(false)
			await $canvasQuery.refetch()
		} catch (error) {
			console.error('Failed to save canvas:', error)
			alert('Ошибка при сохранении изменений')
		}
	}

	let fileInput = $state<HTMLInputElement | null>(null)

	function handleUpload(event: Event) {
		const input = event.target as HTMLInputElement
		const file = input?.files?.[0]
		if (!file) return

		if (file.size > 1024 * 1024 * 5) {
			alert('Файл слишком большой. Максимальный размер файла: 5 МБ.')
			return
		}

		const image = new window.Image()
		image.src = URL.createObjectURL(file)
		image.onload = () => {
			$uploadImageMutation.mutate(
				{
					body: {
						file,
						height: image.naturalHeight,
						width: image.naturalWidth
					},
					path: {
						player_slug: playerSlug
					}
				},
				{
					onSettled: () => {
						URL.revokeObjectURL(image.src)
						canvasStore.discardCanvasChanges()
						$canvasQuery.refetch()
					},
					onError: (err) => {
						alert('Ошибка при загрузке изображения: ' + err.detail)
					}
				}
			)
		}
	}

	function handleDelete() {
		if (!$selectedImage) return

		canvasStore.deleteImage($selectedImage.id)
	}

	function handleClose() {
		canvasStore.discardCanvasChanges()
		editMode.set(false)
		$canvasQuery.refetch()
	}

	function handleFlip() {
		if (!$selectedImage) return

		const newImage: CanvasFile = {
			...$selectedImage,
			scale_x: $selectedImage.scale_x * -1
		}
		canvasStore.updateImage(newImage)
	}

	const isAttached = $derived($selectedImage?.attach_move_id !== null)
	const lastMove = $derived<PlayerMoveItem | undefined>($playerMoves[0])

	function handleAttach() {
		if (!$selectedImage) return

		if ($selectedImage.attach_move_id === null && lastMove) {
			// attach

			const moveElement = document.getElementById(`move-card-${lastMove.id}`)
			if (!moveElement) return
			const scrollArea = document.getElementById('main-scroll-area')?.firstElementChild
			if (!scrollArea) return
			const moveY = moveElement.getBoundingClientRect().top + scrollArea.scrollTop

			const newImage: CanvasFile = {
				...$selectedImage,
				attach_move_id: lastMove.id,
				y: $selectedImage.y - moveY
			}
			canvasStore.updateImage(newImage)
			return
		} else if ($selectedImage.attach_move_id !== null) {
			// detach

			const moveElement = document.getElementById(`move-card-${$selectedImage.attach_move_id}`)
			if (!moveElement) return
			const scrollArea = document.getElementById('main-scroll-area')?.firstElementChild
			if (!scrollArea) return

			const moveY = moveElement.getBoundingClientRect().top + scrollArea.scrollTop
			const newImage: CanvasFile = {
				...$selectedImage,
				attach_move_id: null,
				y: $selectedImage.y + moveY
			}
			canvasStore.updateImage(newImage)
			return
		}
	}
</script>

{#if canEdit}
	<div class="sticky top-15 left-1/2 z-200 flex w-fit -translate-x-1/2 justify-center gap-3">
		{#if $editMode}
			<Button onclick={handleClose} variant="destructive">Закрыть</Button>
			<Button onclick={handleSave} variant="default" loading={$updateCanvasMutation.isPending}>
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
					<Button variant="secondary" onclick={handleFlip} disabled={!$selectedImage}
						>Отразить</Button
					>
				</TooltipTrigger>
				<TooltipContent side="bottom" class="z-200">
					Отразить выбранное изображение по горизонтали
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger>
					<Button variant="secondary" onclick={handleAttach} disabled={!$selectedImage}>
						{!isAttached ? 'Закрепить' : 'Открепить'}
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom" class="z-200">
					Изображение закрепится возле хода игрока
				</TooltipContent>
			</Tooltip>
			<Button onclick={handleDelete} disabled={!$selectedImage} variant="secondary" class="ml-5">
				Удалить
			</Button>
		{:else}
			<Button onclick={() => editMode.set(true)}>Редактировать</Button>
		{/if}
	</div>
{/if}
