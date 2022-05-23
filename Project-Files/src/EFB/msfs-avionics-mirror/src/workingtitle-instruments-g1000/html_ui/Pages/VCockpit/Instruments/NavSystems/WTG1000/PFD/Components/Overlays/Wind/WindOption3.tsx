import { ComputedSubject, FSComponent, Subject, VNode } from 'msfssdk';
import { WindOption } from './WindOption';

import './WindOption3.css';

/**
 * The Wind Option 3 Component
 */
export class WindOption3 extends WindOption {
  private option3RotateRef = FSComponent.createRef<HTMLDivElement>();
  private windSpeedValue = Subject.create(0);
  private windDirectionValue = ComputedSubject.create(0, (v): string => {
    if (v === 0) {
      return '360°';
    } else {
      return v.toFixed(0).padStart(3, '0') + '°';
    }
  });

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

    if (this.option3RotateRef.instance !== null && windAbsolute !== 0) { //Prevents rotation spasms when the sim returns chaotic wind direction with zero velocity
      this.option3RotateRef.instance.style.transform = `rotate3d(0, 0, 1, ${rotate}deg)`;
      this.windDirectionValue.set(Math.round(windData.direction));
    }
  }

  /** @inheritdoc */
  render(): VNode {
    return (
      <div ref={this.containerRef} class="wind-overlay-opt3 hide-element">
        <div ref={this.option3RotateRef} class="arrow-rotate">
          <svg>
            <path d="M 6 21 L 6 5 L 10 5 L 5 0 l -5 5 l 4 0 L 4 21 z" fill="whitesmoke" stroke="gray" stroke-width="1px" />
          </svg>
        </div>
        <div class="wind-direction size14"><span>{this.windDirectionValue}</span></div>
        <div class="wind-speed size14"><span>{this.windSpeedValue}</span><span class="size10">KT</span></div>
      </div>
    );
  }
}
