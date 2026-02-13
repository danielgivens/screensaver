import * as THREE from 'three'
import { getImageUrls, shuffle } from '../src/images.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SPHERE_RADIUS  = 10       // radius of the image sphere
const IMAGE_SIZE     = 3.2      // world units for the longest edge
const DRAG_SPEED     = 0.004    // radians per pixel dragged
const INERTIA        = 0.90     // momentum decay per frame
const AUTO_SPEED     = 0.0008   // radians per frame when idle
const ZOOM_SPEED     = 0.01     // radius change per scroll pixel
const ZOOM_MIN       = 0.5      // closest to centre
const ZOOM_MAX       = 9.5      // furthest from centre (just inside sphere)

// ─── Scene setup ─────────────────────────────────────────────────────────────

const canvas   = document.getElementById('canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x000000)

const scene  = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 0)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// ─── Image loading ───────────────────────────────────────────────────────────

const allUrls = shuffle(getImageUrls())
const loader  = new THREE.TextureLoader()

function loadTexture(url) {
  return new Promise(resolve => {
    loader.load(url, tex => {
      tex.colorSpace = THREE.SRGBColorSpace
      resolve(tex)
    })
  })
}

// ─── Fibonacci sphere distribution ───────────────────────────────────────────

// Evenly distributes N points on a sphere surface
function fibonacciSphere(n, radius) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y     = 1 - (i / (n - 1)) * 2
    const r     = Math.sqrt(1 - y * y)
    const theta = golden * i
    points.push(new THREE.Vector3(
      Math.cos(theta) * r * radius,
      y * radius,
      Math.sin(theta) * r * radius
    ))
  }
  return points
}

// ─── Build scene ─────────────────────────────────────────────────────────────

const meshes = []

async function buildScene() {
  const positions = fibonacciSphere(allUrls.length, SPHERE_RADIUS)
  const textures  = await Promise.all(allUrls.map(loadTexture))

  textures.forEach((tex, i) => {
    const aspect = tex.image.width / tex.image.height
    const pw = aspect >= 1 ? IMAGE_SIZE : IMAGE_SIZE * aspect
    const ph = aspect >= 1 ? IMAGE_SIZE / aspect : IMAGE_SIZE

    const geo = new THREE.PlaneGeometry(pw, ph)
    const mat = new THREE.MeshBasicMaterial({
      map:       tex,
      side:      THREE.FrontSide,
      transparent: true,
      alphaTest: 0.1,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(positions[i])
    scene.add(mesh)
    meshes.push(mesh)
  })
}

// ─── Camera rotation (spherical coords) ──────────────────────────────────────

let theta     = 0          // horizontal angle
let phi       = Math.PI/2  // vertical angle (start level)
let dTheta    = 0          // velocity
let dPhi      = 0
let camRadius = 0          // distance from centre (0 = dead centre)

function applyCameraRotation() {
  // Clamp phi so we don't flip over the poles
  phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi))
  // Look direction from centre outward
  const dir = new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  )
  // Camera sits at camRadius along that direction, always inside the sphere
  camera.position.copy(dir.clone().multiplyScalar(camRadius))
  camera.lookAt(dir.clone().multiplyScalar(camRadius + 1))
}

// ─── Drag input ───────────────────────────────────────────────────────────────

let dragging   = false
let lastX = 0, lastY = 0

function onPointerDown(e) {
  dragging = true
  lastX = e.clientX ?? e.touches[0].clientX
  lastY = e.clientY ?? e.touches[0].clientY
  document.body.classList.add('dragging')
}

function onPointerMove(e) {
  if (!dragging) return
  const x = e.clientX ?? e.touches[0].clientX
  const y = e.clientY ?? e.touches[0].clientY
  const dx = x - lastX
  const dy = y - lastY
  dTheta = -dx * DRAG_SPEED
  dPhi   = -dy * DRAG_SPEED
  theta += dTheta
  phi   += dPhi
  lastX = x
  lastY = y
}

function onPointerUp() {
  dragging = false
  document.body.classList.remove('dragging')
}

window.addEventListener('mousedown',  onPointerDown)
window.addEventListener('mousemove',  onPointerMove)
window.addEventListener('mouseup',    onPointerUp)
window.addEventListener('touchstart', e => onPointerDown(e.touches[0] ? e : e), { passive: true })
window.addEventListener('touchmove',  e => onPointerMove(e.touches[0] ? e : e), { passive: true })
window.addEventListener('touchend',   onPointerUp)

// ─── Zoom input ───────────────────────────────────────────────────────────────

window.addEventListener('wheel', e => {
  camRadius = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camRadius + e.deltaY * ZOOM_SPEED))
}, { passive: true })

let lastPinchDist = null
window.addEventListener('touchstart', e => {
  if (e.touches.length === 2) lastPinchDist = null
}, { passive: true })
window.addEventListener('touchmove', e => {
  if (e.touches.length !== 2) return
  const dx   = e.touches[0].clientX - e.touches[1].clientX
  const dy   = e.touches[0].clientY - e.touches[1].clientY
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (lastPinchDist !== null) {
    const delta = lastPinchDist - dist  // pinch in = positive = zoom in (move toward surface)
    camRadius = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camRadius + delta * ZOOM_SPEED * 2))
  }
  lastPinchDist = dist
}, { passive: true })
window.addEventListener('touchend', e => {
  if (e.touches.length < 2) lastPinchDist = null
})

// ─── Animation loop ───────────────────────────────────────────────────────────

function tick() {
  requestAnimationFrame(tick)

  // Apply inertia when not dragging, then auto-rotate when settled
  if (!dragging) {
    theta  += dTheta
    phi    += dPhi
    dTheta *= INERTIA
    dPhi   *= INERTIA
    // Once inertia fades, drift slowly on theta
    if (Math.abs(dTheta) < 0.0001 && Math.abs(dPhi) < 0.0001) {
      theta += AUTO_SPEED
    }
  }

  applyCameraRotation()

  // Billboard: each image faces the camera
  meshes.forEach(m => m.lookAt(camera.position))

  renderer.render(scene, camera)
}

// ─── Init ────────────────────────────────────────────────────────────────────

buildScene().then(() => {
  applyCameraRotation()
  tick()
  document.getElementById('loader').remove()
})
