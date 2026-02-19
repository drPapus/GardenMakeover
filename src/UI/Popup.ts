import {Container, Graphics, Text, TextStyle} from 'pixi.js'
import {gsap} from 'gsap'

import {Game} from '../Core/Game'


export class Popup {
  private game: Game
  container = new Container()

  private backgroundGraphics = new Graphics()
  private textLabel = new Text({
    text: '',
    style: new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fill: '#2b2b2b',
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
  private popupWidth: number = 0
  private popupHeight: number = 0


  private paddingX: number = 20
  private paddingY: number = 10
  private cornerRadius: number = 18
  private bottomMargin: number = 14
  private maxPopupWidth: number = 640

  constructor() {
    this.game = Game.getInstance()
    this.container.eventMode = 'none'
    this.container.interactiveChildren = false

    this.container.addChild(this.backgroundGraphics)
    this.container.addChild(this.textLabel)

    this.textLabel.anchor.set(0.5)

    this.container.visible = false
    this.container.alpha = 0

    this.timeline = gsap.timeline({paused: true})
  }

  resize() {
    const {width, height} = this.game.ui.application.screen

    this.screenWidth = width
    this.screenHeight = height

    this.textLabel.style.wordWrapWidth = Math.min(this.maxPopupWidth - this.paddingX * 2, Math.floor(width * 0.86))

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
      this.autoCloseTimeout = window.setTimeout(() => this.close(), this.autoCloseDelayMs)
      return
    }

    this.isOpen = true
    this.container.visible = true

    this.layout()

    this.timeline.clear()
    this.placeClosed()

    this.container.scale.set(0.95)

    this.timeline
      .to(this.container, {
        alpha: 1,
        duration: 0.18,
        ease: 'power2.out',
      }, 0)
      .to(this.container, {
        y: this.getOpenY(),
        scale: 1,
        duration: 0.35,
        ease: 'back.out(1.4)',
      }, 0)

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

  private setText(text: string) {
    this.textLabel.text = text
  }

  private layout() {
    const width = Math.min(this.maxPopupWidth, Math.floor(this.screenWidth * 0.9))
    this.textLabel.style.wordWrapWidth = Math.min(this.textLabel.style.wordWrapWidth, width - this.paddingX * 2)

    const textWidth = Math.ceil(this.textLabel.width)
    const textHeight = Math.ceil(this.textLabel.height)

    this.popupWidth = Math.max(220, textWidth + this.paddingX * 2)
    this.popupHeight = Math.max(60, textHeight + this.paddingY * 2)

    const x = Math.floor(this.screenWidth * 0.5)
    const y = this.isOpen ? this.getOpenY() : this.getClosedY()

    this.container.x = x
    this.container.y = y

    this.backgroundGraphics.clear()
    this.backgroundGraphics.roundRect(-this.popupWidth / 2, -this.popupHeight / 2, this.popupWidth, this.popupHeight, this.cornerRadius)
    this.backgroundGraphics.fill({color: 0xfff4e3, alpha: 1})
    this.backgroundGraphics.stroke({width: 5, color: 0xd4a86a})

    this.textLabel.x = 0
    this.textLabel.y = 0
  }

  private getOpenY() {
    const halfHeight = this.popupHeight / 2
    return Math.floor(this.screenHeight - this.bottomMargin - halfHeight)
  }

  private getClosedY() {
    const halfHeight = this.popupHeight / 2
    return Math.floor(this.screenHeight + halfHeight + 30)
  }


  private placeClosed() {
    this.container.x = Math.floor(this.screenWidth * 0.5)
    this.container.y = this.getClosedY()
    this.container.alpha = 0
  }
}
