import { FSComponent, Subject, VNode } from 'msfssdk';
import { ControlPublisher } from 'msfssdk/data';
import { VorFacility } from 'msfssdk/navigation';
import { G1000UiControl, G1000UiControlProps } from '../../../../../Shared/UI/G1000UiControl';
import { GroupBox } from '../../GroupBox';

import './FrequencyGroup.css';

/**
 * Props on the FrequencyGroup component.
 */
interface FrequencyGroupProps extends G1000UiControlProps {
  /** The control publisher to publish radio control events with. */
  controlPublisher: ControlPublisher;
}

/**
 * A component that displays frequency information about a VOR on the
 * MFD nearest VORs page.
 */
export class FrequencyGroup extends G1000UiControl<FrequencyGroupProps> {

  private readonly content = FSComponent.createRef<HTMLDivElement>();
  private readonly frequencyEl = FSComponent.createRef<HTMLDivElement>();
  private readonly frequency = Subject.create<string>('');

  /**
   * Sets the facility to display in this group.
   * @param facility The facility to display.
   */
  public set(facility: VorFacility | null): void {
    if (facility !== null) {
      this.frequency.set(facility.freqMHz.toFixed(2));
      this.content.instance.classList.remove('hidden-element');
    } else {
      this.content.instance.classList.add('hidden-element');
    }
  }

  /** @inheritdoc */
  protected onFocused(source: G1000UiControl): void {
    this.frequencyEl.instance.classList.add('highlight-select');
    super.onFocused(source);
  }

  /** @inheritdoc */
  protected onBlurred(source: G1000UiControl): void {
    this.frequencyEl.instance.classList.remove('highlight-select');
    super.onFocused(source);
  }

  /** @inheritdoc */
  public onEnter(): boolean {
    this.props.controlPublisher.publishEvent('standby_nav_freq', this.frequency.get());
    return true;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='Frequency'>
        <div class="mfd-nearest-vor-frequency hidden-element" ref={this.content}>
          <div class='mfd-nearest-vor-frequency-number' ref={this.frequencyEl}>{this.frequency}</div>
        </div>
      </GroupBox>
    );
  }
}