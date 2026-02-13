import * as THREE from 'three'
import { getImageUrls, shuffle } from '../src/images.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SWAP_INTERVAL    = 1000   // ms between image swaps
const SCALE            = 0.994  // feedback zoom per pass — closer to 1 = slower zoom
const PASSES_PER_FRAME = 6      // feedback+stamp passes per animation frame — more = finer echoes
const OUTLINE_SIZE     = 5      // outline thickness in pixels
const OUTLINE_COLOR    = new THREE.Color(1, 1, 1)  // outline colour

// ─── Renderer ────────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio || 1)
renderer.autoClearColor = false
renderer.setClearColor(0xffffff)
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

// Outline mesh — rendered behind the image, slightly larger, solid colour where alpha > 0
const outlineMat = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    map:         { value: null },
    outlineColor: { value: OUTLINE_COLOR },
    texelSize:   { value: new THREE.Vector2(1, 1) },
    thickness:   { value: OUTLINE_SIZE },
  },
  vertexShader: `
    varying vec2 v_uv;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      v_uv = uv;
    }
  `,
  fragmentShader: `
    uniform sampler2D map;
    uniform vec3 outlineColor;
    uniform vec2 texelSize;
    uniform float thickness;
    varying vec2 v_uv;
    void main() {
      // Sample alpha at current pixel and neighbours to detect edge
      float a = texture2D(map, v_uv).a;
      float t = thickness;
      float n  = texture2D(map, v_uv + vec2(0.0,  t) * texelSize).a;
      float s  = texture2D(map, v_uv + vec2(0.0, -t) * texelSize).a;
      float e  = texture2D(map, v_uv + vec2( t, 0.0) * texelSize).a;
      float w  = texture2D(map, v_uv + vec2(-t, 0.0) * texelSize).a;
      float ne = texture2D(map, v_uv + vec2( t,  t)  * texelSize).a;
      float nw = texture2D(map, v_uv + vec2(-t,  t)  * texelSize).a;
      float se = texture2D(map, v_uv + vec2( t, -t)  * texelSize).a;
      float sw = texture2D(map, v_uv + vec2(-t, -t)  * texelSize).a;
      float maxNeighbour = max(max(max(n, s), max(e, w)), max(max(ne, nw), max(se, sw)));
      // Outline = where we have no alpha but a neighbour does
      float outline = (1.0 - step(0.05, a)) * step(0.05, maxNeighbour);
      gl_FragColor = vec4(outlineColor, outline);
    }
  `,
})
const outlineMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), outlineMat)
outlineMesh.position.z = -0.01
imageScene.add(outlineMesh)

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
      // Return white for any sample outside the buffer bounds
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
      }
      vec4 inputColor = texture2D(sampler, uv);
      // Fade toward white instead of black
      gl_FragColor = vec4(inputColor.rgb + (1.0 - inputColor.rgb) * 0.001, 1.0);
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

  // Update outline mesh to match
  outlineMesh.geometry.dispose()
  outlineMesh.geometry = new THREE.PlaneGeometry(pw, ph)
  outlineMat.uniforms.map.value = tex
  outlineMat.uniforms.texelSize.value.set(1 / tex.image.width, 1 / tex.image.height)
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
