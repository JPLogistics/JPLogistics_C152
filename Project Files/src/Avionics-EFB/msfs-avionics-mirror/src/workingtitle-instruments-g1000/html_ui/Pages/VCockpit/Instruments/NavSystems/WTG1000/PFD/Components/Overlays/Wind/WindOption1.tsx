import { FSComponent, Subject, VNode } from 'msfssdk';
import { WindOverlayRenderOption } from '../../../../Shared/UI/Controllers/WindOptionController';
import { WindOption } from './WindOption';

/**
 * The Wind Option 1 Component
 */
export class WindOption1 extends WindOption {
  private leftXwindArrowRef = FSComponent.createRef<HTMLElement>();
  private rightXwindArrowRef = FSComponent.createRef<HTMLElement>();
  private headwindArrowRef = FSComponent.createRef<HTMLElement>();
  private tailwindArrowRef = FSComponent.createRef<HTMLElement>();
  private headwindValue = Subject.create(0);
  private crosswindValue = Subject.create(0);

  /**
   * Do stuff after rendering.
   */
  public onAfterRender(): void {
    this.props.renderOption.sub((v) => {
      if (v === WindOverlayRenderOption.OPT1) {
        this.setVisible(true);
      } else {
        this.setVisible(false);
      }
    });
    this.props.windData.sub(() => {
      this.update();
    });
    this.props.aircraftHeading?.sub(() => {
      this.update();
    });
  }

  /**
   * Update the component data.
   */
  private update(): void {
    const hdg = this.props.aircraftHeading?.get() !== undefined ? this.props.aircraftHeading?.get() : 0;
    const windData = this.props.windData.get();

    const crosswind = Math.trunc(windData.velocity *
      (Math.sin((hdg * Math.PI / 180) - (windData.direction * Math.PI / 180))));
    const headwind = Math.trunc(windData.velocity *
      (Math.cos((hdg * Math.PI / 180) - (windData.direction * Math.PI / 180))));

    this.crosswindValue.set(Math.abs(crosswind));
    this.headwindValue.set(Math.abs(headwind));

    if (crosswind > 0 && this.leftXwindArrowRef.instance !== null) {
      this.leftXwindArrowRef.instance.classList.remove('disabled');
      this.rightXwindArrowRef.instance.classList.add('disabled');
    } else if (crosswind < 0 && this.rightXwindArrowRef.instance !== null) {
      this.rightXwindArrowRef.instance.classList.remove('disabled');
      this.leftXwindArrowRef.instance.classList.add('disabled');
    } else {
      this.rightXwindArrowRef.instance.classList.add('disabled');
      this.leftXwindArrowRef.instance.classList.add('disabled');
    }
    if (headwind > 0 && this.headwindArrowRef.instance !== null) {
      this.headwindArrowRef.instance.classList.remove('disabled');
      this.tailwindArrowRef.instance.classList.add('disabled');
    } else if (headwind < 0 && this.tailwindArrowRef.instance !== null) {
      this.tailwindArrowRef.instance.classList.remove('disabled');
      this.headwindArrowRef.instance.classList.add('disabled');
    } else {
      this.tailwindArrowRef.instance.classList.add('disabled');
      this.headwindArrowRef.instance.classList.add('disabled');
    }
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  render(): VNode {
    return (
      <div ref={this.containerRef} class="opt1 disabled">
        <svg>
          <path d="M 7 11 l 0 2 l 20 0 l 0 -2 l -20 0 z" fill="whitesmoke" stroke="rgb(128,128,128)" stroke-width="1px" />
          <path d="M 16 2 l 0 20 l 2 0 l 0 -20 z" fill="whitesmoke" stroke="rgb(128,128,128)" stroke-width="1px" />
        </svg>
        <div ref={this.leftXwindArrowRef} class="left-xwind-arrow disabled">
          <svg>
            <path class="left-xwind" d="M 29 12 l -5 5 l 0 -10 z" fill="whitesmoke" stroke="gray" stroke-width="1px" />
          </svg>
        </div>
        <div ref={this.rightXwindArrowRef} class="right-xwind-arrow disabled">
          <svg>
            <path d="M 5 12 l 5 -5 l 0 10 z" fill="whitesmoke" stroke="gray" stroke-width="1px" />
          </svg>
        </div>
        <div ref={this.headwindArrowRef} class="headwind-arrow disabled">
          <svg>
            <path d="M 17 24 l -5 -5 l 10 0 z" fill="whitesmoke" stroke="gray" stroke-width="1px" />
          </svg>
        </div>
        <div ref={this.tailwindArrowRef} class="tailwind-arrow disabled">
          <svg>
            <path class="tailwind" d="M 17 0 l -5 5 l 10 0 z" fill="whitesmoke" stroke="gray" stroke-width="1px" />
          </svg>
        </div>
        <div class="crosswind-value size18">{this.crosswindValue}</div>
        <div class="headwind-value size18">{this.headwindValue}</div>
      </div>
    );
  }
}
