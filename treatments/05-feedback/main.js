import * as THREE from 'three'
import { getImageUrls, shuffle } from '../../src/images.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SWAP_INTERVAL    = 3500   // ms between image swaps
const SCALE            = 0.992  // feedback zoom per pass — closer to 1 = slower zoom
const TWIST_MAX        = 0.0008 // peak twist magnitude in radians per pass
const PASSES_PER_FRAME = 14     // feedback+stamp passes per animation frame — more = finer echoes
const TWIST_DRIFT      = 0.000004 // how fast the twist creeps per frame

// ─── Renderer ────────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio || 1)
renderer.autoClearColor = false
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  orthoCamera.left   = -window.innerWidth  / 2
  orthoCamera.right  =  window.innerWidth  / 2
  orthoCamera.top    =  window.innerHeight / 2
  orthoCamera.bottom = -window.innerHeight / 2
  orthoCamera.updateProjectionMatrix()
  postFXMesh.geometry.dispose()
  postFXMesh.geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight)
})

// ─── Render targets ──────────────────────────────────────────────────────────

const w = window.innerWidth  * (window.devicePixelRatio || 1)
const h = window.innerHeight * (window.devicePixelRatio || 1)
let renderBufferA = new THREE.WebGLRenderTarget(w, h)
let renderBufferB = new THREE.WebGLRenderTarget(w, h)

// ─── Camera ──────────────────────────────────────────────────────────────────

const orthoCamera = new THREE.OrthographicCamera(
  -window.innerWidth  / 2,
   window.innerWidth  / 2,
   window.innerHeight / 2,
  -window.innerHeight / 2,
  0.1, 10
)
orthoCamera.position.set(0, 0, 1)
orthoCamera.lookAt(new THREE.Vector3(0, 0, 0))

// ─── Image scene ─────────────────────────────────────────────────────────────

const imageScene = new THREE.Scene()
const imageMat   = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05 })
const imageMesh  = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), imageMat)
imageScene.add(imageMesh)

// Twist drifts continuously — direction flips on each swap
let twistSign = Math.random() < 0.5 ? 1 : -1

function randomTwist() {
  twistSign = Math.random() < 0.5 ? 1 : -1
}


// ─── Feedback (post-FX) scene ─────────────────────────────────────────────────

const postFXScene = new THREE.Scene()
let postFXMesh

const postFXMat = new THREE.ShaderMaterial({
  uniforms: {
    sampler:  { value: null },
    scale:    { value: SCALE },
    twist:    { value: TWIST_MAX * twistSign },
  },
  vertexShader: `
    varying vec2 v_uv;
    void main () {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      v_uv = uv;
    }
  `,
  fragmentShader: `
    uniform sampler2D sampler;
    uniform float scale;
    uniform float twist;
    varying vec2 v_uv;

    vec2 cartesianToPolar(vec2 p) {
      float angle = atan(p.y, p.x);
      float radius = length(p);
      return vec2(angle, radius);
    }

    void main () {
      vec2 polarUV = cartesianToPolar(v_uv - vec2(0.5, 0.5));
      polarUV.y *= scale;
      polarUV.x += twist;
      vec2 scaledUV = vec2(cos(polarUV.x), sin(polarUV.x)) * polarUV.y + vec2(0.5, 0.5);
      vec4 inputColor = texture2D(sampler, scaledUV);
      gl_FragColor = vec4(inputColor.rgb * 0.999, 1.0);
    }
  `,
})

postFXMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(window.innerWidth, window.innerHeight),
  postFXMat
)
postFXScene.add(postFXMesh)


// ─── Image pool ───────────────────────────────────────────────────────────────

const allUrls    = getImageUrls()
const loader     = new THREE.TextureLoader()
let urls         = shuffle(allUrls)
let index        = 0

function nextUrl() {
  if (index >= urls.length) { index = 0; urls = shuffle(allUrls) }
  return urls[index++]
}

let pendingTexture = null

function preloadNext() {
  loader.load(nextUrl(), tex => {
    tex.colorSpace = THREE.SRGBColorSpace
    pendingTexture = tex
  })
}

// Load first image immediately, start loop once ready
loader.load(nextUrl(), tex => {
  tex.colorSpace = THREE.SRGBColorSpace
  swapToTexture(tex)
  preloadNext()
  setInterval(swapImage, SWAP_INTERVAL)
  renderer.setAnimationLoop(onAnimLoop)
})

function swapToTexture(tex) {
  if (imageMat.map) imageMat.map.dispose()
  imageMat.map = tex

  // Resize plane to match image aspect
  const aspect = tex.image.width / tex.image.height
  const longest = Math.min(window.innerWidth, window.innerHeight) * 0.55
  const pw = aspect >= 1 ? longest : longest * aspect
  const ph = aspect >= 1 ? longest / aspect : longest
  imageMesh.geometry.dispose()
  imageMesh.geometry = new THREE.PlaneGeometry(pw, ph)
  imageMat.needsUpdate = true

  // Flip twist direction for this image
  randomTwist()
}

function swapImage() {
  if (pendingTexture) {
    swapToTexture(pendingTexture)
    pendingTexture = null
  }
  preloadNext()
}

// ─── Render loop ─────────────────────────────────────────────────────────────

function onAnimLoop() {
  // Slowly drift the twist each frame, reversing at the limits
  const next = postFXMat.uniforms.twist.value + TWIST_DRIFT * twistSign
  if (next > TWIST_MAX || next < -TWIST_MAX) twistSign *= -1
  postFXMat.uniforms.twist.value = next

  // Run multiple feedback passes per frame for finer echo spacing
  for (let i = 0; i < PASSES_PER_FRAME; i++) {
    // 1. Feedback pass into bufferA (scaled previous frame from bufferB)
    renderer.setRenderTarget(renderBufferA)
    postFXMat.uniforms.sampler.value = renderBufferB.texture
    renderer.render(postFXScene, orthoCamera)

    // 2. Stamp current image on top (first pass only — keeps it at full brightness)
    if (i === 0) renderer.render(imageScene, orthoCamera)

    // Ping-pong
    const temp = renderBufferA
    renderBufferA = renderBufferB
    renderBufferB = temp
  }

  // 3. Output final buffer to screen
  renderer.setRenderTarget(null)
  postFXMat.uniforms.sampler.value = renderBufferB.texture
  renderer.render(postFXScene, orthoCamera)

  // 4. Composite the live image on top at full brightness
  renderer.render(imageScene, orthoCamera)
}
