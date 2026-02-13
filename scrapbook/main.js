import { getImageUrls, shuffle } from '../src/images.js'

// ─── Canvas setup ────────────────────────────────────────────────────────────

const canvas = document.getElementById('canvas')
const ctx    = canvas.getContext('2d')

function resize() {
  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight
  // Resizing clears the canvas automatically — that's fine
}

resize()
window.addEventListener('resize', resize)

// ─── Config ──────────────────────────────────────────────────────────────────

const DROP_INTERVAL = 160

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function targetSize() {
  return Math.min(window.innerWidth, window.innerHeight) * 0.55
}

function minSize() {
  return Math.min(window.innerWidth, window.innerHeight) * 0.25
}

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

// Preload all images immediately — browser fetches in parallel
// so by the time the drop loop reaches them they're ready
allUrls.forEach(getImage)

// ─── Draw ────────────────────────────────────────────────────────────────────

let urls  = shuffle(allUrls)
let index = 0

function drawNext() {
  if (index >= urls.length) {
    index = 0
    urls  = shuffle(allUrls)
  }

  const img = getImage(urls[index++])

  const draw = (image) => {
    if (!image.naturalWidth || !image.naturalHeight) return
    const aspect  = image.naturalWidth / image.naturalHeight
    const longest = rand(minSize(), targetSize())
    const pw = aspect >= 1 ? longest : longest * aspect
    const ph = aspect >= 1 ? longest / aspect : longest

    const x   = rand(0, canvas.width)
    const y   = rand(0, canvas.height)
    const rot = rand(-15, 15) * (Math.PI / 180)

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.drawImage(image, -pw / 2, -ph / 2, pw, ph)
    ctx.restore()
  }

  if (img.complete && img.naturalWidth > 0) {
    draw(img)
  } else {
    img.onload = () => draw(img)
  }

  setTimeout(drawNext, DROP_INTERVAL + rand(-40, 80))
}

drawNext()

// ─── Click to clear ──────────────────────────────────────────────────────────

window.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  index = 0
  urls  = shuffle(allUrls)
})
