import { Application, Sprite, Assets } from 'pixi.js'
import { gsap } from 'gsap'
import { getImageUrls, shuffle } from '../../src/images.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SCALE_DURATION  = 0.5    // seconds for scale-in animation
const SPAWN_INTERVAL  = 0.13   // seconds between each spawn
const MAX_SPRITES     = 15     // hard cap on live sprites
const PRELOAD_AHEAD   = 3      // how many urls to preload in advance
const SIZE = () => Math.min(window.innerWidth, window.innerHeight)

// ─── Bootstrap ───────────────────────────────────────────────────────────────

;(async () => {

  const app = new Application()

  await app.init({
    resizeTo: window,
    background: '#000000',
    antialias: false,   // off = cheaper on mobile
  })

  app.canvas.style.position = 'fixed'
  app.canvas.style.top      = '0'
  app.canvas.style.left     = '0'
  document.body.appendChild(app.canvas)

  // ─── Image pool ────────────────────────────────────────────────────────────

  const allUrls = getImageUrls()

  // Preload first 50 in order so initial spawns are always ready
  const WARM_COUNT = 50
  await Assets.load(allUrls.slice(0, WARM_COUNT))

  // Use first 50 in order, then shuffle the rest
  let urls  = [...allUrls.slice(0, WARM_COUNT), ...shuffle(allUrls.slice(WARM_COUNT))]
  let index = 0
  const RECENT_SIZE = 20
  const recent      = []

  function nextUrl() {
    if (index >= urls.length) {
      index = 0
      urls  = shuffle(allUrls)
    }
    while (recent.includes(urls[index]) && index < urls.length) index++
    if (index >= urls.length) { index = 0; urls = shuffle(allUrls) }
    const url = urls[index++]
    recent.push(url)
    if (recent.length > RECENT_SIZE) recent.shift()
    return url
  }

  // Preload a small window of upcoming urls
  const queue = []
  function refillQueue() {
    while (queue.length < PRELOAD_AHEAD) {
      const url = nextUrl()
      queue.push(url)
      Assets.load(url)
    }
  }

  // Track which urls are currently in use so we know when to unload
  const inUse = new Map()  // url -> sprite count

  function acquire(url) {
    inUse.set(url, (inUse.get(url) ?? 0) + 1)
  }

  function release(url) {
    const n = (inUse.get(url) ?? 1) - 1
    if (n <= 0) {
      inUse.delete(url)
      Assets.unload(url)  // free GPU texture when no longer displayed
    } else {
      inUse.set(url, n)
    }
  }

  // ─── Spawn loop ──────────────────────────────────────────────────────────

  const sprites = []
  refillQueue()

  async function spawnNext() {
    refillQueue()

    const url     = queue.shift()
    const texture = await Assets.load(url)
    acquire(url)

    const sprite  = new Sprite(texture)
    sprite._srcUrl = url   // store so we can release it later

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

    const endScale = sprite.scale.x
    sprite.scale.set(0)

    // Nudge existing sprites back, cull tiny ones
    for (let i = sprites.length - 1; i >= 0; i--) {
      const s    = sprites[i]
      const next = s.scale.x * 0.96
      if (next < 0.33) {
        gsap.killTweensOf(s.scale)
        gsap.killTweensOf(s)
        app.stage.removeChild(s)
        release(s._srcUrl)
        s.destroy({ texture: false })
        sprites.splice(i, 1)
      } else {
        gsap.to(s.scale, { x: next, y: next, duration: SPAWN_INTERVAL, ease: 'sine.inOut', overwrite: true })
      }
    }

    app.stage.addChild(sprite)
    sprites.push(sprite)

    // Hard cap — destroy oldest
    while (sprites.length > MAX_SPRITES) {
      const old = sprites.shift()
      gsap.killTweensOf(old.scale)
      gsap.killTweensOf(old)
      app.stage.removeChild(old)
      release(old._srcUrl)
      old.destroy({ texture: false })
    }

    gsap.to(sprite.scale, { x: endScale, y: endScale, duration: SCALE_DURATION, ease: 'expo.out' })
    gsap.delayedCall(SPAWN_INTERVAL, spawnNext)
  }

  // Stage zoom
  app.stage.pivot.set(app.screen.width / 2, app.screen.height / 2)
  app.stage.position.set(app.screen.width / 2, app.screen.height / 2)
  gsap.to(app.stage.scale, { x: 0.6, y: 0.6, duration: 120, ease: 'none' })

  spawnNext()

  // ─── Click to clear ────────────────────────────────────────────────────────

  window.addEventListener('click', () => {
    sprites.forEach(s => {
      gsap.killTweensOf(s.scale)
      gsap.killTweensOf(s)
      app.stage.removeChild(s)
      release(s._srcUrl)
      s.destroy({ texture: false })
    })
    sprites.length = 0
    gsap.killTweensOf(app.stage.scale)
    app.stage.scale.set(1)
    gsap.to(app.stage.scale, { x: 0.6, y: 0.6, duration: 120, ease: 'none' })
  })

})()
