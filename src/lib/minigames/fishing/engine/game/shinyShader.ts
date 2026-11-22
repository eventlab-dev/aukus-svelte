import { Filter } from 'pixi.js'

/**
 * The rainbow coat of a shiny fish.
 *
 * A shiny specimen is not a second sprite: the species art is the same picture,
 * and the difference is light. The shader runs over the 16 px fish and changes
 * three things at once — it slides a rainbow hue across the body, sends one
 * bright band down the diagonal, and lets the same hue bleed a couple of pixels
 * outside the silhouette as a glow. The glow is why the aura samples the
 * neighbouring texels instead of drawing a ring: a ring would look pasted on,
 * while the bleed follows the actual fins, tail and belly.
 *
 * The hue is quantised to art pixels (a 16-cell grid over the sprite), so the
 * bed of colours steps with the fish's own pixels instead of washing them into
 * a smooth gradient. The near-black contour stays untouched: it is the outline
 * that keeps the fish readable over water, and a rainbow rim there would turn
 * the silhouette fuzzy at 16 px.
 *
 * The class owns nothing but the filter and its clock. Attach
 * {@link ShinyShader.filter} to any sprite, call {@link ShinyShader.advance}
 * while it is visible, and {@link ShinyShader.destroy} with the sprite.
 */
const VERTEX = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`

const FRAGMENT = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uTime;

float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main(void) {
    vec4 src = texture(uTexture, vTextureCoord);
    vec3 base = src.rgb;
    float alpha = src.a;

    // The contour: near-black pixels of the sprite are ink, not coat. The alpha
    // gate keeps the transparent padding of the filter frame out of the test —
    // those texels are black too, and they are light, not ink.
    float ink = (1.0 - smoothstep(0.02, 0.10, luma(base))) * step(0.5, alpha);

    // Hue across the art grid, one cell per sprite pixel: a diagonal bed of
    // colours that slides along the fish. Sixteen cells match the 16 px art.
    vec2 cell = floor(vTextureCoord * 16.0);
    float hue = fract(0.58 + (cell.x - cell.y) * 0.030 + uTime * 0.12);

    // The coat recolours the art instead of painting over it: the sprite's own
    // value (its lighting and its dark fin lines) is kept and lifted toward the
    // light, only the hue is replaced. A flat wash of rainbow erased the fish at
    // 16 px — every scale, every fin and every shadow came out the same
    // brightness — while keeping the value untouched left the coat muddy.
    vec3 srcHsv = rgb2hsv(base);
    float coatValue = clamp(srcHsv.z * 0.25 + 0.75, 0.0, 1.0);
    vec3 coat = hsv2rgb(vec3(hue, clamp(srcHsv.y * 0.25 + 0.5, 0.0, 0.7), coatValue));
    vec3 tinted = mix(base, coat, 0.88);

    // One bright band travels the same diagonal: the coat catching the light.
    float band = fract((cell.x + cell.y) * 0.05 - uTime * 0.45);
    float sheen = smoothstep(0.0, 0.10, band) * (1.0 - smoothstep(0.10, 0.22, band));
    tinted += vec3(1.0, 0.99, 0.94) * sheen * 0.22;

    // Glow outside the silhouette: a neighbouring texel is the fish while this
    // one is empty. The difference is the rim, and it wears the same hue.
    float halo = 0.0;
    halo = max(halo, texture(uTexture, vTextureCoord + vec2(0.06, 0.0)).a);
    halo = max(halo, texture(uTexture, vTextureCoord - vec2(0.06, 0.0)).a);
    halo = max(halo, texture(uTexture, vTextureCoord + vec2(0.0, 0.06)).a);
    halo = max(halo, texture(uTexture, vTextureCoord - vec2(0.0, 0.06)).a);
    float aura = clamp(halo - alpha, 0.0, 1.0);
    vec3 glow = hsv2rgb(vec3(fract(hue + 0.12), 0.45, 1.0));

    vec3 outColor = mix(base, tinted, alpha * (1.0 - ink));
    outColor = mix(outColor, glow, aura * 0.5);
    float outAlpha = max(alpha, aura * 0.45);

    finalColor = vec4(clamp(outColor, 0.0, 1.0), clamp(outAlpha, 0.0, 1.0));
}
`

interface ShinyRuntime {
	uTime: number
}

export class ShinyShader {
	readonly filter: Filter
	private readonly runtime: ShinyRuntime

	constructor() {
		this.filter = Filter.from({
			gl: { vertex: VERTEX, fragment: FRAGMENT },
			resources: {
				shiny: {
					uTime: { value: 0, type: 'f32' as const }
				}
			}
		})
		// Pixel-crisp and untethered from the renderer's resolution scale, like the
		// pearl shader: the coat is made of whole art pixels, not of screen pixels.
		this.filter.resolution = 1
		this.filter.padding = 4
		this.filter.antialias = 'off'
		this.runtime = (
			this.filter.resources.shiny as unknown as {
				uniforms: ShinyRuntime
			}
		).uniforms
	}

	/** Advances the hue clock in seconds. Call only while the sprite is visible. */
	advance(dt: number): void {
		this.runtime.uTime = (this.runtime.uTime + dt) % 3600
	}

	/** Starts the coat from the same hue on every catch. */
	reset(): void {
		this.runtime.uTime = 0
	}

	destroy(): void {
		this.filter.destroy()
	}
}
