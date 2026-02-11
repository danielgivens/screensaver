import { Application, Sprite, Assets } from 'pixi.js'
import { gsap } from 'gsap'
import { getImageUrls, shuffle } from '../../src/images.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SCALE_DURATION = 0.5    // seconds for scale-in animation
const SPAWN_INTERVAL = 0.18   // seconds between each spawn (overlaps with scale-in)
const SIZE = () => Math.min(window.innerWidth, window.innerHeight)

// ─── Bootstrap ───────────────────────────────────────────────────────────────

;(async () => {

  const app = new Application()

  await app.init({
    resizeTo: window,
    background: '#000000',
    antialias: true,
  })

  app.canvas.style.position = 'fixed'
  app.canvas.style.top      = '0'
  app.canvas.style.left     = '0'
  document.body.appendChild(app.canvas)

  // ─── Image pool ────────────────────────────────────────────────────────────

  const allUrls = getImageUrls()

  // Load first 20 immediately, rest in background
  await Assets.load(allUrls.slice(0, 20))
  allUrls.slice(20).forEach(url => Assets.load(url))

  let urls    = shuffle(allUrls)
  let index   = 0
  const RECENT_SIZE = 40
  const recent      = []

  function nextUrl() {
    if (index >= urls.length) { index = 0; urls = shuffle(allUrls) }
    while (recent.includes(urls[index]) && index < urls.length) index++
    if (index >= urls.length) { index = 0; urls = shuffle(allUrls) }
    const url = urls[index++]
    recent.push(url)
    if (recent.length > RECENT_SIZE) recent.shift()
    return url
  }

  // ─── Spawn loop ──────────────────────────────────────────────────────────

  const sprites = []

  async function spawnNext() {
    const url     = nextUrl()
    const texture = await Assets.load(url)
    const sprite  = new Sprite(texture)

    // Fit longest edge to SIZE()
    const longest = SIZE()
    const aspect  = texture.width / texture.height
    if (aspect >= 1) {
      sprite.width  = longest
      sprite.height = longest / aspect
    } else {
      sprite.width  = longest * aspect
      sprite.height = longest
    }

    sprite.anchor.set(0.5)
    sprite.x        = app.screen.width  / 2
    sprite.y        = app.screen.height / 2
    sprite.rotation = 0
    sprite.alpha    = 1

    // Start from 0, animate to full size
    const endScale = sprite.scale.x
    sprite.scale.set(0)

    // Nudge all existing sprites back, remove ones that have shrunk to nothing
    for (let i = sprites.length - 1; i >= 0; i--) {
      const s = sprites[i]
      const next = s.scale.x * 0.96
      if (next < 0.02) {
        gsap.killTweensOf(s)
        app.stage.removeChild(s)
        s.destroy()
        sprites.splice(i, 1)
      } else {
        gsap.to(s.scale, { x: next, y: next, duration: SPAWN_INTERVAL, ease: 'sine.inOut', overwrite: true })
      }
    }

    app.stage.addChild(sprite)
    sprites.push(sprite)

    gsap.to(sprite.scale, { x: endScale, y: endScale, duration: SCALE_DURATION, ease: 'expo.out' })

    gsap.delayedCall(SPAWN_INTERVAL, spawnNext)
  }

  // Slowly zoom the entire stage out over time — one cheap tween, gives depth illusion
  app.stage.pivot.set(app.screen.width / 2, app.screen.height / 2)
  app.stage.position.set(app.screen.width / 2, app.screen.height / 2)
  gsap.to(app.stage.scale, {
    x: 0.6, y: 0.6,
    duration: 120,
    ease: 'none',
  })

  spawnNext()

  // ─── Click to clear ────────────────────────────────────────────────────────

  window.addEventListener('click', () => {
    sprites.forEach(s => {
      gsap.killTweensOf(s)
      app.stage.removeChild(s)
      s.destroy()
    })
    sprites.length = 0
    gsap.killTweensOf(app.stage.scale)
    app.stage.scale.set(1)
    gsap.to(app.stage.scale, { x: 0.6, y: 0.6, duration: 120, ease: 'none' })
  })

})()
