import { Filter } from 'pixi.js'

/**
 * The platinum coat of a completed codex well.
 *
 * It is applied to the **slot**, not to the fish: the plate is what turns
 * platinum, so this filter never touches the sprite of the species. That is also
 * what keeps it out of the rainbow's way — a platinum species is always shiny
 * (`fish/platinum.ts`), and its fish keeps the full rainbow while the well under
 * it gets a cold, slow mirror sheen, a narrow reflection and a little frost
 * dust. Two additive effects on the same 16 px sprite would have fought for the
 * same pixels; two surfaces — the plate and the fish — do not.
 *
 * The shader works in the well's own art pixels, so the shimmer steps with the
 * plate instead of with the screen resolution, and the plate's bevel and the
 * catch tally (a sibling drawn above the plate) stay exactly as authored.
 *
 * The filter owns nothing but its clock. Attach
 * {@link PlatinumShader.filter} to the well's Graphics, call
 * {@link PlatinumShader.advance} while the tab is visible, and
 * {@link PlatinumShader.destroy} with it.
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
uniform vec2 uSize;
uniform float uTime;

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main(void) {
    vec4 src = texture(uTexture, vTextureCoord);
    vec3 base = src.rgb;
    float cover = src.a;

    // The well's own art pixels: the plate is 58×41 virtual pixels, and the
    // shimmer has to step with them rather than with the screen.
    vec2 px = vTextureCoord * uSize;
    vec2 cell = floor(px);

    // A cold cast: the plate leans to ice as the eye travels down it.
    float depth = clamp(vTextureCoord.y, 0.0, 1.0);
    vec3 ice = mix(vec3(0.86, 0.91, 1.0), vec3(0.76, 0.84, 1.0), depth);
    vec3 outColor = mix(base, ice, 0.12 * cover);

    // Mirror bands along the diagonal: one broad reflection and a narrow one
    // riding its crest. Slower than the fish's rainbow, so the well reads as a
    // still surface the fish swims in, not as a second coat.
    float wave = 0.5 + 0.5 * sin((cell.x + cell.y) * 0.045 - uTime * 0.22);
    float broad = pow(wave, 5.0);
    float mirror = pow(wave, 22.0);
    outColor += vec3(0.90, 0.95, 1.0) * broad * 0.08 * cover;
    outColor += vec3(0.97, 0.99, 1.0) * mirror * 0.20 * cover;

    // Frost dust: sparse one-pixel glints on a fixed grid, each on its own slow
    // phase, so the plate sparkles without pulsing as a whole.
    vec2 star = floor(px / 3.0);
    float seed = hash21(star);
    vec2 center = star * 3.0 + 1.5;
    float distance = length(px - center);
    float twinkle = pow(max(0.0, sin(uTime * 0.9 + seed * 6.28318)), 14.0);
    float dust = (1.0 - smoothstep(0.35, 1.0, distance)) * step(0.93, seed) * twinkle;
    outColor += vec3(0.97, 0.99, 1.0) * dust * 0.35 * cover;

    finalColor = vec4(clamp(outColor, 0.0, 1.0), cover);
}
`

interface PlatinumRuntime {
	uSize: Float32Array
	uTime: number
}

export class PlatinumShader {
	readonly filter: Filter
	private readonly runtime: PlatinumRuntime

	/**
	 * @param width Well width in virtual pixels — the shader quantises its
	 * shimmer to that grid.
	 * @param height Well height in virtual pixels.
	 */
	constructor(width: number, height: number) {
		this.filter = Filter.from({
			gl: { vertex: VERTEX, fragment: FRAGMENT },
			resources: {
				platinum: {
					uSize: { value: new Float32Array([width, height]), type: 'vec2<f32>' as const },
					uTime: { value: 0, type: 'f32' as const }
				}
			}
		})
		// No padding: the plate already covers the whole well, and the shader must
		// not paint over the neighbouring cells.
		this.filter.resolution = 1
		this.filter.padding = 0
		this.filter.antialias = 'off'
		this.runtime = (
			this.filter.resources.platinum as unknown as {
				uniforms: PlatinumRuntime
			}
		).uniforms
	}

	/** Advances the plate clock in seconds. Call only while the tab is visible. */
	advance(dt: number): void {
		this.runtime.uTime = (this.runtime.uTime + dt) % 3600
	}

	destroy(): void {
		this.filter.destroy()
	}
}
