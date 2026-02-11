import { getImageUrls, shuffle } from '../../src/images.js'

// ─── Canvas setup ────────────────────────────────────────────────────────────

const canvas = document.getElementById('canvas')
const ctx    = canvas.getContext('2d')

function resize() {
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
}

resize()
window.addEventListener('resize', resize)

// ─── Config ──────────────────────────────────────────────────────────────────

// How long each image takes to scale from 0 to full size (ms)
const SCALE_DURATION = 250
// How long each image stays at full size before the next one fires (ms)
const HOLD_DURATION  = 100
// Max size — longest edge fits the screen (constrained by both dimensions)
const SIZE = () => Math.min(window.innerWidth, window.innerHeight)

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

let urls    = shuffle(allUrls)
let index   = 0
const RECENT_SIZE = 40   // never repeat within the last N images
const recent      = []

function nextImage() {
  if (index >= urls.length) {
    index = 0
    urls  = shuffle(allUrls)
  }
  // Skip any image that appeared recently
  while (recent.includes(urls[index]) && index < urls.length) {
    index++
  }
  if (index >= urls.length) {
    index = 0
    urls  = shuffle(allUrls)
  }
  const url = urls[index++]
  recent.push(url)
  if (recent.length > RECENT_SIZE) recent.shift()
  return getImage(url)
}

// ─── Active particle ─────────────────────────────────────────────────────────

// Only one image on screen at a time — scale up, hold, then swap
let current = null   // { img, startTime, pw, ph }

function spawnNext() {
  const img = nextImage()

  const launch = (image) => {
    const aspect  = image.naturalWidth / image.naturalHeight
    const longest = SIZE()
    const pw = aspect >= 1 ? longest : longest * aspect
    const ph = aspect >= 1 ? longest / aspect : longest

    // Small random rotation (-12 to +12 deg) and offset from center
    const angle  = (Math.random() - 0.5) * 24 * (Math.PI / 180)
    const offX   = (Math.random() - 0.5) * canvas.width  * 0.12
    const offY   = (Math.random() - 0.5) * canvas.height * 0.12

    current = { img: image, startTime: performance.now(), pw, ph, angle, offX, offY }

    // Schedule next image after scale + hold
    setTimeout(spawnNext, SCALE_DURATION + HOLD_DURATION)
  }

  if (img.complete && img.naturalWidth > 0) {
    launch(img)
  } else {
    img.addEventListener('load', () => launch(img), { once: true })
  }
}

spawnNext()

// ─── Easing ──────────────────────────────────────────────────────────────────

// Ease out — fast start, decelerates to full size
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// ─── Animation loop ──────────────────────────────────────────────────────────

function tick() {
  requestAnimationFrame(tick)

  if (!current) return

  const cx = canvas.width  / 2
  const cy = canvas.height / 2

  const elapsed = performance.now() - current.startTime
  const t       = Math.min(elapsed / SCALE_DURATION, 1)
  const scale   = 0.88 + easeOutExpo(t) * 0.12

  const pw = current.pw * scale
  const ph = current.ph * scale

  ctx.save()
  ctx.translate(cx + current.offX, cy + current.offY)
  ctx.rotate(current.angle)
  ctx.drawImage(current.img, -pw / 2, -ph / 2, pw, ph)
  ctx.restore()
}

tick()

// ─── Click to clear ──────────────────────────────────────────────────────────

window.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
})
