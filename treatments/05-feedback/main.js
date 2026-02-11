import * as THREE from 'three'
import { getImageUrls, shuffle } from '../../src/images.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SWAP_INTERVAL    = 1000   // ms between image swaps
const SCALE            = 0.994  // feedback zoom per pass — closer to 1 = slower zoom
const PASSES_PER_FRAME = 14     // feedback+stamp passes per animation frame — more = finer echoes

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



// ─── Feedback (post-FX) scene ─────────────────────────────────────────────────

const postFXScene = new THREE.Scene()
let postFXMesh

const postFXMat = new THREE.ShaderMaterial({
  uniforms: {
    sampler:  { value: null },
    scale:    { value: SCALE },
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
    varying vec2 v_uv;

    void main () {
      vec2 uv = (v_uv - vec2(0.5)) * scale + vec2(0.5);
      vec4 inputColor = texture2D(sampler, uv);
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
