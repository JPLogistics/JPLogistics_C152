import { FSComponent, DisplayComponent, VNode, ComponentProps } from 'msfssdk';
import { LegTurnDirection, LegType } from 'msfssdk/navigation';

import './FmaLegIcon.css';

/**
 * The properties on the FMA Leg Icon component.
 */
type FmaLegIconProps = ComponentProps

/**
 * The FMA Leg Icon component
 */
export class FmaLegIcon extends DisplayComponent<FmaLegIconProps> {


  private iconElement = FSComponent.createRef<SVGPathElement>();
  private dtoTextElement = FSComponent.createRef<SVGTextElement>();



  /**
   * Do stuff after rendering.
   */
  onAfterRender(): void {
    this.dtoTextElement.instance.setAttribute('visibility', 'hidden');
  }

  /**
   * A callback called when the leg type changes to modify the leg type icon in the FMA.
   * @param legExists is a bool for whether an arrow should be drawn at all
   * @param isDirectTo is a bool for whether the flight plan is current in a direct to state.
   * @param legType The current enum value for the leg type.
   * @param turnDirection the direction of the turn
   */
  public updateFmaIcon = (legExists: boolean, isDirectTo?: boolean, legType?: LegType, turnDirection?: LegTurnDirection): void => {
    if (this.iconElement.instance !== null && this.dtoTextElement.instance !== null) {
      let svgD = 'm 33 14 l -7.2 -7.2 l 0 5.04 l -19.04 0 l 0 4.32 l 19.04 0 l 0 5.04 l 7.2 -7.2 z ';
      let svgFill = 'magenta';
      let svgStroke = 'none';
      let svgStrokeWidth = '0px';
      let directTo = false;
      if (legExists) {
        switch (legType) {
          case LegType.DF:
            if (isDirectTo === true) {
              directTo = true;
            }
            svgD = 'm 33 14 l -7.2 -7.2 l 0 5.04 l -19.04 0 l 0 4.32 l 19.04 0 l 0 5.04 l 7.2 -7.2 z ';
            svgFill = 'magenta';
            svgStroke = 'none';
            svgStrokeWidth = '0px';
            break;
          case LegType.HA:
          case LegType.HF:
          case LegType.HM:
            if (turnDirection === LegTurnDirection.Left) {
              svgD = 'm 4 20 l 22 0 m 0 -2 l 3 0 m 0 2 l 8 0 m -8 -1 l 1 0 c 7 0 7 -11 0 -11 l -19 0 c -7 0 -7 11 0 11 l 15 0 m 0 2 l 3 0 ';
            } else {
              svgD = 'm 3 8 l 23 0 m 0 -1 l 3 0 m 0 1 l 8 0 m -8 1 l 1 0 c 7 0 7 11 0 11 l -19 0 c -7 0 -7 -11 0 -11 l 15 0 m 0 1 l 3 0 ';
            }
            svgFill = 'none';
            svgStroke = 'magenta';
            svgStrokeWidth = '2px';
            break;
          case LegType.PI:
            if (turnDirection === LegTurnDirection.Left) {
              svgD = 'm 3 8 l 3 0 m 2 -1 l 27 0 m -32 0 l 3 0 m 0 -1 l 2 0 m -2 3 l 2 0 m 0 -1 l 10 0 l 10 11 c 5 5 11 0 6 -5 l -5 -6 l -11 0 ';
            } else {
              svgD = 'm 3 20 l 3 0 m 2 0 l 27 0 m -32 -1 l 3 0 m 0 -1 l 2 0 m -2 3 l 2 0 m 0 -2 l 10 0 l 10 -10 c 5 -5 11 0 6 5 l -5 5 l -11 0 ';
            }
            svgFill = 'none';
            svgStroke = 'magenta';
            svgStrokeWidth = '2px';
            break;
          case LegType.RF:
          case LegType.AF:
            if (turnDirection === LegTurnDirection.Left) {
              svgD = 'm 4 12 c 0 6 2 9 7 9 l 16 0 c 5 0 7 -3 7 -9 l 4 0 l -7.5 -9 l -7.5 9 l 4 0 c 0 2 -1 4 -4 4 l -8 0 c -3 0 -4 -2 -4 -4 l -7 0 ';
            } else {
              svgD = 'm 4 12 c 0 -6 2 -9 7 -9 l 16 0 c 5 0 7 3 7 9 l 4 0 l -7.5 9 l -7.5 -9 l 4 0 c 0 -2 -1 -4 -4 -4 l -8 0 c -3 0 -4 2 -4 4 l -7 0 ';
            }
            svgFill = 'magenta';
            svgStroke = 'none';
            svgStrokeWidth = '0px';
            break;
          default:
            svgD = 'm 33 14 l -7.2 -7.2 l 0 5.04 l -19.04 0 l 0 4.32 l 19.04 0 l 0 5.04 l 7.2 -7.2 z ';
            svgFill = 'magenta';
            svgStroke = 'none';
            svgStrokeWidth = '0px';
            break;
        }
      } else {
        svgD = 'm 33 14 l -7.2 -7.2 l 0 5.04 l -19.04 0 l 0 4.32 l 19.04 0 l 0 5.04 l 7.2 -7.2 z ';
        svgFill = 'none';
        svgStroke = 'none';
        svgStrokeWidth = '0px';
      }
      this.iconElement.instance.setAttribute('d', `${svgD}`);
      this.iconElement.instance.setAttribute('fill', `${svgFill}`);
      this.iconElement.instance.setAttribute('stroke', `${svgStroke}`);
      this.iconElement.instance.setAttribute('stroke-width', `${svgStrokeWidth}`);


      if (directTo) {
        this.dtoTextElement.instance.setAttribute('visibility', 'visible');
      } else {
        this.dtoTextElement.instance.setAttribute('visibility', 'hidden');
      }
    }
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  render(): VNode {
    return (
      <svg class="fma-symbols" width="40" height="24">
        <path ref={this.iconElement} d='m 0 0 ' />
        <text ref={this.dtoTextElement} x="10" y="21.3" fill="magenta" font-size="20" >D</text>
      </svg>
    );
  }
}
