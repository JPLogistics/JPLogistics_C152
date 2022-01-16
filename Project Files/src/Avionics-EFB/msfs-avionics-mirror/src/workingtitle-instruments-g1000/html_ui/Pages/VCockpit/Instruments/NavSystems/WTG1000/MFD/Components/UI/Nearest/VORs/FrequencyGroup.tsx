import { FSComponent, Subject, VNode } from 'msfssdk';
import { ControlPublisher } from 'msfssdk/data';
import { VorFacility } from 'msfssdk/navigation';
import { UiControl2, UiControl2Props } from '../../../../../Shared/UI/UiControl2';
import { GroupBox } from '../../GroupBox';

import './FrequencyGroup.css';

/**
 * Props on the FrequencyGroup component.
 */
interface FrequencyGroupProps extends UiControl2Props {
  /** The control publisher to publish radio control events with. */
  controlPublisher: ControlPublisher;
}

/**
 * A component that displays frequency information about a VOR on the
 * MFD nearest VORs page.
 */
export class FrequencyGroup extends UiControl2<FrequencyGroupProps> {

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
  protected onFocused(): void {
    this.frequencyEl.instance.classList.add('highlight-select');
  }

  /** @inheritdoc */
  protected onBlurred(): void {
    this.frequencyEl.instance.classList.remove('highlight-select');
  }

  /** @inheritdoc */
  protected onEnter(): boolean {
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