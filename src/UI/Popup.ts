import {Container, Graphics, Text, TextStyle} from 'pixi.js'
import {gsap} from 'gsap'


export class Popup {
  container = new Container()

  private background = new Graphics()
  private label = new Text({
    text: '',
    style: new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0x2b2b2b,
      wordWrap: true,
      wordWrapWidth: 560,
    }),
  })

  private autoCloseTimeout?: number
  private autoCloseDelayMs: number = 3000
  private isOpen: boolean = false
  private timeline!: gsap.core.Timeline

  private screenWidth: number = 0
  private screenHeight: number = 0

  private paddingX: number = 28
  private paddingY: number = 18
  private radius: number = 18
  private bottomOffset: number = 14
  private maxWidth: number = 640

  constructor() {
    this.container.eventMode = 'static'
    this.container.interactiveChildren = true

    this.container.addChild(this.background)
    this.container.addChild(this.label)

    this.label.anchor.set(0.5)

    this.container.visible = false
    this.container.alpha = 0

    this.timeline = gsap.timeline({paused: true})
  }

  resize(screenW: number, screenH: number) {
    this.screenWidth = screenW
    this.screenHeight = screenH

    const wrap = Math.min(this.maxWidth - this.paddingX * 2, Math.floor(screenW * 0.86))
    this.label.style.wordWrapWidth = wrap

    this.layout()

    if (this.isOpen) {
      this.container.x = Math.floor(this.screenWidth * 0.5)
      this.container.y = this.getOpenY()
    } else {
      this.placeClosed()
    }
  }

  open(text: string) {
    this.setText(text)

    if (this.isOpen) {
      this.layout()
      this.container.x = Math.floor(this.screenWidth * 0.5)
      this.container.y = this.getOpenY()

      if (this.autoCloseTimeout) clearTimeout(this.autoCloseTimeout)
      this.autoCloseTimeout = window.setTimeout(() => this.close(), 3000)
      return
    }

    this.isOpen = true
    this.container.visible = true

    this.layout()

    this.timeline.clear()
    this.placeClosed()

    this.timeline
      .to(this.container, {alpha: 1, duration: 0.18, ease: 'power2.out'}, 0)
      .to(this.container, {y: this.getOpenY(), duration: 0.35, ease: 'back.out(1.35)'}, 0)

    this.timeline.play(0)

    if (this.autoCloseTimeout) clearTimeout(this.autoCloseTimeout)
    this.autoCloseTimeout = window.setTimeout(() => this.close(), this.autoCloseDelayMs)
  }

  close() {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout)
      this.autoCloseTimeout = undefined
    }

    if (!this.isOpen) return
    this.isOpen = false

    this.timeline.clear()

    this.timeline
      .to(this.container, {y: this.getClosedY(), duration: 0.28, ease: 'power2.in'}, 0)
      .to(this.container, {
        alpha: 0,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: () => {
          this.container.visible = false
        },
      }, 0.05)

    this.timeline.play(0)
  }

  setText(text: string) {
    this.label.text = text
  }

  private layout() {
    const width = Math.min(this.maxWidth, Math.floor(this.screenWidth * 0.9))
    this.label.style.wordWrapWidth = Math.min(this.label.style.wordWrapWidth, width - this.paddingX * 2)

    const textWidth = Math.ceil(this.label.width)
    const textHeight = Math.ceil(this.label.height)

    const backgroundWidth = Math.max(220, textWidth + this.paddingX * 2)
    const backgroundHeight = Math.max(86, textHeight + this.paddingY * 2)

    const x = Math.floor(this.screenWidth * 0.5)
    const y = this.isOpen ? this.getOpenY() : this.getClosedY()

    this.container.x = x
    this.container.y = y

    this.background.clear()
    this.background.roundRect(-backgroundWidth / 2, -backgroundHeight / 2, backgroundWidth, backgroundHeight, this.radius)
    this.background.fill({color: 0xffffff, alpha: 1})

    this.label.x = 0
    this.label.y = 0
  }

  private getOpenY() {
    const halfHeight = this.background.height / 2
    return Math.floor(this.screenHeight - this.bottomOffset - halfHeight)
  }

  private getClosedY() {
    const halfHeight = this.background.height / 2
    return Math.floor(this.screenHeight + halfHeight + 30)
  }

  private placeClosed() {
    this.container.x = Math.floor(this.screenWidth * 0.5)
    this.container.y = this.getClosedY()
    this.container.alpha = 0
  }
}
