import { FSComponent, ComponentProps, DisplayComponent, VNode } from 'msfssdk';

/**
 * Props for the CompassRose component.
 */
interface CompassRoseProps extends ComponentProps {

  /** The vertical and horizontal size of the compass rose. */
  size: number;

  /** The margin around the compass portion of the element. */
  margin: number;

  /** Whether or not to apply a gradient to the compass background. */
  gradient?: boolean;
}

/**
 * A compass rose display component.
 */
export class CompassRose extends DisplayComponent<CompassRoseProps> {

  private bearingPointerCircleElement = FSComponent.createRef<SVGElement>();
  private roseMarkings = FSComponent.createRef<SVGGElement>();

  /**
   * Sets whether or not the compass rose is failed.
   * @param isFailed Whether or not the compass rose markings should be failed.
   */
  public setFailed(isFailed: boolean): void {
    if (isFailed) {
      this.roseMarkings.instance.classList.add('hidden-element');
    } else {
      this.roseMarkings.instance.classList.remove('hidden-element');
    }
  }

  /**
   * Builds the compass rose tick marks.
   * @returns A collection of rose tick line elements.
   */
  public buildRose(): SVGLineElement[] {
    const lines: SVGLineElement[] = [];

    const half = this.props.size / 2;
    const roseRadius = half - this.props.margin;

    for (let i = 0; i < 360; i += 5) {
      const length = i % 10 == 0 ? 15 : 8;

      const startX = half + (roseRadius - length) * Math.cos(i * Math.PI / 180);
      const startY = half + (roseRadius - length) * Math.sin(i * Math.PI / 180);

      const endX = startX + (length * Math.cos(i * Math.PI / 180));
      const endY = startY + (length * Math.sin(i * Math.PI / 180));

      lines.push(<line x1={startX} y1={startY} x2={endX} y2={endY} stroke="white" stroke-width="1.8px" />);
    }

    return lines;
  }

  /**
   * Builds the compass rose letter markings.
   * @returns A collection of letter marking text elements.
   */
  public buildRoseMarkings(): SVGTextElement[] {
    const half = this.props.size / 2;

    const texts = ['N', '3', '6', 'E', '12', '15', 'S', '21', '24', 'W', '30', '33'];
    const letters: SVGTextElement[] = [];

    let angle = 0;
    for (let i = 0; i < texts.length; i++) {
      const fontSize = i % 3 === 0 ? '26' : '20';
      const yValue = i % 3 === 0 ? (38 + this.props.margin).toFixed(0) : (32 + this.props.margin).toFixed(0);

      letters.push(<text x={half} y={yValue} transform={`rotate(${angle}, ${half}, ${half})`} fill="white" text-anchor="middle" font-size={fontSize}>{texts[i]}</text>);
      angle += 360 / texts.length;
    }

    return letters;
  }

  /**
   * Sets whether or not the bearing pointer circle is visible.
   * @param isVisible Whether or not the bearing pointer circle is visible.
   */
  public setCircleVisible(isVisible: boolean): void {
    this.bearingPointerCircleElement.instance.style.display = isVisible ? '' : 'none';
  }

  /**
   * Renders the component.
   * @returns The rendered VNode.
   */
  public render(): VNode {
    const viewBox = `0 0 ${this.props.size} ${this.props.size}`;
    const half = `${this.props.size / 2}px`;
    const radius = `${(this.props.size / 2) - this.props.margin}px`;

    return (
      <svg viewBox={viewBox} >
        <radialGradient id="bgFill">
          <stop offset="80%" stop-color="rgb(0,0,0)" stop-opacity="0.00" />
          <stop offset="100%" stop-color="rgb(0,0,0)" stop-opacity="0.75" />
        </radialGradient>
        <circle cx={half} cy={half} r={radius} fill={this.props.gradient ? 'url("#bgFill")' : 'rgba(0,0,0,.3)'} />
        <circle ref={this.bearingPointerCircleElement} cx={half} cy={half} r="82px" stroke="white" stroke-width="1px" fill="none" />
        {this.buildRose()}
        <g ref={this.roseMarkings}>
          {this.buildRoseMarkings()}
        </g>
      </svg >
    );
  }
}