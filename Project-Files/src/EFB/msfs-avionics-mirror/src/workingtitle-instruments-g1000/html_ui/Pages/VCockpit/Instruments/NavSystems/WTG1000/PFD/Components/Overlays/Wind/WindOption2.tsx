import { FSComponent, Subject, VNode } from 'msfssdk';
import { WindOption } from './WindOption';

import './WindOption2.css';

/**
 * The Wind Option 2 Component
 */
export class WindOption2 extends WindOption {
  private option2RotateRef = FSComponent.createRef<HTMLDivElement>();
  private windSpeedValue = Subject.create(0);

  /** @inheritdoc */
  protected update(): void {
    const hdg = this.props.aircraftHeading?.get() !== undefined ? this.props.aircraftHeading?.get() : 0;
    const windData = this.props.windData.get();
    const windAbsolute = Math.abs(Math.round(windData.velocity));

    let rotate = windData.direction - hdg;
    if (rotate > 180) {
      rotate = rotate - 360;
    } else if (rotate < -180) {
      rotate = rotate + 360;
    }
    rotate = (rotate + 180) % 360;

    this.windSpeedValue.set(windAbsolute);

    if (this.option2RotateRef.instance !== null && windAbsolute !== 0) {
      this.option2RotateRef.instance.style.transform = `rotate3d(0, 0, 1, ${rotate}deg)`;
    }
  }

  /** @inheritdoc */
  render(): VNode {
    return (
      <div ref={this.containerRef} class="wind-overlay-opt2 hide-element">
        <div ref={this.option2RotateRef} class="arrow-rotate">
          <svg>
            <path d="M 6 21 L 6 5 L 10 5 L 5 0 l -5 5 l 4 0 L 4 21 z" fill="whitesmoke" stroke="gray" stroke-width="1px" />
          </svg>
        </div>
        <div class="wind-speed-solo size18">{this.windSpeedValue}</div>
      </div>
    );
  }
}
