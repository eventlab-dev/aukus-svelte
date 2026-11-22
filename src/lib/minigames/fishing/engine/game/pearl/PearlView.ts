import { Container, Filter, Sprite, Texture } from 'pixi.js'
import { PEARL_EDGES, type PearlSpecimen } from '../../fish/pearls'

/**
 * One universal pearl shader.
 *
 * The shell of the design is a single pixel shader with three authored numbers
 * passed from code: the flaw (`uFloat`), the overtone seed (`uSeed`) and the
 * variety grade (`uTier`). `uTime` is render plumbing, not a pearl parameter.
 *
 * Band edges are injected from `PEARL_EDGES`, the same numbers `pearlBand()`
 * uses for the codex label, so the rule and the picture cannot drift apart.
 * The edges are widened by a couple of thousandths only to soften the cut.
 *
 * The sprites' one-pixel outline is off limits for all of it: the shader treats
 * those pixels as ink and leaves their authored colour alone (see `ink` in the
 * fragment source), so the contour stays black and square whatever the band.
 */
const EDGE_CHALKY = PEARL_EDGES.chalky.toFixed(3)
const EDGE_MATTE = PEARL_EDGES.matte.toFixed(3)
const EDGE_SATIN = PEARL_EDGES.satin.toFixed(3)
const EDGE_GLOSSY = PEARL_EDGES.glossy.toFixed(3)

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
uniform float uFloat;
uniform float uSeed;
uniform float uTier;

const float EDGE_CHALKY = ${EDGE_CHALKY};
const float EDGE_MATTE = ${EDGE_MATTE};
const float EDGE_SATIN = ${EDGE_SATIN};
const float EDGE_GLOSSY = ${EDGE_GLOSSY};

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

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main(void) {
    vec4 src = texture(uTexture, vTextureCoord);
    vec3 base = src.rgb;
    float alpha = src.a;
    float f = clamp(uFloat, 0.0, 1.0);
    float seed = clamp(uSeed, 0.0, 1.0);
    float tier = clamp(uTier, 1.0, 5.0);

    // Ink. Every pearl sprite is drawn with a one-pixel near-black outline, and
    // that ring is the contour of the pearl, not pearl material: an overtone, a
    // band or a sparkle that lands on it tints the contour grey and the pearl
    // loses its edge against the sunburst. The body factor is the part the
    // shader may touch; ink keeps its authored colour and stays fully opaque.
    // The empty cells of the sheet are black as well, hence the alpha gate —
    // those are light, not ink.
    float ink = (1.0 - smoothstep(0.05, 0.075, luma(src.rgb))) * step(0.5, alpha);
    float body = 1.0 - ink;

    // Overtone: the same seed shifts every variety, but a dark or coloured base
    // reads it as an overtone instead of a different pearl.
    float hueShift = (seed - 0.5) * 0.25;
    vec3 hsv = rgb2hsv(base);
    vec3 shifted = hsv2rgb(vec3(fract(hsv.x + hueShift), hsv.y, hsv.z));
    // Only the pearl itself is recoloured: transparent padding must stay clean,
    // otherwise a sweep or an overtone would draw a beam across the card.
    base = mix(base, shifted, 0.75 * alpha * body);

    // Band weights. The higher band wins exactly at an edge, like pearlBand().
    float wChalky = smoothstep(EDGE_CHALKY - 0.02, EDGE_CHALKY + 0.02, f);
    float matteEdge = smoothstep(EDGE_MATTE - 0.015, EDGE_MATTE + 0.015, f);
    float satinEdge = smoothstep(EDGE_SATIN - 0.008, EDGE_SATIN + 0.008, f);
    float glossyEdge = smoothstep(EDGE_GLOSSY - 0.004, EDGE_GLOSSY + 0.004, f);
    float wMatte = matteEdge * (1.0 - wChalky);
    float wSatin = satinEdge * (1.0 - matteEdge);
    float wGlossy = glossyEdge * (1.0 - satinEdge);
    float wMirror = 1.0 - glossyEdge;

    // Coarse art pixels for grain and sparkles: the sprite is 16 px, so a
    // 16/22-cell grid stays chunky instead of shimmering per screen pixel.
    vec2 block = floor(vTextureCoord * 22.0);
    vec2 fine = floor(vTextureCoord * 38.0);

    // --- chalky / defects ------------------------------------------------
    float grain = hash21(block + seed * 37.0) - 0.5;
    float scratch = step(0.965, hash21(vec2(fine.x * 0.4, fine.y)));
    vec3 chalky = mix(vec3(luma(base)), base, 0.45);
    chalky = mix(chalky, vec3(0.78, 0.76, 0.66), 0.22);
    chalky = (chalky - 0.5) * 0.72 + 0.5;
    chalky += grain * 0.14 + scratch * 0.10;
    base = mix(base, chalky, wChalky * alpha * body);

    // --- matte -----------------------------------------------------------
    vec3 matte = mix(vec3(luma(base)), base, 0.86);
    matte = (matte - 0.5) * 0.92 + 0.5;
    float specular = smoothstep(0.78, 0.95, luma(base));
    matte *= 1.0 - specular * 0.18;
    base = mix(base, matte, wMatte * alpha * body);

    // --- glossy / mirror sweep ------------------------------------------
    float speed = mix(0.42, 0.72, wMirror);
    float sweep = fract(uTime * speed);
    float sweepPos = -0.25 + sweep * 1.5;
    float sweepDist = abs(vTextureCoord.x + vTextureCoord.y - sweepPos);
    float sweepBand = 1.0 - smoothstep(0.0, 0.04, sweepDist);
    float sweepAmount = wGlossy * 0.38 + wMirror * 0.5;
    base += vec3(1.0, 0.98, 0.9) * sweepBand * sweepAmount * alpha * 0.8 * body;
    base = mix(base, base * 1.05, wGlossy * alpha * body);

    // --- iridescence -----------------------------------------------------
    float angle = vTextureCoord.x - vTextureCoord.y + uTime * 0.06 + seed;
    vec3 irid = hsv2rgb(vec3(fract(angle * 0.8 + 0.55), 0.55, 1.0));
    base += irid * (wMirror * 0.1 + max(0.0, tier - 3.0) * 0.015) * alpha * body;

    // --- mirror sparkles -------------------------------------------------
    float twinkle = step(0.982, hash21(block + floor(uTime * 5.0) + seed * 11.0));
    base += vec3(1.0, 0.98, 0.85) * twinkle * wMirror * step(0.4, alpha) * 0.7 * body;

    // --- aura for the flawless band --------------------------------------
    // Only the mirror band glows outside the silhouette. It is tied to the band
    // and not to the variety's grade: the aura is what "this one came out
    // flawless" looks like, and the flat 1 % roll of rollFlaw is what makes it
    // rare. One alpha step away from the contour keeps the rim on the ink ring's
    // outside at any sprite size, and the pale colour keeps it a glow rather
    // than a second outline.
    vec3 glowColor = mix(hsv2rgb(vec3(fract(0.55 + seed * 0.35), 0.45, 1.0)), vec3(1.0, 0.99, 0.94), 0.55);
    float halo = 0.0;
    halo = max(halo, texture(uTexture, vTextureCoord + vec2(0.045, 0.0)).a);
    halo = max(halo, texture(uTexture, vTextureCoord - vec2(0.045, 0.0)).a);
    halo = max(halo, texture(uTexture, vTextureCoord + vec2(0.0, 0.045)).a);
    halo = max(halo, texture(uTexture, vTextureCoord - vec2(0.0, 0.045)).a);
    float aura = clamp(halo - alpha, 0.0, 1.0) * wMirror;
    base = mix(base, glowColor, aura * 0.18);
    alpha = max(alpha, aura * 0.18);

    // --- shine class of the variety --------------------------------------
    // A rarer variety reads as a brighter body, never as a ring: the sprites
    // carry their own ink contour, so a halo around them would compete with it.
    // That is why the grade only lifts the luster, while the aura above belongs
    // to the flawless band. Grade 5 adds the iridescent tongues at the end.
    float luster = max(0.0, tier - 3.0) * 0.35;
    base = mix(base, clamp(base * 1.12 + 0.02, 0.0, 1.0), luster * alpha * body);

    float wave = sin(vTextureCoord.y * 9.0 - uTime * 1.2 + seed * 6.283);
    float tongue = smoothstep(0.55, 1.0, wave) * step(4.5, tier) * smoothstep(0.15, 0.85, vTextureCoord.y);
    base = mix(base, irid, tongue * alpha * 0.25 * body);

    finalColor = vec4(clamp(base, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`

interface PearlRuntime {
	uTime: number
	uFloat: number
	uSeed: number
	uTier: number
}

/**
 * A pearl sprite with its shader attached.
 *
 * Outside the silhouette only the flawless (mirror) band draws anything: a pale
 * rim one alpha step away from the ink ring, which reads as the aura of a
 * clean pearl rather than as a second contour. It deliberately does not use a
 * sprite mask: masking a filtered object smeared every texel and ate that
 * one-pixel contour, because the ink ring is exactly the pixel row the mask
 * edge falls on.
 *
 * The catch and the codex portrait share this view; each instance owns its
 * uniform group, so two visible pearls never fight over one set of numbers.
 */
export class PearlView extends Container {
	private readonly body: Sprite
	private readonly filter: Filter
	private readonly runtime: PearlRuntime

	constructor(texture: Texture) {
		super()
		this.eventMode = 'none'
		this.body = new Sprite(texture)
		this.body.anchor.set(0.5)
		this.body.eventMode = 'none'
		this.addChild(this.body)

		this.filter = Filter.from({
			gl: { vertex: VERTEX, fragment: FRAGMENT },
			resources: {
				pearl: {
					uTime: { value: 0, type: 'f32' as const },
					uFloat: { value: 0.12, type: 'f32' as const },
					uSeed: { value: 0.5, type: 'f32' as const },
					uTier: { value: 1, type: 'f32' as const }
				}
			}
		})
		this.filter.resolution = 1
		this.filter.padding = 6
		this.filter.antialias = 'off'
		this.body.filters = [this.filter]
		this.runtime = (
			this.filter.resources.pearl as unknown as {
				uniforms: PearlRuntime
			}
		).uniforms
	}

	/** Swap the base sprite, e.g. when the codex moves to another variety. */
	setTexture(texture: Texture): void {
		this.body.texture = texture
	}

	/** Point the shader at one specimen and restart its shine clock. */
	setPearl(specimen: PearlSpecimen, grade: number): void {
		this.runtime.uFloat = specimen.float
		this.runtime.uSeed = specimen.seed
		this.runtime.uTier = grade
		this.runtime.uTime = 0
	}

	/** Advance the shine clock. Called only while the pearl is visible. */
	advance(dt: number): void {
		this.runtime.uTime += dt
	}
}
