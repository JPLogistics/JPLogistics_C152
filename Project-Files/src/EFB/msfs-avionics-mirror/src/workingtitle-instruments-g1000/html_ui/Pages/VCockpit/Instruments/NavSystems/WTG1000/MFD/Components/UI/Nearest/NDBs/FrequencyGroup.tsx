import { DisplayComponent, FSComponent, Subject, VNode } from 'msfssdk';
import { NdbFacility } from 'msfssdk/navigation';
import { GroupBox } from '../../GroupBox';

import './FrequencyGroup.css';

/**
 * A component that displays frequency information about a NDB on the
 * MFD nearest NDBs page.
 */
export class FrequencyGroup extends DisplayComponent<any> {

  private readonly content = FSComponent.createRef<HTMLDivElement>();
  private readonly frequency = Subject.create<string>('');

  /**
   * Sets the facility to display in this group.
   * @param facility The facility to display.
   */
  public set(facility: NdbFacility | null): void {
    if (facility !== null) {
      this.frequency.set(facility.freqMHz.toFixed(1));
      this.content.instance.classList.remove('hidden-element');
    } else {
      this.content.instance.classList.add('hidden-element');
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='Frequency'>
        <div class="mfd-nearest-ndb-frequency hidden-element" ref={this.content}>
          <div class='mfd-nearest-ndb-frequency-number'>{this.frequency}</div>
        </div>
      </GroupBox>
    );
  }
}