<script lang="ts">
	const baseColor = 'rgba(0,0,0,0.5)'
	const greenColor = 'rgba(0,180,0,0.9)'
	const redColor = 'rgba(180,0,0,0.9)'

	// const arrowPoints = '0 0, 8 2, 0 4'

	const arrowHeight = 5
	const arrowWidth = 7

	const arrowPoints = `0 0, ${arrowWidth} ${arrowHeight / 2}, 0 ${arrowHeight}`
</script>

<svg style="height: 0">
	<defs>
		<marker
			id="green-arrow-start"
			viewBox={`0 0 ${arrowWidth} ${arrowHeight}`}
			markerWidth={arrowWidth}
			markerHeight={arrowHeight}
			refX="-5"
			refY={arrowHeight / 2}
			orient="auto"
			stroke={baseColor}
			stroke-width="1"
		>
			<polygon points={arrowPoints} fill={greenColor} stroke="none" />
		</marker>
		<marker
			id="green-arrow-end"
			markerWidth={arrowWidth}
			markerHeight={arrowHeight}
			refX="5"
			refY={arrowHeight / 2}
			orient="auto"
			stroke={baseColor}
			stroke-width="1"
		>
			<polygon points={arrowPoints} fill={greenColor} stroke="none" />
		</marker>
		<marker
			id="red-arrow-start"
			markerWidth={arrowWidth}
			markerHeight={arrowHeight}
			refX="-5"
			refY={arrowHeight / 2}
			orient="auto"
			stroke={baseColor}
			stroke-width="1"
		>
			<polygon points={arrowPoints} fill={redColor} stroke="none" />
		</marker>
		<marker
			id="red-arrow-end"
			markerWidth={arrowWidth}
			markerHeight={arrowHeight}
			refX="5"
			refY={arrowHeight / 2}
			orient="auto"
			stroke={baseColor}
			stroke-width="1"
		>
			<polygon points={arrowPoints} fill={redColor} stroke="none" />
		</marker>
	</defs>
</svg>
