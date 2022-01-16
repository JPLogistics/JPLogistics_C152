import { ComponentProps, DisplayComponent, VNode, FSComponent } from 'msfssdk';

import './ScrollBar.css';

/**
 * The Scrollbar.
 */
export class ScrollBar extends DisplayComponent<ComponentProps> {
  private readonly svgRef = FSComponent.createRef<SVGSVGElement>();
  private readonly scrollBarRef = FSComponent.createRef<SVGPathElement>();
  private readonly scrollThumbRef = FSComponent.createRef<SVGRectElement>();
  private readonly scrollBarContainerRef = FSComponent.createRef<HTMLElement>();
  private scrollableContainer: HTMLElement | null = null;

  private readonly scrollListener = this.onScroll.bind(this);
  private sizeChangeTimer: NodeJS.Timeout | null = null;

  private readonly arrowPadding = 6;
  private readonly margin = 2;

  private currentScrollHeight = 0;
  private currentThumbAreaHeight = 0;
  private scrollHeightRatio = 0;

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    if (this.scrollBarContainerRef.instance !== null) {
      this.scrollableContainer = this.scrollBarContainerRef.instance.previousElementSibling as HTMLElement;
      if (this.scrollableContainer !== null) {
        // bind scroll event
        this.scrollableContainer.addEventListener('scroll', this.scrollListener);
      }

      // HINT: ResizeObserver doesn't exist in Coherent. MutationObserver doesn't perform well.
      // So we do this crap
      /**
       * Checks if the scrollheight of the container has changed and calls adjust
       */
      const diffAndAdjust = (): void => {
        if (this.currentScrollHeight !== this.scrollableContainer?.scrollHeight) {
          this.adjustScrollbarDimensions();
        }
      };
      this.sizeChangeTimer = setInterval(diffAndAdjust, 150);
    }
    this.onScroll();
  }

  /**
   * Adjusts the dimensions of the scrollbar elements.
   * @private
   */
  private adjustScrollbarDimensions(): void {
    if (this.scrollableContainer) {
      const parentTop = this.scrollableContainer.offsetTop;
      this.scrollBarContainerRef.instance.style.top = `${parentTop + 4}px`;

      this.currentScrollHeight = this.scrollableContainer.scrollHeight;
      const containerHeight = this.scrollableContainer.clientHeight;

      const totalMarginAndPadding = (this.arrowPadding * 2) + (this.margin * 2);
      this.currentThumbAreaHeight = containerHeight - totalMarginAndPadding;

      this.scrollHeightRatio = (this.currentScrollHeight / containerHeight);
      if (this.scrollThumbRef.instance !== null) {
        this.scrollThumbRef.instance.style.height = `${this.currentThumbAreaHeight / this.scrollHeightRatio}`.toString();
      }

      this.scrollBarContainerRef.instance.style.height = `${containerHeight}px`;
      this.svgRef.instance.setAttribute('height', `${containerHeight - (this.margin * 2)}px`);
      this.scrollBarRef.instance.setAttribute('d', `M 5 0 l 2 3 l -4 0 l 2 -3 m 0 6 l 0 ${this.currentThumbAreaHeight} m 0 6 l 2 -3 l -4 0 l 2 3`);
      this.scrollBarContainerRef.instance.style.display = (this.scrollHeightRatio <= 1.0) ? 'none' : '';

      this.onScroll();
    }
  }

  // TODO needs a method to adjust things on the fly.
  // also put some dimensions into variables

  /**
   * Eventhandler called when a scroll event in the scrollable parent container happens.
   */
  private onScroll(): void {
    if (this.scrollableContainer) {
      if (this.scrollBarRef.instance !== null) {
        const scrollY = ((this.scrollableContainer.scrollTop / this.scrollableContainer.scrollHeight) * this.currentThumbAreaHeight) + this.arrowPadding;
        if (!isNaN(scrollY)) {
          this.scrollThumbRef.instance.setAttribute('y', scrollY.toString());
        }
      }
    }
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode | null {
    return (
      <div class="scroll-bar" ref={this.scrollBarContainerRef}>
        <svg ref={this.svgRef}>
          <path ref={this.scrollBarRef} d="M 5 0 l 2 3 l -4 0 l 2 -3 m 0 6 l 0 135 m 0 6 l 2 -3 l -4 0 l 2 3" fill="rgb(150,150,150)" stroke="rgb(150,150,150)" stroke-width="1px"></path>
          <rect ref={this.scrollThumbRef} x="3" y="6" width="4" fill="rgb(150,150,150)" />
        </svg>
      </div>
    );
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public destroy(): void {
    if (this.scrollableContainer) {
      this.scrollableContainer.removeEventListener('scroll', this.scrollListener);
    }
    if (this.sizeChangeTimer !== null) {
      clearInterval(this.sizeChangeTimer);
    }
  }
}