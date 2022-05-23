import { DisplayComponent, Subject, FSComponent, VNode, UnitType, NumberUnitSubject, ComponentProps } from 'msfssdk';
import { ICAO, LegTurnDirection, LegType } from 'msfssdk/navigation';
import { OriginDestChangeType, FlightPlan, FlightPlanOriginDestEvent, LegDefinition } from 'msfssdk/flightplan';
import { DurationDisplay, DurationDisplayDelim, DurationDisplayFormat } from 'msfssdk/components/common';
import { NumberFormatter } from 'msfssdk/graphics/text';

import { NumberUnitDisplay } from '../../../../Shared/UI/Common/NumberUnitDisplay';

/**
 * Represent the origin segment of a flight plan listing.
 */
export class FPLOrigin extends DisplayComponent<ComponentProps> {
  private origin = Subject.create('_____');
  private destination = Subject.create('_____');
  private holdDistance = NumberUnitSubject.createFromNumberUnit(UnitType.METER.createNumber(0));
  private holdTime = NumberUnitSubject.createFromNumberUnit(UnitType.MINUTE.createNumber(0));
  private holdCourse = Subject.create('');

  private fplDirectTo = FSComponent.createRef<HTMLElement>();
  private origDestRef = FSComponent.createRef<HTMLElement>();
  private fplDirectHold = FSComponent.createRef<HTMLDivElement>();
  private holdSvg = FSComponent.createRef<SVGPathElement>();

  /**
   * Handles a origin/dest change event.
   * @param e The change event itself.
   */
  public onOriginDestChanged(e: FlightPlanOriginDestEvent): void {
    switch (e.type) {
      case OriginDestChangeType.OriginAdded:
        e.airport && this.origin.set(ICAO.getIdent(e.airport) + ' /');
        break;
      case OriginDestChangeType.OriginRemoved:
        this.origin.set('_____ /');
        break;
      case OriginDestChangeType.DestinationAdded:
        e.airport && this.destination.set(ICAO.getIdent(e.airport));
        break;
      case OriginDestChangeType.DestinationRemoved:
        this.destination.set('_____');
        break;
    }
  }

  /**
   * Handles when a random direct to is active and the FPL header should indicate such.
   * @param dtoIdent The ident for the direct to waypoint.
   * @param lastLeg The last leg in the direct to random segment.
   */
  public onDirectToRandomActive(dtoIdent: string, lastLeg: LegDefinition | null): void {
    this.origin.set('');
    this.destination.set(dtoIdent);
    this.fplDirectTo.instance.style.display = '';
    this.origDestRef.instance.style.color = 'white';
    if (lastLeg && (lastLeg.leg.type === LegType.HA || lastLeg.leg.type === LegType.HF || lastLeg.leg.type === LegType.HM)) {
      let svgD = 'm 5 6 l 23 0 m 0 -1 l 3 0 m 0 1 l 8 0 m -8 1 l 1 0 c 7 0 7 11 0 11 l -19 0 c -7 0 -7 -11 0 -11 l 15 0 m 0 1 l 3 0 ';
      if (lastLeg.leg.turnDirection === LegTurnDirection.Left) {
        svgD = 'm 5 18 l 22 0 m 0 -2 l 3 0 m 0 2 l 8 0 m -8 -1 l 1 0 c 7 0 7 -11 0 -11 l -19 0 c -7 0 -7 11 0 11 l 15 0 m 0 2 l 3 0 ';
      }
      this.holdSvg.instance.setAttribute('d', `${svgD}`);
      this.holdCourse.set(`${lastLeg.leg.course.toFixed(0).padStart(3, '0')}°`);

      if (lastLeg.leg.distanceMinutes) {
        this.holdTime.set(lastLeg.leg.distance, UnitType.MINUTE);
        this.fplDirectHold.instance.classList.add('show-time');
        this.fplDirectHold.instance.classList.remove('show-distance');
      } else {
        this.holdDistance.set(lastLeg.leg.distance, UnitType.METER);
        this.fplDirectHold.instance.classList.add('show-distance');
        this.fplDirectHold.instance.classList.remove('show-time');
      }
      this.fplDirectHold.instance.style.display = '';
    } else {
      this.fplDirectHold.instance.style.display = 'none';
    }
  }

  /**
   * Handles when a random direct to is canceled.
   * @param plan is the Flightplan
   */
  public removeDirectToRandom(plan: FlightPlan): void {
    this.fplDirectTo.instance.style.display = 'none';
    this.fplDirectHold.instance.style.display = 'none';
    this.origDestRef.instance.style.color = 'cyan';

    const origin = plan.originAirport;
    if (origin !== undefined) {
      this.setOrigin(ICAO.getIdent(origin));
    } else {
      this.setOrigin('_____');
    }
    const destination = plan.destinationAirport;
    if (destination !== undefined) {
      this.setDestination(ICAO.getIdent(destination));
    } else {
      this.setDestination('_____');
    }
  }

  /**
   * Handles setting the origin string.
   * @param origin The ident for the origin.
   */
  public setOrigin(origin: string): void {
    this.origin.set(origin + ' /');
  }

  /**
   * Handles setting the destination string.
   * @param destination The ident for the origin.
   */
  public setDestination(destination: string): void {
    this.destination.set(destination);
  }

  /**
   * Initializes the Direct To symbol to hidden
   */
  public onAfterRender(): void {
    this.fplDirectTo.instance.style.display = 'none';
    this.fplDirectHold.instance.style.display = 'none';
  }

  /**
   * Render an origin block.
   * @returns a VNode.
   */
  public render(): VNode {
    return (
      <div id="origDest" ref={this.origDestRef}>
        <span>{this.origin}</span>
        <span>{this.destination}</span>
        <div class="fpl-directTo" ref={this.fplDirectTo}>
          <svg>
            <path d='m 27 13 l -7.2 -7.2 l 0 5.04 l -19.04 0 l 0 4.32 l 19.04 0 l 0 5.04 l 7.2 -7.2 z' fill="magenta" scale="1" />
            <text x="4" y="20" fill="magenta" size="12">D</text>
          </svg>
        </div>
        <div class="fpl-directHold" ref={this.fplDirectHold}>
          <div class="fpl-hold-distance">
            <NumberUnitDisplay
              value={this.holdDistance}
              displayUnit={Subject.create(UnitType.NMILE)}
              formatter={NumberFormatter.create({ precision: 0.1, forceDecimalZeroes: true, maxDigits: 2 })}
              class='numberunit-display'
            />
            <DurationDisplay
              value={this.holdTime}
              options={{ delim: DurationDisplayDelim.Colon, nanString: '', format: DurationDisplayFormat.mm_ss, pad: 1 }}
              class='duration-display'
            />
          </div>
          <div class="fpl-holdIcon">
            <svg height="29px" width="45px">
              <path ref={this.holdSvg} d='m 20 6 l 22 0 m 0 -2 l 3 0 m 0 2 l 8 0 m -8 -1 l 1 0 c 7 0 7 -11 0 -11 l -19 0 c -7 0 -7 11 0 11 l 15 0 m 0 2 l 3 0 '
                fill="none" stroke="magenta" stroke-width="2px" scale="1" />
            </svg>
          </div>
          <div class="fpl-hold-course">{this.holdCourse}</div>
        </div>
      </div>
    );
  }
}