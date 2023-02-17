const numberFix = (x: number, fallbackValue = 0) => {
  if (Number.isNaN(x)) return fallbackValue;
  if (!Number.isFinite) return fallbackValue;
  return x;
};

const ROW_TOLERANCE = 20;

export class LayoutBooster {
  constructor(
    public readonly elementSelector: string,
    public readonly containerSelector: string,
    public readonly gridWidth: number,
    public readonly gap: number
  ) {}

  protected containerX = 0;

  protected containerY = 0;

  protected containerLeft = 0;

  protected containerTop = 0;

  protected containerWidth = -1;

  protected elementGridCached = false;

  protected cols = 0;

  protected rows = 0;

  protected columnXAnchors: number[] = [];

  protected columnYAnchors: number[] = [];

  protected elementHeights: number[] = [];

  protected rowHeights: number[] = [];

  protected containerScrollTop = 0;

  protected containerScrollLeft = 0;

  updateContainerSize = () => {
    const $container = document.querySelector(this.containerSelector);

    if (!$container) {
      throw new TypeError(`Container not found.`);
    }

    const containerBoundingRect = $container.getBoundingClientRect();

    this.containerX = containerBoundingRect.x;
    this.containerY = containerBoundingRect.y;
    this.containerLeft = containerBoundingRect.left;
    this.containerTop = containerBoundingRect.top;
    this.containerWidth = containerBoundingRect.width;

    this.elementGridCached = false;

    this.cols = numberFix(
      Math.floor(this.containerWidth / (this.gridWidth + this.gap)),
      1
    );
  };

  updateGridAnchors = () => {
    const $$elements = document.querySelectorAll(this.elementSelector);

    this.elementGridCached = true;

    if (this.containerWidth === -1) {
      this.updateContainerSize();
    }

    if (this.cols === 0) {
      this.columnXAnchors = new Array<number>(0).fill(0);
      this.columnYAnchors = new Array<number>(0).fill(0);

      return;
    }

    let cols = 0;
    let lastY: number | null = null;

    for (let i = 0; i < $$elements.length; i += 1) {
      const { y } = $$elements[i].getBoundingClientRect();
      if (lastY !== null && Math.abs(lastY - y) > ROW_TOLERANCE) {
        break;
      }

      cols += 1;
      lastY = y;
    }

    this.cols = cols;
    this.rows = numberFix(Math.ceil($$elements.length / cols), 0);

    const columnXAnchors = new Array<number>(this.cols).fill(-1);
    const columnYAnchors = new Array<number>(this.rows).fill(-1);

    for (let i = 0; i < this.cols; i += 1) {
      if (i >= $$elements.length) break;
      columnXAnchors[i] = $$elements[i].getBoundingClientRect().x;
    }

    for (let i = 0; i < this.rows; i += 1) {
      const fIndex = i * this.cols;
      if (fIndex >= $$elements.length) break;
      columnYAnchors[i] = $$elements[fIndex].getBoundingClientRect().y;
    }

    this.columnXAnchors = columnXAnchors;
    this.columnYAnchors = columnYAnchors;
  };

  handleContainerScroll = () => {
    const $container = document.querySelector(this.containerSelector);

    if (!$container) {
      throw new TypeError(`Container not found.`);
    }

    this.containerScrollTop = $container.scrollTop;

    this.containerScrollLeft = $container.scrollLeft;
  };

  updateElements = () => {
    const $$elements = document.querySelectorAll(this.elementSelector);

    const elementHeights = new Array<number>($$elements.length).fill(0);

    for (let i = 0; i < $$elements.length; i += 1) {
      elementHeights[i] = $$elements[i].getBoundingClientRect().height;
    }

    this.elementHeights = elementHeights;

    this.rows = numberFix(Math.ceil($$elements.length / this.cols), 0);

    const rowHeights = new Array<number>(this.rows).fill(0);

    for (let i = 0; i < $$elements.length; i += 1) {
      const elementRow = Math.floor(i / this.cols);

      rowHeights[elementRow] = Math.max(
        elementHeights[i],
        rowHeights[elementRow]
      );
    }

    this.rowHeights = rowHeights;

    if (!this.elementGridCached) {
      this.updateGridAnchors();
    }
  };

  getFastBoundingClientRect = ($element: HTMLElement | SVGElement) => {
    const elementIndex = Number.parseInt(
      $element.dataset.index ?? 'undefined',
      10
    );

    if (Number.isNaN(elementIndex)) {
      throw new TypeError(`Invalid element.`);
    }

    const elementRow = Math.floor(elementIndex / this.cols);
    const elementCol = elementIndex % this.cols;

    if (!this.elementGridCached) {
      this.updateGridAnchors();
    }

    return {
      width: this.gridWidth,
      height: this.elementHeights[elementIndex],
      left: this.columnXAnchors[elementCol] - this.containerScrollLeft,
      top: this.columnYAnchors[elementRow] - this.containerScrollTop,
    };
  };

  getElementRect = ($element: HTMLElement | SVGElement) => {
    const { width, height, left, top } =
      this.getFastBoundingClientRect($element);

    $element.dataset.boosterWidth = width?.toString();
    $element.dataset.boosterHeight = height?.toString();
    $element.dataset.boosterLeft = left?.toString();
    $element.dataset.boosterTop = top?.toString();

    return {
      pos1: [left, top],
      pos2: [left + width, top],
      pos3: [left, top + height],
      pos4: [left + width, top + height],
    };
  };
}
