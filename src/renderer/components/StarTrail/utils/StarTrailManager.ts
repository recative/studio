import React from 'react';

const maxStars = 20;

enum StarStatus {
  generating = 0,
  living = 1,
  killing = 2,
}

class Star {
  drawSpeed = Math.PI / 20;

  baseAngle = 0;

  trackRadiusFactor = 0;

  runSpeed = 0;

  traceLength = 0;

  lifetime = 0;

  generatedLength = 0;

  killedLength = 0;

  animationDamping = 0.01;

  accumulatedGeneratingTime = 0;

  accumulatedLivingTime = 0;

  accumulatedKillingTime = 0;

  status = StarStatus.generating;

  constructor(
    private context: CanvasRenderingContext2D,
    private color = 'red',
    private stokeWidth = 4
  ) {
    this.reset();
  }

  reset = () => {
    this.trackRadiusFactor = Math.random();
    this.baseAngle = Star.randomRange(0, Math.PI * 2);
    this.runSpeed = Star.randomRange(Math.PI / 600, Math.PI / 1200);
    this.traceLength = Star.randomRange(Math.PI / 3, Math.PI * 1.5);
    this.lifetime = Star.randomRange(10, 100);
    this.generatedLength = 0;
    this.killedLength = 0;
    this.accumulatedGeneratingTime = 0;
    this.accumulatedLivingTime = 0;
    this.accumulatedKillingTime = 0;
    this.status = StarStatus.generating;
  };

  static randomRange = (a = 0, b = a) => {
    const max = Math.max(a, b);
    const min = Math.min(a, b);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  draw = () => {
    const w = this.context.canvas.width;
    const h = this.context.canvas.height;

    const radius = Math.min(w, h);

    const centerX = w / 2;
    const centerY = h / 2;

    this.context.beginPath();
    this.context.strokeStyle = this.color;
    this.context.lineWidth = this.stokeWidth;

    let drawingBase = this.baseAngle;
    let startAngle = 0;
    let endAngle = 0;

    if (this.status === StarStatus.generating) {
      startAngle = drawingBase + this.accumulatedGeneratingTime * this.runSpeed;
      this.generatedLength +=
        (this.traceLength - this.generatedLength) *
        this.animationDamping *
        this.accumulatedGeneratingTime;
      endAngle = startAngle + this.generatedLength;

      this.accumulatedGeneratingTime += 1;

      if (this.generatedLength >= this.traceLength) {
        endAngle = startAngle + this.traceLength;
        this.status = StarStatus.living;
      }
    } else if (this.status === StarStatus.living) {
      drawingBase += this.accumulatedGeneratingTime * this.runSpeed;
      startAngle = drawingBase + this.accumulatedLivingTime * this.runSpeed;
      endAngle = startAngle + this.traceLength;

      this.accumulatedLivingTime += 1;

      if (this.accumulatedLivingTime >= this.lifetime) {
        this.status = StarStatus.killing;
      }
    } else if (this.status === StarStatus.killing) {
      drawingBase +=
        (this.accumulatedGeneratingTime + this.accumulatedLivingTime) *
        this.runSpeed;

      this.killedLength +=
        (this.traceLength - this.killedLength) *
        this.animationDamping *
        this.accumulatedKillingTime;

      startAngle =
        drawingBase +
        this.accumulatedKillingTime * this.runSpeed +
        this.killedLength;
      endAngle = startAngle + this.traceLength - this.killedLength;

      this.accumulatedKillingTime += 1;

      if (endAngle - startAngle <= 0) {
        this.reset();
        return;
      }
    }

    this.context.arc(
      centerX,
      centerY,
      radius * this.trackRadiusFactor,
      startAngle,
      endAngle
    );
    this.context.stroke();
    this.context.closePath();
  };
}

export class StarTrailManager {
  $canvas: HTMLCanvasElement | null = null;

  private context: CanvasRenderingContext2D | null = null;

  private stars: Star[] = [];

  protected playing = false;

  constructor(private color = 'red', private stokeWidth = 4) {}

  syncCanvasSize = () => {
    if (!this.$canvas) return;

    const { width, height } = this.$canvas.getBoundingClientRect();

    const ratio = window.devicePixelRatio;

    const trueWidth = width * ratio;
    const trueHeight = height * ratio;

    if (
      trueWidth !== this.$canvas.width ||
      trueHeight !== this.$canvas.height
    ) {
      this.$canvas.width = trueWidth;
      this.$canvas.height = trueHeight;
    }
  };

  setupCanvas = ($canvas: HTMLCanvasElement) => {
    if ($canvas === this.$canvas) return;

    this.$canvas = $canvas;
    this.context = $canvas.getContext('2d');

    this.$canvas.style.cssText +=
      'width: 100% !important; height:100% !important';
    this.$canvas.style.pointerEvents = 'none';

    this.syncCanvasSize();

    this.stars = [];

    if (!this.context) {
      throw new TypeError(`Context not found`);
    }

    for (let i = 0; i < maxStars; i += 1) {
      this.stars.push(new Star(this.context, this.color, this.stokeWidth));
    }
  };

  syncClear = () => {
    if (!this.$canvas) return;
    if (!this.context) return;

    this.context.clearRect(
      0,
      0,
      this.$canvas.width * window.devicePixelRatio,
      this.$canvas.height * window.devicePixelRatio
    );
  };

  tick = () => {
    if (!this.$canvas) return;
    if (!this.context) return;

    this.context.clearRect(0, 0, this.$canvas.width, this.$canvas.height);

    for (let i = 0; i < this.stars.length; i += 1) {
      this.stars[i].draw();
    }

    if (this.playing) {
      window.requestAnimationFrame(this.tick);
    }
  };

  play = () => {
    if (this.playing) return;

    this.playing = true;
    this.tick();
  };

  stop = () => {
    this.playing = false;
  };
}
