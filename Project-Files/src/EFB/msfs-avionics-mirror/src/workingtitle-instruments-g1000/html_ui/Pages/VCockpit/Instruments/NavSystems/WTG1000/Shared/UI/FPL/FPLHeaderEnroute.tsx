import { FPLStringHeader } from './FPLStringHeader';

/**
 * An FPL section header for enroute segments.
 */
export class FPLHeaderEnroute extends FPLStringHeader {
  /** @inheritdoc */
  public setCollapsed(setCollapsed: boolean): void {
    this._isCollapsed = setCollapsed;
    this.updateName();
  }

  /** @inheritdoc */
  protected updateName(): void {
    const segment = this.props.fms.getFlightPlan().getSegment(this.props.segment.segmentIndex);
    this.setIsVisible(segment.airway !== undefined || this.props.fms.isFirstEnrouteSegment(segment.segmentIndex));

    let name = '';
    if (segment !== undefined) {
      if (segment.airway !== undefined) {
        name = 'Airway - ' + segment.airway;
      } else {
        name = 'Enroute';
      }
      if (this.isCollapsed) {
        name += ' (collapsed)';
      }
    }

    this.textSub.set(name);
  }
}