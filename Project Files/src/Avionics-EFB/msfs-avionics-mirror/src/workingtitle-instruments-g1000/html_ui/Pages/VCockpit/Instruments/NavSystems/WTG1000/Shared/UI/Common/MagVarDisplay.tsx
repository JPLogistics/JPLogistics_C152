import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';

/**
 * Component props for displaing a magvar.
 */
export interface MagVarDisplayProps extends ComponentProps {
  /** A subscribable providing the magnetic variation with negative values being west declination and positive east. */
  magvar: Subscribable<number>;
  /** CSS class(es) to apply to the root of the component. */
  class?: string;
}

/**
 * Text display of a magnetic variation as degrees east or west.
 */
export class MagVarDisplay extends DisplayComponent<MagVarDisplayProps> {
  private valueSub = this.props.magvar.map(magvar => {
    // Force any finite magnetic variation value into the domain of [-180, 180].
    const magVarCorrected = ((magvar + 540) % 360 - 180);

    // Rendering this way means we may variously show 0W or 0E depending on the fractional
    // part of the value, but this is accurate to testing with the trainer.  Start at a
    // place where the plane's magvar on the setup page is shown as 0W, then fly west, and
    // eventually it switches to 0E before proceeding on to 1E.  A value of precisely 0
    // will be shown as east, which also seems to match how the trainer displays VORs with
    // a 0 station magvar: they, empirically, all seem to show 0E.
    return `${Math.abs(magVarCorrected).toFixed(0)}°${magVarCorrected < 0 ? 'W' : 'E'}`;
  });

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''}>{this.valueSub}</div>
    );
  }
}