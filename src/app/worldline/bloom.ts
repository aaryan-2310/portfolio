import * as pc from 'playcanvas';

const SAMPLE_COUNT = 15;

function computeGaussian(n: number, theta: number): number {
  return (1.0 / Math.sqrt(2 * Math.PI * theta)) * Math.exp(-(n * n) / (2 * theta * theta));
}

function calculateBlurValues(
  sampleWeights: Float32Array, sampleOffsets: Float32Array,
  dx: number, dy: number, blurAmount: number,
): void {
  sampleWeights[0] = computeGaussian(0, blurAmount);
  sampleOffsets[0] = 0;
  sampleOffsets[1] = 0;
  let totalWeights = sampleWeights[0];

  const len = Math.floor(SAMPLE_COUNT / 2);
  for (let i = 0; i < len; i++) {
    const weight = computeGaussian(i + 1, blurAmount);
    sampleWeights[i * 2] = weight;
    sampleWeights[i * 2 + 1] = weight;
    totalWeights += weight * 2;

    // Bilinear-filtered taps step two texels at a time — half the samples for the same spread.
    const sampleOffset = i * 2 + 1.5;
    sampleOffsets[i * 4] = dx * sampleOffset;
    sampleOffsets[i * 4 + 1] = dy * sampleOffset;
    sampleOffsets[i * 4 + 2] = -dx * sampleOffset;
    sampleOffsets[i * 4 + 3] = -dy * sampleOffset;
  }
  for (let i = 0; i < sampleWeights.length; i++) sampleWeights[i] /= totalWeights;
}

const attributes = { aPosition: pc.SEMANTIC_POSITION };

const extractFrag = `
  varying vec2 vUv0;
  uniform sampler2D uBaseTexture;
  uniform float uBloomThreshold;
  void main(void) {
    vec4 color = texture2D(uBaseTexture, vUv0);
    gl_FragColor = clamp((color - uBloomThreshold) / (1.0 - uBloomThreshold), 0.0, 1.0);
  }
`;

const gaussianBlurFrag = `
  #define SAMPLE_COUNT ${SAMPLE_COUNT}
  varying vec2 vUv0;
  uniform sampler2D uBloomTexture;
  uniform vec2 uBlurOffsets[${SAMPLE_COUNT}];
  uniform float uBlurWeights[${SAMPLE_COUNT}];
  void main(void) {
    vec4 color = vec4(0.0);
    for (int i = 0; i < SAMPLE_COUNT; i++) {
      color += texture2D(uBloomTexture, vUv0 + uBlurOffsets[i]) * uBlurWeights[i];
    }
    gl_FragColor = color;
  }
`;

const combineFrag = `
  varying vec2 vUv0;
  uniform float uBloomEffectIntensity;
  uniform sampler2D uBaseTexture;
  uniform sampler2D uBloomTexture;
  void main(void) {
    vec4 bloom = texture2D(uBloomTexture, vUv0) * uBloomEffectIntensity;
    vec4 base = texture2D(uBaseTexture, vUv0);
    base *= (1.0 - clamp(bloom, 0.0, 1.0));
    gl_FragColor = base + bloom;
  }
`;

/**
 * Manual postEffects-chain bloom (extract → blur x2 → combine). PlayCanvas 2.x has no
 * standalone `BloomEffect` postEffect class — real bloom now lives inside `CameraFrame`'s
 * render-pass graph, which is mutually exclusive with the manual postEffects used for GR
 * lensing here. This ports the engine's own reference posteffect-bloom implementation
 * (node_modules/playcanvas/scripts/posteffects/posteffect-bloom.js) so it can run in the
 * same postEffects chain as the lensing pass.
 */
export class BloomEffect extends pc.PostEffect {
  bloomThreshold = 0.25;
  blurAmount = 4;
  bloomIntensity = 1.25;

  private readonly extractShader: pc.Shader;
  private readonly blurShader: pc.Shader;
  private readonly combineShader: pc.Shader;
  private targets: pc.RenderTarget[] = [];
  private width = 0;
  private height = 0;
  private readonly sampleWeights = new Float32Array(SAMPLE_COUNT);
  private readonly sampleOffsets = new Float32Array(SAMPLE_COUNT * 2);

  constructor(graphicsDevice: pc.GraphicsDevice) {
    super(graphicsDevice);
    const vertexGLSL = pc.PostEffect.quadVertexShader;
    this.extractShader = pc.ShaderUtils.createShader(graphicsDevice, {
      uniqueName: 'BloomExtractShader', attributes, vertexGLSL, fragmentGLSL: extractFrag,
    });
    this.blurShader = pc.ShaderUtils.createShader(graphicsDevice, {
      uniqueName: 'BloomBlurShader', attributes, vertexGLSL, fragmentGLSL: gaussianBlurFrag,
    });
    this.combineShader = pc.ShaderUtils.createShader(graphicsDevice, {
      uniqueName: 'BloomCombineShader', attributes, vertexGLSL, fragmentGLSL: combineFrag,
    });
  }

  destroy(): void {
    for (const t of this.targets) { t.destroyTextureBuffers(); t.destroy(); }
    this.targets.length = 0;
  }

  private resize(target: pc.RenderTarget): void {
    const width = target.colorBuffer.width;
    const height = target.colorBuffer.height;
    if (width === this.width && height === this.height) return;
    this.width = width; this.height = height;
    this.destroy();
    for (let i = 0; i < 2; i++) {
      const colorBuffer = new pc.Texture(this.device, {
        name: `pe-bloom-${i}`, format: pc.PIXELFORMAT_RGBA8,
        width: width >> 1, height: height >> 1, mipmaps: false,
      });
      colorBuffer.minFilter = pc.FILTER_LINEAR;
      colorBuffer.magFilter = pc.FILTER_LINEAR;
      colorBuffer.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
      colorBuffer.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
      this.targets.push(new pc.RenderTarget({ colorBuffer, depth: false }));
    }
  }

  override render(inputTarget: pc.RenderTarget, outputTarget: pc.RenderTarget, rect?: pc.Vec4): void {
    this.resize(inputTarget);
    const scope = this.device.scope;

    // Pass 1: extract only the brightest areas of the (already-lensed) scene.
    scope.resolve('uBloomThreshold').setValue(this.bloomThreshold);
    scope.resolve('uBaseTexture').setValue(inputTarget.colorBuffer);
    this.drawQuad(this.targets[0], this.extractShader);

    // Pass 2: horizontal gaussian blur.
    calculateBlurValues(this.sampleWeights, this.sampleOffsets, 1.0 / this.targets[1].width, 0, this.blurAmount);
    scope.resolve('uBlurWeights[0]').setValue(this.sampleWeights);
    scope.resolve('uBlurOffsets[0]').setValue(this.sampleOffsets);
    scope.resolve('uBloomTexture').setValue(this.targets[0].colorBuffer);
    this.drawQuad(this.targets[1], this.blurShader);

    // Pass 3: vertical gaussian blur.
    calculateBlurValues(this.sampleWeights, this.sampleOffsets, 0, 1.0 / this.targets[0].height, this.blurAmount);
    scope.resolve('uBlurWeights[0]').setValue(this.sampleWeights);
    scope.resolve('uBlurOffsets[0]').setValue(this.sampleOffsets);
    scope.resolve('uBloomTexture').setValue(this.targets[1].colorBuffer);
    this.drawQuad(this.targets[0], this.blurShader);

    // Pass 4: combine the blurred bright-pass back over the original scene.
    scope.resolve('uBloomEffectIntensity').setValue(this.bloomIntensity);
    scope.resolve('uBloomTexture').setValue(this.targets[0].colorBuffer);
    scope.resolve('uBaseTexture').setValue(inputTarget.colorBuffer);
    this.drawQuad(outputTarget, this.combineShader, rect);
  }
}
