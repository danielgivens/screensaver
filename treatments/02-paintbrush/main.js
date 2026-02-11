import { getImageUrls, shuffle } from '../../src/images.js'

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
const SIZE          = () => Math.min(window.innerWidth, window.innerHeight) * 0.28
// How often to swap to the next image (ms)
const SWAP_INTERVAL = 800
// Speed in px/frame
const SPEED         = 1.8

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

// Swap to next image every SWAP_INTERVAL ms
setInterval(() => {
  if (pendingImg) {
    currentImg = pendingImg
    updateSize()
  }
  preloadNext()
}, SWAP_INTERVAL)

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
  } else if (x + hw > w) {
    x  = w - hw
    vx = -Math.abs(vx)
  }

  if (y - hh < 0) {
    y  = hh
    vy = Math.abs(vy)
  } else if (y + hh > h) {
    y  = h - hh
    vy = -Math.abs(vy)
  }

  // Draw — no clear, just stamp the image at current position
  if (currentImg.complete && currentImg.naturalWidth > 0) {
    ctx.drawImage(currentImg, x - hw, y - hh, pw, ph)
  }
}

tick()

// ─── Click to clear ──────────────────────────────────────────────────────────

window.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
})
