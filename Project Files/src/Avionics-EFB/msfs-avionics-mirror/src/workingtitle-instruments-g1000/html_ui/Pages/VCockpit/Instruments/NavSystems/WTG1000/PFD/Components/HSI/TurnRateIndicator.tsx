import { ComponentProps, DisplayComponent, FSComponent, NodeReference, VNode } from 'msfssdk';

import './TurnRateIndicator.css';

/**
 * Props for the CompassRose component.
 */
export interface TurnRateProps extends ComponentProps {

  /** Whether this turn rate indicator is for the HSI Map or not. */
  hsiMap: boolean;
}

/**
 * The HSI turn rate indicator component.
 */
export class TurnRateIndicator extends DisplayComponent<TurnRateProps> {

  private readonly rateElement = new NodeReference<SVGPathElement>();
  private readonly arrowElement = new NodeReference<SVGPathElement>();

  /**
   * Updates the rate of turn indicator above the HSI when the rate of turn changes.
   * @param turnRate is the input rate of turn in degrees per second.
   */
  public setTurnRate(turnRate: number): void {

    const lengthFactor = this.props.hsiMap ? 20 / 22.5 : 1;
    const radius = this.props.hsiMap ? 176 : 146;

    const arcLength = turnRate < 0 ? lengthFactor * Math.max(turnRate * 6, -22.5) : lengthFactor * Math.min(turnRate * 6, 22.5);
    const arcX = radius * Math.cos((Math.PI / 180) * (90 - arcLength));
    const arcY = radius - (radius * Math.sin((Math.PI / 180) * (90 - arcLength)));

    const lineX = 6 * Math.cos((Math.PI / 180) * (90 - arcLength));
    const lineY = 0 - (6 * Math.sin((Math.PI / 180) * (90 - arcLength)));

    const sweepFlag1 = arcLength >= 0 ? 0 : 1;
    const sweepFlag2 = arcLength >= 0 ? 1 : 0;


    if (this.props.hsiMap) {
      this.rateElement.instance.setAttribute('d', `M 175 246 m 0 -176 a 176 176 0 0 ${sweepFlag2} ${arcX} ${arcY} l ${lineX} ${lineY} A 182 182 0 0 ${sweepFlag1} 175 64`);
    } else {
      this.rateElement.instance.setAttribute('d', `M 183 185 m 0 -146 a 146 146 0 0 ${sweepFlag2} ${arcX} ${arcY} l ${lineX} ${lineY} A 152 152 0 0 ${sweepFlag1} 183 33`);
    }

    if (Math.abs(turnRate) * 6 >= 22.5) {
      const direction = turnRate < 0 ? 1 : -1;

      if (this.props.hsiMap) {
        //M 175 246 m -61.22 -168.2 l -3.08 -8.46 l -14.16 15.78 l 20.32 1.13 z
        this.arrowElement.instance.setAttribute('d', `M 175 246 m ${direction * -61.22} -168.2 l ${direction * -3.08} -8.46 l ${direction * -14.16} 15.78 l ${direction * 20.32} 1.13 z`);
      } else {
        this.arrowElement.instance.setAttribute('d', `M 183 185 m ${direction * -57.02} -137.66 l ${direction * -3.06} -7.39 l ${direction * -10.94} 12.99 l ${direction * 17.07} 1.79 z`);
      }

      this.arrowElement.instance.setAttribute('fill', 'magenta');
      this.arrowElement.instance.setAttribute('stroke', 'black');
      this.arrowElement.instance.setAttribute('stroke-width', '.5px');
      this.arrowElement.instance.style.display = '';
    } else {
      this.arrowElement.instance.style.display = 'none';
    }
  }

  /**
   * Renders the turn rate component.
   * @returns The rendered component VNode.
   */
  public render(): VNode {
    if (this.props.hsiMap) {
      return (
        <div class="turn-rate-indicator-hsimap">
          <svg>
            <path d="M 175 246 m 0 -175 a 175 175 0 0 0 -59.85 10.55 l -8.21 -22.55 a 199 199 0 0 1 136.12 0 l -8.21 22.55 a 175 175 0 0 0 -59.85 -10.55" fill="rgba(0,0,0,.3)" />
            <path d="M 175 246 m -20.66 -176.8 l -1.97 -16.89 z M 175 246 m -41.05 -173.2 l -3.92 -16.54 z M 175 246 m 20.66 -176.8 l 1.97 -16.89 z M 175 246 m 41.05 -173.2 l 3.92 -16.54 z" stroke="white" stroke-width="1.8px" />
            <path ref={this.rateElement} d="M 175 246 m 0 -176 a 176 176 0 0 0 0 0 l 0 0 A 182 182 0 0 1 175 64 z" fill="magenta" stroke="black" stroke-width=".5px" />
            <path ref={this.arrowElement} d="M 175 246 m -61.22 -168.2 l -3.08 -8.46 l -14.16 15.78 l 20.32 1.13 z" fill="magenta" stroke="black" stroke-width=".5px" style="display: none" />
            <path d="M 175 84 l 10 -25 l -20 0 z" fill="white" stroke="grey" stroke-width=".5px" />
          </svg>
        </div>
      );
    } else {
      return (
        <div class="turn-rate-indicator-rose">
          <svg viewBox="111 16 147 40">
            <path d="M 183 185 m 0 -145 a 145 145 0 0 0 -55.49 11.04 l -9.18 -22.17 a 169 169 0 0 1 129.35 0 l -9.18 22.17 a 145 145 0 0 0 -55.49 -11.04" fill="rgba(0,0,0,.3)" />
            <path d="M 183 185 m -23.15 -146.17 l -2.65 -16.79 z M 183 185 m -45.59 -140.33 l -5.25 -16.17 z M 183 185 m 23.15 -146.17 l 2.65 -16.79 z M 183 185 m 45.59 -140.33 l 5.25 -16.17 z" stroke="white" stroke-width="1.8px" />
            <path ref={this.rateElement} d="M 183 185 m 0 -146 a 146 146 0 0 0 0 0 l 0 0 A 152 152 0 0 1 183 33 z" fill="magenta" stroke="black" stroke-width=".5px" />
            <path ref={this.arrowElement} d="M 183 185 m -57.02 -137.66 l -3.44 -8.31 l -10.56 13.91 l 17.45 2.71 z" fill="magenta" stroke="black" stroke-width=".5px" style="display: none" />
            {/* <path d="M 183 49 l 8 -20 l -16 0 l 8 20 z" fill="white" stroke="grey" stroke-width=".5px" /> */}
          </svg>
        </div>
      );
    }
  }
}