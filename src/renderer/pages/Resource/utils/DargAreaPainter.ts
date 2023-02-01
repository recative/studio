export class DragAreaPainter {
  $canvas = document.createElement('canvas');

  $originalTarget: HTMLDivElement;

  context = this.$canvas.getContext('2d')!;

  constructor(
    public selecto: {
      target: { parentNode: ParentNode | null; style: { cssText: string } };
    },
    public containerSelector: string
  ) {
    if (!(selecto.target instanceof HTMLDivElement)) {
      throw new TypeError(`Invalid hack target`);
    }

    this.$originalTarget = selecto.target;

    this.$canvas.style.cssText +=
      'width: 100% !important; height:100% !important';
    this.$canvas.style.position = 'fixed';
    this.$canvas.style.top = '0';
    this.$canvas.style.left = '0';
    this.$canvas.style.pointerEvents = 'none';
    this.$canvas.style.zIndex = '10';

    const $container = document.querySelector(
      this.containerSelector
    ) as HTMLDivElement;

    if (!$container) {
      throw new TypeError(`Container not found`);
    }

    $container.appendChild(this.$canvas);

    selecto.target = this;
  }

  get parentNode() {
    return this.$originalTarget.parentNode;
  }

  private styleSet = new Map<string, string>();

  style = new Proxy(
    { cssText: '' },
    {
      get: (_, prop) => {
        if (prop === 'cssText') {
          return '';
        }

        return undefined;
      },
      set: (_, prop, newValue) => {
        if (prop !== 'cssText') {
          return undefined;
        }

        this.updateCssText(newValue);

        return newValue;
      },
    }
  );

  updateCssText = (x: string) => {
    const rules = x.split(';').map((n) => n.trim());

    let syncPosition = false;
    let syncPainting = false;
    let syncClear = false;

    rules.forEach((n) => {
      const [key, value] = n.split(':').map((kv) => kv.trim());

      if (!key || !value) return;

      this.styleSet.set(key, value);

      if (key === 'position') {
        syncPosition = true;
      } else if (key === 'transform') {
        syncPainting = true;
      } else if (key === 'width' || key === 'height') {
        syncPainting = true;
      } else if (key === 'display' && value === 'none') {
        syncClear = true;
      }
    });

    if (syncPosition) this.syncPosition();
    if (syncPainting) this.syncPainting();
    if (syncClear) this.syncClear();
  };

  syncPosition = () => {
    const position = this.styleSet.get('position');

    if (!position) return;

    const originalPosition = this.$canvas.style.position;

    if (position !== originalPosition) {
      this.$canvas.style.position = position;
    }
  };

  static translateRegex = /translate\((.+)px,\s*(.+)px\)/;

  syncPainting = () => {
    const rawPosition = this.styleSet.get('transform');
    if (!rawPosition) return;

    const positionMatch = rawPosition.match(DragAreaPainter.translateRegex);
    if (!positionMatch) return;

    const [, sx, sy] = positionMatch;

    const x = Number.parseFloat(sx);
    const y = Number.parseFloat(sy);

    if (Number.isNaN(x) || Number.isNaN(y)) return;

    const sw = this.styleSet.get('width');
    const sh = this.styleSet.get('height');

    if (!sw?.endsWith('px')) return;
    if (!sh?.endsWith('px')) return;

    const w = Number.parseFloat(sw.slice(0, -2));
    const h = Number.parseFloat(sh.slice(0, -2));

    if (Number.isNaN(w) || Number.isNaN(h)) return;

    this.syncClear();

    const ratio = window.devicePixelRatio;

    this.context.fillStyle = 'rgba(30, 84, 183, 0.25)';
    this.context.strokeStyle = 'rgba(30, 84, 183, 1)';
    this.context.lineWidth = 1 * ratio;
    this.context.fillRect(x * ratio, y * ratio, w * ratio, h * ratio);
    this.context.strokeRect(x * ratio, y * ratio, w * ratio, h * ratio);
  };

  syncClear = () => {
    this.context.clearRect(
      0,
      0,
      this.$canvas.width * window.devicePixelRatio,
      this.$canvas.height * window.devicePixelRatio
    );
    this.styleSet.set('width', '0px');
    this.styleSet.set('height', '0px');
  };

  syncCanvasSize = () => {
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
}
