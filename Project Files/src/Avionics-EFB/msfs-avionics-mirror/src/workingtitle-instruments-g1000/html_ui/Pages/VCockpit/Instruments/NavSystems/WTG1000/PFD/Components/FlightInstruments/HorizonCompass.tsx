import { FSComponent, ComponentProps, DisplayComponent, VNode, NodeReference } from 'msfssdk';
import { SvtProjectionUtils } from '../../../Shared/UI/SvtProjectionUtils';
import { PlaneStateInfo } from './PrimaryHorizonDisplay';
import './HorizonCompass.css';

/**
 * Horizon Compass
 */
export class HorizonCompass extends DisplayComponent<ComponentProps> {
  private static readonly vec2Cache = [new Float64Array(2)];

  private horizonLineElement = FSComponent.createRef<HTMLElement>();
  private headingTapeValues: NodeReference<SVGTextElement>[] = [];
  private headingLabelsRef = FSComponent.createRef<SVGGElement>();
  private currentDrawnHeading = 0;
  private pxPerDegX = SvtProjectionUtils.projectYawPitch(0.1 * Avionics.Utils.DEG2RAD, 0, 0, new Float64Array(2))[0] * 10;

  private static EPSILON = 0.0001;

  /**
   * Updates horizon compass
   * @param planeState The plane state info.
   */
  public update(planeState: PlaneStateInfo): void {
    const offset = SvtProjectionUtils.projectYawPitch(
      0,
      planeState.pitch * Avionics.Utils.DEG2RAD,
      0,
      HorizonCompass.vec2Cache[0]
    );

    // need to use linear approximation for yaw otherwise ticks will appear to stutter since they are spaced according
    // to this approximation
    offset[0] = planeState.heading % 10 * this.pxPerDegX;

    this.horizonLineElement.instance.style.transform = `rotate(${planeState.roll}deg) translate3d(${-offset[0]}px,${offset[1]}px,0)`;

    this.onUpdateHeadingTape(planeState.heading);
  }

  /**
   * Sets the heading label visibility.
   * @param v bool indicating if the labels should be shown
   */
  public setHdgLabelVisibility(v: boolean): void {
    if (this.headingLabelsRef.instance !== null) {
      this.headingLabelsRef.instance.style.visibility = v ? 'visible' : 'hidden';
    }
  }

  /**
   * Builds the tick marks on the horizon compass.
   * @returns Arrays of tick marks and labels.
   */
  // eslint-disable-next-line jsdoc/require-jsdoc
  private buildHeadingTicks(): { ticks: SVGLineElement[], labels: SVGTextElement[] } {
    const result = {
      ticks: [] as SVGLineElement[],
      labels: [] as SVGTextElement[]
    };

    const tickLength = 4;
    const labelBottomY = -6;

    result.ticks.push(<line x1='0' y1='0' x2='0' y2={-tickLength} stroke="rgb(203,203,203)" stroke-width="1" />);

    let textRef = FSComponent.createRef<SVGTextElement>();
    result.labels.push(<text x='0' y={labelBottomY} fill="rgb(203,203,203)" text-anchor="middle" font-size="15" ref={textRef}>360</text>);
    this.headingTapeValues.push(textRef);

    for (let i = 0; i < 6; i++) {
      const headingOffset = (i + 1) * 10;
      const dX = this.pxPerDegX * headingOffset;

      result.ticks.unshift(<line x1={-dX} y1='0' x2={-dX} y2={-tickLength} stroke="rgb(203,203,203)" stroke-width="1" />);
      result.ticks.push(<line x1={dX} y1='0' x2={dX} y2={-tickLength} stroke="rgb(203,203,203)" stroke-width="1" />);

      textRef = FSComponent.createRef<SVGTextElement>();
      result.labels.unshift(<text x={-dX} y={labelBottomY} fill="rgb(203,203,203)" text-anchor="middle" font-size="15" ref={textRef}>{360 - headingOffset}</text>);
      this.headingTapeValues.unshift(textRef);

      textRef = FSComponent.createRef<SVGTextElement>();
      result.labels.push(<text x={dX} y={labelBottomY} fill="rgb(203,203,203)" text-anchor="middle" font-size="15" ref={textRef}>{headingOffset}</text>);
      this.headingTapeValues.push(textRef);
    }

    return result;
  }

  /**
   * A callback called when the heading tape updates.
   * @param heading The current heading value.
   */
  private onUpdateHeadingTape = (heading: number): void => {
    if (heading / 10 >= this.currentDrawnHeading + 1 || heading / 10 <= this.currentDrawnHeading) {
      this.currentDrawnHeading = Math.floor(heading / 10);
      const start = 300 + (this.currentDrawnHeading) * 10;
      for (let i = 0; i < this.headingTapeValues.length; i++) {
        const scrollerValue = this.headingTapeValues[i].instance;
        if (scrollerValue !== null) {
          const hdg = (start + i * 10) % 360;
          if (hdg % 30 == 0) {
            scrollerValue.textContent = hdg != 0 ? (hdg).toString().padStart(3, '0') : '360';
          } else {
            scrollerValue.textContent = '';
          }
        }
      }
    }
  }

  /**
   * Gets the altitude corrected pitch for the horizon.
   * @param pitch input pitch value in degrees
   * @param alt altitude in meters
   * @returns corrected pitch in degrees
   */
  private getCorrectedPitch(pitch: number, alt: number): number {
    alt /= 1000;
    if (alt > HorizonCompass.EPSILON) {
      const horizonDistance = Math.sqrt(alt * (2 * 6371 + alt));
      pitch += 125 * (alt / horizonDistance);
    }

    return pitch;
  }

  /** @inheritdoc */
  public render(): VNode {
    const ticks = this.buildHeadingTicks();
    return (
      <svg ref={this.horizonLineElement} class="horizon-line" viewBox="-982 -25 1964 50">
        <g class="HeadingTape">
          <line x1="-982" y1="0" x2="982" y2="0" stroke="white" stroke-width="2"></line>
          {ticks.ticks}
          <g ref={this.headingLabelsRef}>
            {ticks.labels}
          </g>
        </g>
      </svg>
    );
  }
}