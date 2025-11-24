<script lang="js">
	// @ts-nocheck
	import { onMount } from 'svelte'
	import { page } from '$app/state'

	const metrika = async () => {
		;(function (m, e, t, r, i, k, a) {
			m[i] =
				m[i] ||
				function () {
					;(m[i].a = m[i].a || []).push(arguments)
				}
			m[i].l = 1 * new Date()
			for (var j = 0; j < document.scripts.length; j++) {
				if (document.scripts[j].src === r) {
					return
				}
			}
			// eslint-disable-next-line
			;((k = e.createElement(t)),
				(a = e.getElementsByTagName(t)[0]),
				(k.async = 1),
				(k.src = r),
				a.parentNode.insertBefore(k, a))
		})(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym')

		ym(105439288, 'init', {
			defer: true,
			clickmap: true,
			trackLinks: true,
			accurateTrackBounce: true
		})
	}

	let mount = $state(false)

	onMount(() => {
		metrika().then(() => (mount = true))
	})

	$effect(() => {
		if (mount) ym(105439288, 'hit', page.url.href)
	})
</script>

<noscript>
	<div>
		<img
			src="https://mc.yandex.ru/watch/105439288"
			style="position:absolute; left:-9999px;"
			alt=""
		/>
	</div>
</noscript>
