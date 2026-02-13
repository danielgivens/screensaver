import { getImageUrls, shuffle } from '../src/images.js'

// ─── Canvas setup ────────────────────────────────────────────────────────────

const canvas = document.getElementById('canvas')
const ctx    = canvas.getContext('2d')

function resize() {
  // Resizing clears the canvas — bounce state is preserved so it continues
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
}

resize()
window.addEventListener('resize', resize)

// ─── Config ──────────────────────────────────────────────────────────────────

// Image display size — longest edge as fraction of shortest screen dimension
const SIZE  = () => Math.min(window.innerWidth, window.innerHeight) * 0.28
// Speed in px/frame
const SPEED = 2.2

// ─── Image pool ──────────────────────────────────────────────────────────────

const allUrls    = getImageUrls()
const imageCache = {}

function getImage(url) {
  if (!imageCache[url]) {
    const img = new Image()
    img.src = url
    imageCache[url] = img
  }
  return imageCache[url]
}

allUrls.forEach(getImage)

let urls  = shuffle(allUrls)
let index = 0

function nextImage() {
  if (index >= urls.length) {
    index = 0
    urls  = shuffle(allUrls)
  }
  return getImage(urls[index++])
}

// ─── Bouncing object ─────────────────────────────────────────────────────────

let currentImg = nextImage()
let pendingImg = null   // preloaded next image

// Re-compute size once the first image finishes loading
if (!currentImg.complete) {
  currentImg.addEventListener('load', () => {
    updateSize()
    opacity = 1
  }, { once: true })
}

// Position & velocity
let x  = Math.random() * window.innerWidth
let y  = Math.random() * window.innerHeight
let vx = SPEED * (Math.random() < 0.5 ? 1 : -1)
let vy = SPEED * (Math.random() < 0.5 ? 1 : -1)

// Current rendered size (set once image loads)
let pw = 0
let ph = 0

function getSize(img) {
  if (!img.complete || img.naturalWidth === 0) return { pw: 200, ph: 200 }
  const aspect  = img.naturalWidth / img.naturalHeight
  const longest = SIZE()
  return aspect >= 1
    ? { pw: longest, ph: longest / aspect }
    : { pw: longest * aspect, ph: longest }
}

function updateSize() {
  const s = getSize(currentImg)
  pw = s.pw
  ph = s.ph
}

updateSize()

// Preload the next image in the background
function preloadNext() {
  pendingImg = nextImage()
}

preloadNext()

// Fade state — ramps from 0 to 1 after each swap
let opacity     = 0
const FADE_STEP  = 0.018  // per frame, ~700ms dissolve on swap
const TRAIL_FADE = 0.004  // opacity of black rect painted each frame — controls trail length

function swapImage() {
  if (pendingImg) {
    currentImg = pendingImg
    updateSize()
    opacity = 0
  }
  preloadNext()
}

// ─── Animation loop ──────────────────────────────────────────────────────────

function tick() {
  requestAnimationFrame(tick)

  const w = canvas.width
  const h = canvas.height

  // Update position
  x += vx
  y += vy

  // Bounce off edges (using half-dimensions so image stays fully on screen)
  const hw = pw / 2
  const hh = ph / 2

  if (x - hw < 0) {
    x  = hw
    vx = Math.abs(vx)
    swapImage()
  } else if (x + hw > w) {
    x  = w - hw
    vx = -Math.abs(vx)
    swapImage()
  }

  if (y - hh < 0) {
    y  = hh
    vy = Math.abs(vy)
    swapImage()
  } else if (y + hh > h) {
    y  = h - hh
    vy = -Math.abs(vy)
    swapImage()
  }

  // Slowly darken the whole canvas each frame — older stamps fade to black
  ctx.globalAlpha = TRAIL_FADE
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalAlpha = 1

  // Draw current image with fade-in on swap
  if (currentImg.complete && currentImg.naturalWidth > 0) {
    opacity = Math.min(1, opacity + FADE_STEP)
    ctx.globalAlpha = opacity
    ctx.drawImage(currentImg, x - hw, y - hh, pw, ph)
    ctx.globalAlpha = 1
  }
}

tick()

// ─── Click to clear ──────────────────────────────────────────────────────────

window.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
})
