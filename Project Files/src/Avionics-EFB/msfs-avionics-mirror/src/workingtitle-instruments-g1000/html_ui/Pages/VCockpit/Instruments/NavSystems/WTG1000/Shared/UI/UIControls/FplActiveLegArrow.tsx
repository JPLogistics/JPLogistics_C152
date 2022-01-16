import { DisplayComponent, FSComponent, VNode, ComponentProps, BitFlags } from 'msfssdk';
import { FlightPlan, LegDefinitionFlags } from 'msfssdk/flightplan';
import { FixTypeFlags, LegType } from 'msfssdk/navigation';
import { FmsUtils } from '../../FlightPlan/FmsUtils';

/** FPL Active Leg States */
export enum ActiveLegStates {
  RANDOM_DIRECT,
  EXISTING_DIRECT,
  NORMAL,
  NONE
}

/** Active Segment and Leg Indexes */
export type ActiveLegDefinition = {
  /** The active segment index. */
  segmentIndex: number,
  /** The active let index in the segment. */
  legIndex: number
}

/**
 * Fpl active leg arrow props
 */
interface FplActiveLegArrowProps extends ComponentProps {
  /** A callback to be invoked to get the dom location of the leg element */
  getLegDomLocation: (segementIndex: number, legIndex: number) => number;
}

/**
 * The FplActiveLegArrow component.
 */
export class FplActiveLegArrow extends DisplayComponent<FplActiveLegArrowProps> {
  /** The arrow refs for direct to existing and active leg */
  private readonly dtoArrowEl = FSComponent.createRef<SVGElement>();
  private readonly fromLegArrow = FSComponent.createRef<SVGElement>();
  private readonly legArrowRectangle = FSComponent.createRef<SVGRectElement>();
  private readonly toLegArrow = FSComponent.createRef<SVGElement>();

  /**
   * Datermines the location and visibility of the active leg/direct to arrows on the FPL page.
   * @param state Is the ActiveLegState.
   * @param activeLegDef Is the ActiveLegDefinition.
   * @param plan Is the flight plan.
   */
  public updateArrows(state: ActiveLegStates, activeLegDef: ActiveLegDefinition, plan?: FlightPlan): void {
    try {
      let showDirectArrow = false;
      let showActiveArrow = false;
      switch (state) {
        case ActiveLegStates.NORMAL: {
          showActiveArrow = true;
          if (plan) {
            const activeLeg = plan.tryGetLeg(activeLegDef.segmentIndex, activeLegDef.legIndex);
            if (activeLeg) {
              switch (activeLeg.leg.type) {
                case LegType.VA:
                case LegType.CA:
                case LegType.VM:
                  showDirectArrow = true;
                  showActiveArrow = false;
                  break;
                case LegType.CF: {
                  const prevLeg = plan.getPrevLeg(activeLegDef.segmentIndex, activeLegDef.legIndex);
                  showDirectArrow = !!prevLeg && (prevLeg.leg.type === LegType.Discontinuity || prevLeg.leg.type === LegType.FM || prevLeg.leg.type === LegType.VM);
                  showActiveArrow = !showDirectArrow;
                  break;
                }
              }
            }
          }
          break;
        }
        case ActiveLegStates.EXISTING_DIRECT:
          showDirectArrow = true;
          break;
      }

      this.setDirectArrow(showDirectArrow, plan, activeLegDef.segmentIndex, activeLegDef.legIndex);
      this.setActiveLegArrow(showActiveArrow, plan, activeLegDef.segmentIndex, activeLegDef.legIndex);
    } catch (error) {
      console.warn(`updateArrows: ${error}`);
    }
  }

  /**
   * Sets the location and visibility of the direct to arrow in the flight plan display.
   * @param show Whether to show or hide the arrow.
   * @param plan The primary flight plan.
   * @param segmentIndex The index of the segment containing the direct to target leg.
   * @param segmentLegIndex The index of the direct to target leg in its segment.
   */
  private setDirectArrow(show: boolean, plan?: FlightPlan, segmentIndex = -1, segmentLegIndex = -1): void {
    if (plan && show && segmentIndex >= 0 && segmentIndex < plan.segmentCount) {
      const segment = plan.getSegment(segmentIndex);
      const leg = segment.legs[segmentLegIndex];
      if (leg && BitFlags.isAll(leg.flags, LegDefinitionFlags.VectorsToFinal) && BitFlags.isAll(leg.leg.fixTypeFlags, FixTypeFlags.FAF)) {
        // VTF leg is active -> set the toLeg to the "real" faf leg instead of the VTF faf leg
        segmentLegIndex -= 2;
        if (plan.directToData.segmentIndex === segmentIndex && plan.directToData.segmentLegIndex === segmentLegIndex - 3) {
          segmentLegIndex -= 3;
        }
      }

      const top = this.props.getLegDomLocation(segmentIndex, segmentLegIndex);
      this.dtoArrowEl.instance.style.transform = `translate3d(0,${top}px,0)`;
      this.dtoArrowEl.instance.style.display = '';
    } else {
      this.dtoArrowEl.instance.style.display = 'none';
    }
  }

  /**
   * Sets the location and visibility of the active leg arrow in the flight plan display.
   * @param show Whether to show the arrow.
   * @param plan The primary flight plan.
   * @param segmentIndex The index of the segment containing the active leg.
   * @param segmentLegIndex The index of the active leg in its segment.
   */
  private setActiveLegArrow(show: boolean, plan?: FlightPlan, segmentIndex = -1, segmentLegIndex = -1): void {
    let fromLeg, toLeg;

    let fromSegmentIndex = -1;
    let fromSegmentLegIndex = -1;
    let toSegmentIndex = -1;
    let toSegmentLegIndex = -1;

    if (plan && show && segmentIndex >= 0 && segmentIndex < plan.segmentCount) {
      const segment = plan.getSegment(segmentIndex);
      toLeg = segment.legs[segmentLegIndex];
      if (BitFlags.isAll(toLeg.flags, LegDefinitionFlags.VectorsToFinal) && BitFlags.isAll(toLeg.leg.fixTypeFlags, FixTypeFlags.FAF)) {
        // VTF leg is active -> set the toLeg to the "real" faf leg instead of the VTF faf leg
        segmentLegIndex -= 2;
        if (plan.directToData.segmentIndex === segmentIndex && plan.directToData.segmentLegIndex === segmentLegIndex - 3) {
          segmentLegIndex -= 3;
        }
        toLeg = segment.legs[segmentLegIndex];
      }

      fromLeg = FmsUtils.getNominalFromLeg(plan, segmentIndex, segmentLegIndex);

      if (fromLeg && toLeg) {
        const fromSegment = plan.getSegmentFromLeg(fromLeg);
        const toSegment = plan.getSegmentFromLeg(toLeg);
        if (fromSegment && toSegment) {
          fromSegmentIndex = fromSegment.segmentIndex;
          fromSegmentLegIndex = fromSegment.legs.indexOf(fromLeg);
          toSegmentIndex = toSegment.segmentIndex;
          toSegmentLegIndex = toSegment.legs.indexOf(toLeg);
        }
      }
    }

    if (fromSegmentIndex >= 0 && fromSegmentLegIndex >= 0 && toSegmentIndex >= 0 && toSegmentLegIndex >= 0) {
      const top = this.props.getLegDomLocation(fromSegmentIndex, fromSegmentLegIndex);
      const bottom = this.props.getLegDomLocation(toSegmentIndex, toSegmentLegIndex);
      const height = bottom - top - 8;
      this.fromLegArrow.instance.style.transform = `translate3d(0,${top}px,0)`;
      this.legArrowRectangle.instance.setAttribute('height', `${height}`);
      this.toLegArrow.instance.style.transform = `translate3d(0,${bottom}px,0)`;
      this.fromLegArrow.instance.style.display = '';
      this.toLegArrow.instance.style.display = '';
    } else {
      this.fromLegArrow.instance.style.display = 'none';
      this.toLegArrow.instance.style.display = 'none';
    }
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div>
        <svg class='dto-arrow' ref={this.dtoArrowEl} style='display: none;'>
          <path d='M 20 7 l -7 -7 l 0 5 l -8 0 l 0 4 l 8 0 l 0 5 l 7 -7 z' fill="magenta" />
        </svg>
        <svg class='dynamic-from-arrow' ref={this.fromLegArrow} style='display: none;'>
          <path d='M 20 -2 l -15 0 c -3 0 -5 2 -5 6 l 6 0 c 0 -1 1 -2 3 -2 l 11 0 l 0 -4' fill="magenta" />
          <rect ref={this.legArrowRectangle} x="0" y="4" width="6" height="18" fill="magenta" />
        </svg>
        <svg class='dynamic-to-arrow' ref={this.toLegArrow} style='display: none;'>
          <path d='M 20 0 l -7 -7 l 0 5 l -4 0 c -2 0 -3 -1 -3 -2 l -6 0 c 0 4 2 6 5 6 l 8 0 l 0 5 l 7 -7' fill="magenta" />
        </svg>
      </div>
    );
  }
}