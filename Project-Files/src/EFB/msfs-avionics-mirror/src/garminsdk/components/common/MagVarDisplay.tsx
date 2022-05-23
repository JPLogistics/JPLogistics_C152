import { ComponentProps, DisplayComponent, FSComponent, MappedSubscribable, Subscribable, SubscribableSet, VNode } from 'msfssdk';

/**
 * Component props for displaing a magvar.
 */
export interface MagVarDisplayProps extends ComponentProps {
  /**
   * The magnetic variation to display, or a subscribable which provides it. By convention, positive values indicate
   * deviation to the east of true north.
   */
  magvar: number | Subscribable<number>;

  /** CSS class(es) to apply to the root of the component. */
  class?: string | SubscribableSet<string>;
}

/**
 * Text display of a magnetic variation as degrees east or west.
 */
export class MagVarDisplay extends DisplayComponent<MagVarDisplayProps> {
  private static readonly FORMATTER = (magvar: number): string => {
    // Force any finite magnetic variation value into the domain of [-180, 180].
    const magVarCorrected = ((magvar + 540) % 360 - 180);

    // Rendering this way means we may variously show 0W or 0E depending on the fractional
    // part of the value, but this is accurate to testing with the trainer.  Start at a
    // place where the plane's magvar on the setup page is shown as 0W, then fly west, and
    // eventually it switches to 0E before proceeding on to 1E.  A value of precisely 0
    // will be shown as east, which also seems to match how the trainer displays VORs with
    // a 0 station magvar: they, empirically, all seem to show 0E.
    return `${Math.abs(magVarCorrected).toFixed(0)}°${magVarCorrected < 0 ? 'W' : 'E'}`;
  };

  private readonly text = typeof this.props.magvar === 'object'
    ? (this.magvarSub = this.props.magvar.map(MagVarDisplay.FORMATTER))
    : MagVarDisplay.FORMATTER(this.props.magvar);

  private magvarSub?: MappedSubscribable<string>;

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''}>{this.text}</div>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.magvarSub?.destroy();
  }
}