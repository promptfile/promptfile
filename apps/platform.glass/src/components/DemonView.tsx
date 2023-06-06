import React from 'react'

// https://dev.to/christiankastner/integrating-p5-js-with-react-i0d
// https://codepen.io/robertoryan/pen/poZKjGa
export class DemonView extends React.PureComponent {
  myRef: any
  myP5: any

  constructor(props: any) {
    super(props)
    this.myRef = React.createRef()
  }

  Sketch = (p5: any) => {
    const canvasSize = Math.min(Math.max(window.innerHeight, window.innerWidth), 1000)
    const center = 0.5 * canvasSize
    const particleCount = 750
    const hueBase = 233
    const hueRange = 40

    const fadeInOut = (t: any, m: any) => {
      let hm = 0.5 * m
      return p5.abs(((t + hm) % m) - hm) / hm
    }

    const angle = (x1: any, y1: any, x2: any, y2: any) => p5.atan2(y2 - y1, x2 - x1)

    let buffer: any = null
    let particles: any = null
    let dOffset: any = null
    let dOffset2: any = null

    function resetParticle(foo?: any, i?: any) {
      let x, y, vx, vy, d, s, w, h, l, ttl

      x = center + p5.random(-150, 150)
      y = center + p5.random(-150, 150)
      d = angle(x, y, center, center) - p5.QUARTER_PI
      h = (hueBase + p5.random(hueRange)) % 360
      s = p5.random(3, 6)
      w = p5.random(1, 4)
      vx = p5.cos(d) * s
      vy = p5.sin(d) * s
      l = 0
      ttl = p5.random(200, 400)

      return [x, y, vx, vy, d, s, w, h, l, ttl]
    }

    function createParticles() {
      p5.noiseSeed(p5.random(2048))
      particles = new AttributeArray(particleCount, ['x', 'y', 'vx', 'vy', 'd', 's', 'w', 'h', 'l', 'ttl'])
      particles.map(resetParticle)
      particles.map(([x, y, vx, vy, d, s, w, h, l, ttl]: any) => {
        l = p5.random(300, 600)

        return [x, y, vx, vy, d, s, w, h, l, ttl]
      })
    }

    function drawParticles() {
      let dl, a, t, tx, ty

      buffer.noFill()

      particles.map(([x, y, vx, vy, d, s, w, h, l, ttl]: any, i: number) => {
        if (l >= ttl) return resetParticle()

        dl = fadeInOut(l, ttl)
        a = 0.65 * dl
        d =
          angle(x, y, center, center) +
          (dOffset - p5.noise(x * 0.005, y * 0.005, p5.frameCount * 0.005) * dOffset2) * 0.25 -
          p5.QUARTER_PI
        s *= 1.0015
        vx = p5.lerp(vx, p5.cos(d) * s, 0.035)
        vy = p5.lerp(vy, p5.sin(d) * s, 0.035)
        tx = x + vx
        ty = y + vy
        l++

        buffer.strokeWeight(5 * w * (p5.dist(x, y, center, center) / canvasSize) + 1)
        buffer.stroke(h, 100, 100, a)
        buffer.line(x, y, tx, ty)

        return [tx, ty, vx, vy, d, s, w, h, l, ttl]
      })
    }

    function drawImage() {
      p5.push()
      p5.drawingContext.globalCompositeOperation = 'lighter'
      p5.image(buffer, 0, 0)
      p5.pop()
    }

    function drawGlow() {
      p5.push()
      p5.drawingContext.filter = 'blur(16px) brightness(200%)'
      p5.image(buffer, 0, 0)
      p5.pop()
    }

    p5.setup = () => {
      const c = p5.createCanvas(canvasSize, canvasSize)

      c.addClass('canvas')
      c.mouseClicked(() => p5.noiseSeed(p5.random(2048)))

      buffer = p5.createGraphics(canvasSize, canvasSize)
      buffer.colorMode(p5.HSB)

      dOffset = 2 * p5.TAU
      dOffset2 = 2 * dOffset

      p5.noiseDetail(10, 0.5)
      createParticles()
    }

    p5.draw = () => {
      try {
        buffer.background(0, 0, 0, 0.65)
        drawParticles()
        drawGlow()
        drawImage()
      } catch (e) {
        console.error(e)
        p5.noLoop()
      }
    }
  }

  componentDidMount() {
    const p5 = require('p5')
    this.myP5 = new p5(this.Sketch, this.myRef.current)
  }
  componentWillUnmount(): void {
    this.myP5.remove()
  }

  render() {
    return <div ref={this.myRef}></div>
  }
}

class AttributeArray {
  spread: any
  values: any

  constructor(private count: any, private attrs: any) {
    this.spread = attrs.length
    this.values = new Float32Array(count * this.spread)
  }

  get length() {
    return this.values.length
  }

  set(a: any, i: any, normalize = false) {
    normalize && (i *= this.spread)

    this.values.set(a, i)
  }

  get(i: any, normalize = false) {
    normalize && (i *= this.spread)

    return this.values.slice(i, i + this.spread)
  }

  forEach(cb: any) {
    let i = 0
    let j = 0

    for (; i < this.length; i += this.spread, j++) {
      cb(this.get(i), j, this)
    }
  }

  map(cb: any) {
    let i = 0
    let j = 0

    for (; i < this.length; i += this.spread, j++) {
      this.set(cb(this.get(i), j, this), i)
    }
  }

  reverseMap(cb: any) {
    let i = this.length - this.spread
    let j = this.count - 1

    for (; i >= 0; i -= this.spread, j--) {
      this.set(cb(this.get(i), j, this), i)
    }
  }
}
