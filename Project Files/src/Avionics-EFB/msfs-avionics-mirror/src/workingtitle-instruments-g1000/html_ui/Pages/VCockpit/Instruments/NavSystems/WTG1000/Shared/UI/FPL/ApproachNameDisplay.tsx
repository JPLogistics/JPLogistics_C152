import { FSComponent, ComponentProps, DisplayComponent, VNode, Subscribable, Subject } from 'msfssdk';
import { AirportFacility, ApproachProcedure, ICAO } from 'msfssdk/navigation';
import { FmsUtils } from '../../FlightPlan/FmsUtils';

import './ApproachNameDisplay.css';

/** Properties for a VNode representing an approach name. */
export interface ApproachNameDisplayProps extends ComponentProps {
  /** A subscribable which provides an approach procedure. */
  approach: Subscribable<ApproachProcedure | null>;

  /**
   * A subscribable which provides the approach's parent airport. If no subscribable is provided or its value is null,
   * the airport ident will not be displayed as part of the approach name.
   */
  airport?: Subscribable<AirportFacility | null>;

  /** The text to display when the approach is null. Defaults to the empty string. */
  nullText?: string;

  /** CSS class(es) to apply to the root of the component. */
  class?: string;
}

/** A VNode representing a preformated rendering of an approach's name. */
export class ApproachNameDisplay extends DisplayComponent<ApproachNameDisplayProps> {
  private readonly nameRef = FSComponent.createRef<HTMLSpanElement>();
  private readonly airportRef = FSComponent.createRef<HTMLSpanElement>();
  private readonly subTypeRef = FSComponent.createRef<HTMLSpanElement>();
  private readonly suffixRef = FSComponent.createRef<HTMLSpanElement>();
  private readonly runwayRef = FSComponent.createRef<HTMLSpanElement>();
  private readonly flagsRef = FSComponent.createRef<HTMLSpanElement>();
  private readonly nullRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly airportSub = this.props.airport?.map(airport => airport ? ICAO.getIdent(airport.icao) : '') ?? Subject.create('');

  private readonly namePartsSub = this.props.approach.map(approach => approach ? FmsUtils.getApproachNameAsParts(approach) : null);
  private readonly typeSub = this.namePartsSub.map(parts => parts?.type ?? '');
  private readonly subTypeSub = this.namePartsSub.map(parts => parts?.subtype ?? '');
  private readonly suffixConnectorSub = this.namePartsSub.map(parts => !parts || parts.runway ? ' ' : '–');
  private readonly suffixSub = this.namePartsSub.map(parts => parts?.suffix ?? '');
  private readonly runwaySub = this.namePartsSub.map(parts => parts?.runway ?? '');
  private readonly flagsSub = this.namePartsSub.map(parts => parts?.flags ?? '');

  /** @inheritdoc */
  public onAfterRender(): void {
    this.namePartsSub.sub(parts => {
      this.nameRef.instance.style.display = parts ? '' : 'none';
      this.nullRef.instance.style.display = this.props.nullText === undefined || parts ? 'none' : '';
    }, true);

    this.airportSub.sub(value => { this.airportRef.instance.style.display = value === '' ? 'none' : ''; }, true);
    this.subTypeSub.sub(value => { this.subTypeRef.instance.style.display = value === '' ? 'none' : ''; }, true);
    this.suffixSub.sub(value => { this.suffixRef.instance.style.display = value === '' ? 'none' : ''; }, true);
    this.runwaySub.sub(value => { this.flagsRef.instance.style.display = value === '' ? 'none' : ''; }, true);
    this.flagsSub.sub(value => { this.flagsRef.instance.style.display = value === '' ? 'none' : ''; }, true);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={`appr-name ${this.props.class ?? ''}`}>
        <span ref={this.nameRef}>
          <span ref={this.airportRef}>{this.airportSub}–</span>
          <span>{this.typeSub}</span>
          <span ref={this.subTypeRef} class='appr-name-subtype'>{this.subTypeSub}</span>
          <span ref={this.suffixRef}>{this.suffixConnectorSub}{this.suffixSub}</span>
          <span ref={this.runwayRef}> {this.runwaySub}</span>
          <span ref={this.flagsRef}> {this.flagsSub}</span>
        </span>
        <span ref={this.nullRef}>{this.props.nullText ?? ''}</span>
      </div>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    this.namePartsSub.destroy();
  }
}