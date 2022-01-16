import { ArraySubject, FSComponent, Subject, VNode } from 'msfssdk';
import { AirportFacility, ApproachProcedure } from 'msfssdk/navigation';
import { ControlList } from '../../../../../Shared/UI/ControlList';
import { ApproachNameDisplay } from '../../../../../Shared/UI/FPL/ApproachNameDisplay';
import { UiControl2, UiControl2Props } from '../../../../../Shared/UI/UiControl2';
import { GroupBox } from '../../GroupBox';

import './ApproachesGroup.css';

/**
 * Props on the ApproachesGroup component.
 */
export interface ApproachesGroupProps extends UiControl2Props {
  /** A callback called when an approach is selected. */
  onSelected: (approach: ApproachProcedure | undefined) => void;
}

/**
 * A component that displays the available approaches on a nearest airport on
 * the MFD nearest airports page.
 */
export class ApproachesGroup extends UiControl2<ApproachesGroupProps> {
  private readonly approaches = ArraySubject.create<ApproachProcedure>();
  private readonly approachList = FSComponent.createRef<ControlList<ApproachProcedure>>();
  private facility: AirportFacility | undefined;

  /** @inheritdoc */
  protected onEnter(): boolean {
    this.approachList.instance.scroll('forward');
    return true;
  }

  /**
   * Sets the airport facility to display in this group.
   * @param facility The facility to display.
   */
  public set(facility: AirportFacility | null): void {
    this.facility = facility ?? undefined;

    if (this.facility === undefined) {
      this.approaches.set([]);
    } else {
      this.approaches.set(this.facility.approaches.filter(a => a.approachType !== ApproachType.APPROACH_TYPE_LOCALIZER));
    }
  }

  /**
   * Builds an approach item in the nearest airports approaches list.
   * @param approach The approach to build the list item for.
   * @returns A new approach list item.
   * @throws An error if the facility is undefined.
   */
  private buildApproachItem(approach: ApproachProcedure): VNode {
    if (this.facility === undefined) {
      throw new Error('Facility was undefined');
    }

    return (
      <ApproachItem approach={approach} facility={this.facility}
        onFocused={(): void => this.props.onSelected(approach)}
        onBlurred={(): void => this.props.onSelected(undefined)}
        innerKnobScroll />
    );
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <GroupBox title='Approaches'>
        <ControlList
          innerKnobScroll
          class='mfd-nearest-airport-approaches'
          data={this.approaches}
          renderItem={this.buildApproachItem.bind(this)}
          ref={this.approachList} />
      </GroupBox>
    );
  }
}

/**
 * Props on the ApproachItem component.
 */
interface ApproachItemProps extends UiControl2Props {
  /** The approach to display. */
  approach: ApproachProcedure;

  /** The airport associated with the approach. */
  facility: AirportFacility;
}

/**
 * A component that indicates an approach in the nearest airports approach list.
 */
class ApproachItem extends UiControl2<ApproachItemProps> {
  private readonly el = FSComponent.createRef<HTMLDivElement>();

  /** @inheritdoc */
  protected onFocused(source: UiControl2): void {
    this.el.instance.classList.add('highlight-select');
    super.onFocused(source);
  }

  /** @inheritdoc */
  protected onBlurred(source: UiControl2): void {
    this.el.instance.classList.remove('highlight-select');
    super.onBlurred(source);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class='mfd-nearest-airport-approach' ref={this.el}>
        <ApproachNameDisplay approach={Subject.create(this.props.approach)} airport={Subject.create(this.props.facility)} />
      </div>
    );
  }
}