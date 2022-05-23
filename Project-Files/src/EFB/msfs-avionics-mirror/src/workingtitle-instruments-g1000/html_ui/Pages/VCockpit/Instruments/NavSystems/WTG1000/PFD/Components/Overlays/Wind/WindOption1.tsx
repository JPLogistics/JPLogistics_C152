import { FSComponent, Subject, VNode } from 'msfssdk';
import { WindOption } from './WindOption';

import './WindOption1.css';

/**
 * The Wind Option 1 Component
 */
export class WindOption1 extends WindOption {
  private readonly headwindValue = Subject.create(0);
  private readonly crosswindValue = Subject.create(0);

  /** @inheritdoc */
  protected update(): void {
    const hdg = this.props.aircraftHeading?.get() !== undefined ? this.props.aircraftHeading?.get() : 0;
    const windData = this.props.windData.get();

    const crosswind = Math.trunc(windData.velocity *
      (Math.sin((hdg * Math.PI / 180) - (windData.direction * Math.PI / 180))));
    const headwind = Math.trunc(windData.velocity *
      (Math.cos((hdg * Math.PI / 180) - (windData.direction * Math.PI / 180))));

    this.crosswindValue.set(Math.abs(crosswind));
    this.headwindValue.set(Math.abs(headwind));

    this.containerRef.instance.classList.toggle('left-xwind', crosswind > 0);
    this.containerRef.instance.classList.toggle('right-xwind', crosswind < 0);
    this.containerRef.instance.classList.toggle('headwind', headwind > 0);
    this.containerRef.instance.classList.toggle('tailwind', headwind < 0);
  }

  /** @inheritdoc */
  render(): VNode {
    return (
      <div ref={this.containerRef} class="wind-overlay-opt1 hide-element">
        <svg>
          <path d="M 7 11 l 0 2 l 20 0 l 0 -2 l -20 0 z" fill="whitesmoke" stroke="rgb(128,128,128)" stroke-width="1px" />
          <path d="M 16 2 l 0 20 l 2 0 l 0 -20 z" fill="whitesmoke" stroke="rgb(128,128,128)" stroke-width="1px" />
        </svg>
        <svg class="wind-overlay-opt1-arrow left-xwind-arrow">
          <path d="M 29 12 l -5 5 l 0 -10 z" fill="whitesmoke" stroke="gray" stroke-width="1px" />
        </svg>
        <svg class="wind-overlay-opt1-arrow right-xwind-arrow">
          <path d="M 5 12 l 5 -5 l 0 10 z" fill="whitesmoke" stroke="gray" stroke-width="1px" />
        </svg>
        <svg class="wind-overlay-opt1-arrow headwind-arrow">
          <path d="M 17 24 l -5 -5 l 10 0 z" fill="whitesmoke" stroke="gray" stroke-width="1px" />
        </svg>
        <svg class="wind-overlay-opt1-arrow tailwind-arrow">
          <path d="M 17 0 l -5 5 l 10 0 z" fill="whitesmoke" stroke="gray" stroke-width="1px" />
        </svg>
        <div class="crosswind-value size18">{this.crosswindValue}</div>
        <div class="headwind-value size18">{this.headwindValue}</div>
      </div>
    );
  }
}
