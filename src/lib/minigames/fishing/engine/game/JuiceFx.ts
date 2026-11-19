import { Filter, Rectangle, type Container } from 'pixi.js'
import { VIEW } from '../config'

export type JuiceKind = 'cast' | 'bite' | 'hook' | 'counter' | 'catch' | 'ready' | 'escape'

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
uniform float uAberration;
uniform float uRipple;
uniform vec2 uRippleCenter;
uniform float uBloom;
uniform vec2 uPixel;
uniform float uAspect;
uniform float uShakeX;
uniform float uShakeY;
uniform float uShakeZoom;
uniform float uShakeRot;

void main(void) {
    vec2 uv = vTextureCoord;

    // Circular ripple around the bobber. The offset is intentionally small:
    // this is a water wobble, not a screen warp.
    //
    // The halo cuts the offset to exactly zero past the float's own water ring.
    // Without it the exponential never reaches zero, so the whole playfield —
    // the angler, the boat, the bank trees — kept oscillating a fraction of a
    // pixel for the length of the effect, and on hard pixel-art edges that
    // read as every sprite twitching at once.
    vec2 delta = (uv - uRippleCenter) * vec2(uAspect, 1.0);
    float dist = length(delta);
    float halo = 1.0 - smoothstep(0.10, 0.22, dist);
    float wave = sin(dist * 52.0 - uTime * 11.0) * uRipple * exp(-dist * 7.0);
    uv += (dist > 0.0001 ? delta / dist : vec2(0.0)) * wave * 0.0035 * halo;

    // Camera bump. Sampling the whole playfield a pixel or two off-centre moves
    // the world without moving the frame, so the letterbox never shows a gap.
    // The zoom is the price of that: the sampled rectangle is pulled in by the
    // same amount the frame is pushed, so a bumped sample never lands in the
    // filter texture's transparent border.
    //
    // The tilt is rotated in pixel space (the aspect is applied before the
    // rotation and undone after it), so the frame leans like a camera instead
    // of shearing sideways.
    vec2 bumped = (uv - vec2(0.5)) * uShakeZoom * vec2(uAspect, 1.0);
    float bumpCos = cos(uShakeRot);
    float bumpSin = sin(uShakeRot);
    bumped = vec2(
        bumped.x * bumpCos - bumped.y * bumpSin,
        bumped.x * bumpSin + bumped.y * bumpCos
    );
    uv = vec2(0.5) + bumped / vec2(uAspect, 1.0) + vec2(uShakeX, uShakeY);

    // Edge-biased chromatic aberration for impacts.
    vec2 ca = (uv - 0.5) * uAberration * 0.004;
    vec3 color;
    color.r = texture(uTexture, uv + ca).r;
    color.g = texture(uTexture, uv).g;
    color.b = texture(uTexture, uv - ca).b;

    // Cheap selective bloom: only warm, bright pixels bleed. This picks up
    // gold rings, the lantern and caught fish without washing out the HUD.
    vec2 p = uPixel * 2.0;
    vec3 bloom = vec3(0.0);
    bloom += texture(uTexture, uv + vec2(p.x, 0.0)).rgb;
    bloom += texture(uTexture, uv + vec2(-p.x, 0.0)).rgb;
    bloom += texture(uTexture, uv + vec2(0.0, p.y)).rgb;
    bloom += texture(uTexture, uv + vec2(0.0, -p.y)).rgb;
    bloom += texture(uTexture, uv + vec2(p.x, p.y)).rgb;
    bloom += texture(uTexture, uv + vec2(-p.x, p.y)).rgb;
    bloom += texture(uTexture, uv + vec2(p.x, -p.y)).rgb;
    bloom += texture(uTexture, uv + vec2(-p.x, -p.y)).rgb;
    bloom *= 0.125;

    float lum = max(bloom.r, max(bloom.g, bloom.b));
    float warm = smoothstep(0.4, 0.9, bloom.r)
        * smoothstep(0.25, 0.8, bloom.g)
        * (1.0 - smoothstep(0.35, 0.8, bloom.b));
    color += bloom * warm * smoothstep(0.3, 0.95, lum)
        * uBloom * vec3(1.0, 0.8, 0.35);

    finalColor = vec4(clamp(color, 0.0, 1.0), texture(uTexture, vTextureCoord).a);
}
`

const uniforms = {
	uTime: { value: 0, type: 'f32' as const },
	uAberration: { value: 0, type: 'f32' as const },
	uRipple: { value: 0, type: 'f32' as const },
	uRippleCenter: {
		value: new Float32Array([0.5, 0.5]),
		type: 'vec2<f32>' as const
	},
	uBloom: { value: 0, type: 'f32' as const },
	uPixel: {
		value: new Float32Array([1 / VIEW.width, 1 / VIEW.height]),
		type: 'vec2<f32>' as const
	},
	uAspect: { value: VIEW.width / VIEW.height, type: 'f32' as const },
	uShakeX: { value: 0, type: 'f32' as const },
	uShakeY: { value: 0, type: 'f32' as const },
	uShakeZoom: { value: 1, type: 'f32' as const },
	uShakeRot: { value: 0, type: 'f32' as const }
}

interface RuntimeUniforms {
	uTime: number
	uAberration: number
	uRipple: number
	uRippleCenter: Float32Array
	uBloom: number
	uShakeX: number
	uShakeY: number
	uShakeZoom: number
	uShakeRot: number
}

/**
 * Camera bump when the fish takes the hook.
 *
 * It used to be a 0.34 s rattle with 2.4 full swings inside it, which at 60 fps
 * is a new direction every third frame — that is what read as "twitchy". The
 * bump is now one long lean and a settle: half a second, barely more than one
 * swing, with the travel easing in over the first fifth of it instead of
 * starting at full speed. Bigger, slower, softer.
 */
const SHAKE_SECONDS = 0.5
/** Peak travel of the bump, in scene pixels. Small enough to stay cosy. */
const SHAKE_AMPLITUDE = 2.6
/** Swings the camera makes before it comes to rest. */
const SHAKE_CYCLES = 1.15
/** Share of the bump spent easing the camera into motion. */
const SHAKE_ATTACK = 0.2
/** Vertical travel relative to horizontal: the strike comes from above. */
const SHAKE_VERTICAL = 0.6
/** Peak tilt in radians (about 0.35°), which is what sells it as a camera. */
const SHAKE_ROTATION = 0.006

/**
 * One cheap post-process pass for gameplay juice. The HUD and floaters live
 * outside the filtered playfield, so text never gets chromatic aberration.
 */
export class JuiceFx {
	readonly filter: Filter
	private readonly runtime: RuntimeUniforms
	private target: Container | null = null
	private attached = false

	private aberration = 0
	private ripple = 0
	private bloom = 0
	private active = false
	/** Seconds left in the current camera bump; 0 when the camera is still. */
	private shakeLeft = 0
	/** How hard the current bump hits, 1 = the plain take of the bait. */
	private shakeStrength = 1
	/** Direction of the bump, so a second hook does not repeat the same wobble. */
	private shakeDirX = 1
	private shakeDirY = 1

	constructor() {
		this.filter = Filter.from({
			gl: { vertex: VERTEX, fragment: FRAGMENT },
			resources: { juice: uniforms }
		})
		this.filter.resolution = 1
		this.filter.padding = 2
		this.filter.enabled = false
		this.runtime = (
			this.filter.resources.juice as unknown as {
				uniforms: RuntimeUniforms
			}
		).uniforms
	}

	attachTo(playfield: Container): void {
		this.target = playfield
		playfield.filterArea = new Rectangle(0, 0, VIEW.width, VIEW.height)
	}

	/**
	 * @param power Scales the camera bump. The take of the bait is the reference
	 * knock (1); the strike that sets the hook passes the fish's own weight, so a
	 * legendary fish rattles the frame harder than a minnow.
	 */
	trigger(kind: JuiceKind, x = VIEW.width / 2, y = VIEW.height / 2, power = 1): void {
		this.runtime.uRippleCenter[0] = x / VIEW.width
		this.runtime.uRippleCenter[1] = y / VIEW.height

		let aberration = 0
		let ripple = 0
		let bloom = 0

		switch (kind) {
			case 'cast':
				ripple = 0.5
				aberration = 0.06
				bloom = 0.08
				break
			case 'bite':
				// The fish has taken the bait: the float goes under and the camera
				// answers it. This is the moment of the catch, not the strike.
				aberration = 0.12
				ripple = 0.3
				bloom = 0.1
				break
			case 'hook':
				aberration = 0.45
				ripple = 0.25
				bloom = 0.22
				break
			case 'counter':
				aberration = 0.6
				ripple = 0.1
				bloom = 0.14
				break
			case 'catch':
				aberration = 0.35
				ripple = 0.2
				bloom = 0.75
				break
			case 'ready':
				bloom = 0.35
				break
			case 'escape':
				aberration = 0.2
				ripple = 0.35
				break
		}

		this.aberration = Math.max(this.aberration, aberration)
		this.ripple = Math.max(this.ripple, ripple)
		this.bloom = Math.max(this.bloom, bloom)

		// The take of the bait knocks the camera, and so does the strike that sets
		// the hook — the strike is the player's own move, but it is the moment the
		// weight on the other end answers, so the knock scales with the fish. The
		// counter and the landing stay still: shaking on those turns the soft
		// wobble into a rattle.
		if (kind === 'bite' || kind === 'hook') {
			this.shakeLeft = SHAKE_SECONDS
			this.shakeStrength = Math.max(kind === 'bite' ? 1 : 0, power)
			this.shakeDirX = Math.random() > 0.5 ? 1 : -1
			this.shakeDirY = Math.random() > 0.5 ? 1 : -1
		}

		this.active = true
		this.filter.enabled = true
		if (!this.attached && this.target) {
			this.target.filters = [this.filter]
			this.attached = true
		}
		this.sync()
	}

	update(dt: number): void {
		this.runtime.uTime += dt
		// Before the early-out: the bump has to be cleared even on the frame the
		// whole pass switches itself off, or the last zoom would stick.
		this.updateShake(dt)
		if (!this.active) return

		this.aberration = Math.max(0, this.aberration - dt * 3.0)
		this.ripple = Math.max(0, this.ripple - dt * 1.8)
		this.bloom = Math.max(0, this.bloom - dt * 2.2)
		this.sync()

		this.active =
			this.aberration > 0.001 || this.ripple > 0.001 || this.bloom > 0.001 || this.shakeLeft > 0
		if (!this.active) {
			this.filter.enabled = false
			if (this.attached && this.target) {
				this.target.filters = []
				this.attached = false
			}
		}
	}

	/**
	 * One long lean and a settle, not a jitter.
	 *
	 * The camera eases into motion over {@link SHAKE_ATTACK} of the bump, swings
	 * once towards the strike, then comes back through the middle and decays with
	 * the square of the remaining time. A whole swing is spread over half a
	 * second, so the frame never changes direction between two neighbouring
	 * frames — that reversal was the "twitchiness".
	 */
	private updateShake(dt: number): void {
		if (this.shakeLeft <= 0) {
			this.runtime.uShakeX = 0
			this.runtime.uShakeY = 0
			this.runtime.uShakeZoom = 1
			this.runtime.uShakeRot = 0
			return
		}
		this.shakeLeft = Math.max(0, this.shakeLeft - dt)
		const t = 1 - this.shakeLeft / SHAKE_SECONDS

		// Smoothstep-like attack: the first frames cover a fraction of a pixel.
		const attack = Math.min(1, t / SHAKE_ATTACK)
		const settle = (1 - t) * (1 - t)
		const envelope = attack * settle

		// The strength of the knock travels with the fish: the same curve, driven
		// further, so a legendary strike is the take of the bait blown up rather
		// than a different, faster rattle.
		const strength = this.shakeStrength
		const amplitude = SHAKE_AMPLITUDE * strength
		const rotation = SHAKE_ROTATION * strength

		const swing = Math.sin(t * Math.PI * 2 * SHAKE_CYCLES)
		const x = swing * amplitude * envelope * this.shakeDirX
		const y = swing * amplitude * SHAKE_VERTICAL * envelope * this.shakeDirY
		const rot = swing * rotation * envelope * this.shakeDirX

		const u = x / VIEW.width
		const v = y / VIEW.height
		this.runtime.uShakeX = u
		this.runtime.uShakeY = v
		this.runtime.uShakeRot = rot
		// Pull the sampled rectangle in by the whole travel the frame can make, so
		// a bumped or tilted sample never lands on the texture's transparent border.
		// The margin follows a slower envelope than the travel itself, so the zoom
		// never runs out of headroom on the way back.
		const margin = 2.6 * (amplitude / VIEW.width) + 3 * rotation * 0.6
		this.runtime.uShakeZoom = 1 - margin * attack * (1 - t)
	}

	private sync(): void {
		this.runtime.uAberration = this.aberration
		this.runtime.uRipple = this.ripple
		this.runtime.uBloom = this.bloom
	}
}
