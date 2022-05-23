import { ComponentProps, ComputedSubject, DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';
import { FlightPlanSegmentType, LegDefinition } from 'msfssdk/flightplan';
import { FacilityLoader, FacilityType, ICAO, LegType, Metar } from 'msfssdk/navigation';
import { Fms } from 'garminsdk/flightplan';
import { FlightPlanSelection } from '../../../../Shared/UI/FPL/FPLTypesAndProps';

/**
 * Component props for MFDFPLWeather.
 */
export interface MFDFPLWeatherProps extends ComponentProps {
  /** A facility loader. */
  facLoader: FacilityLoader;

  /** The flight management system. */
  fms: Fms;

  /** A subscribable which provides the selected flight plan element. */
  selection: Subscribable<FlightPlanSelection>;
}

/**
 * Displays METAR information based on the currently selected flight plan element.
 */
export class MFDFPLWeather extends DisplayComponent<MFDFPLWeatherProps> {
  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();
  private readonly textContainerRef = FSComponent.createRef<HTMLDivElement>();

  private readonly textSub = ComputedSubject.create<Metar | undefined, string>(undefined, metar => {
    return metar?.metarString ?? '';
  });

  private opId = 0;

  /** @inheritdoc */
  public onAfterRender(): void {
    this.props.selection.sub(selection => {
      let icao = '';
      if (selection) {
        if ('leg' in selection) {
          // selection is a LegDefinition
          icao = this.getNominalIcaoFromLeg(selection);
        } else {
          // selection is a FlightPlanSegment
          const plan = this.props.fms.getPrimaryFlightPlan();
          if (selection.segmentType === FlightPlanSegmentType.Departure && plan.procedureDetails.departureIndex < 0) {
            icao = plan.originAirport ?? '';
          } else if (selection.segmentType === FlightPlanSegmentType.Destination) {
            icao = plan.destinationAirport ?? '';
          }
        }
      }

      if (ICAO.isFacility(icao) && ICAO.getFacilityType(icao) === FacilityType.Airport) {
        this.updateMetarFromAirport(ICAO.getIdent(icao));
      } else {
        this.updateMetarFromAirport('');
      }
    }, true);

    // Note: subscribe here in onAfterRender to ensure that the handler is called after the div text is changed
    this.textSub.sub(this.updateFontSize.bind(this), true);
  }

  /**
   * Gets the ICAO of a flight plan leg's nominal facility.
   * @param leg A flight plan leg.
   * @returns The ICAO of the flight plan leg's nominal facility.
   */
  private getNominalIcaoFromLeg(leg: LegDefinition): string {
    switch (leg.leg.type) {
      case LegType.IF:
      case LegType.TF:
      case LegType.CF:
      case LegType.DF:
      case LegType.RF:
        return leg.leg.fixIcao;
      default:
        return '';
    }
  }

  /**
   * Updates this component's METAR with one from a specified airport.
   * @param ident The ident of the airport from which to retrieve a METAR, or an empty string if no METAR should be
   * retrieved.
   */
  private async updateMetarFromAirport(ident: string): Promise<void> {
    if (ident === '') {
      this.textSub.set(undefined);
      return;
    }

    const opId = ++this.opId;
    const metar = await this.props.facLoader.getMetar(ident);

    if (opId !== this.opId) {
      return;
    }

    this.textSub.set(metar);
  }

  /**
   * Updates this component's font size to prevent overflow.
   * @param text The displayed METAR text.
   */
  private updateFontSize(text: string): void {
    this.textContainerRef.instance.style.fontSize = '100%';

    if (text.length === 0) {
      return;
    }

    const rootHeight = this.rootRef.instance.clientHeight;
    const textHeight = this.textContainerRef.instance.clientHeight;

    if (textHeight > rootHeight) {
      const scale = rootHeight / textHeight;
      this.textContainerRef.instance.style.fontSize = `${scale * 100}%`;
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.rootRef} class='mfd-fpl-weather'>
        <div ref={this.textContainerRef}>{this.textSub}</div>
      </div>
    );
  }
}