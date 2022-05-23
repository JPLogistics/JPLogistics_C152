import { ComponentProps, DisplayComponent, FSComponent, Subscription, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { ClockEvents } from 'msfssdk/instruments';
import { UserSettingManager } from 'msfssdk/settings';
import { DateTimeUserSettingTypes } from '../../settings/DateTimeUserSettings';
import { UnitsUserSettingManager } from '../../settings/UnitsUserSettings';
import { NavDataField } from '../navdatafield/NavDataField';
import { NavDataFieldType } from '../navdatafield/NavDataFieldType';
import { DefaultNavDataBarFieldRenderer } from './DefaultNavDataBarFieldRenderer';
import { NavDataBarFieldModel, NavDataBarFieldModelFactory } from './NavDataBarFieldModel';
import { NavDataBarSettingTypes } from '../../settings/NavDataBarUserSettings';

/**
 * Component props for NavDataBar.
 */
export interface NavDataBarProps extends ComponentProps {
  /** The event bus. */
  bus: EventBus;

  /** The number of navigation data fields displayed. */
  fieldCount: number;

  /** A navigation data bar field model factory. */
  modelFactory: NavDataBarFieldModelFactory;

  /** A user setting manager for the settings that control the data bar's field types. */
  dataBarSettingManager: UserSettingManager<NavDataBarSettingTypes>;

  /** A user setting manager for measurement units. */
  unitsSettingManager: UnitsUserSettingManager;

  /** A user setting manager for date/time settings. */
  dateTimeSettingManager: UserSettingManager<DateTimeUserSettingTypes>;

  /** The update frequency of the data fields, in hertz. */
  updateFreq: number;
}

/**
 * A navigation data bar. Displays zero or more navigation data fields.
 *
 * The root element of the status bar contains the `nav-data-bar` CSS class by default.
 */
export class NavDataBar extends DisplayComponent<NavDataBarProps> {
  private readonly fieldRenderer = new DefaultNavDataBarFieldRenderer(this.props.unitsSettingManager, this.props.dateTimeSettingManager);

  private readonly fieldCount = Math.max(0, this.props.fieldCount);
  private readonly fieldSlots: VNode[] = Array.from({ length: this.fieldCount }, () => <div />);
  private readonly fields: NavDataField<any>[] = [];
  private readonly models: NavDataBarFieldModel<any>[] = [];

  private readonly settingSubs: Subscription[] = [];
  private clockSub?: Subscription;

  /** @inheritdoc */
  public onAfterRender(): void {
    for (let i = 0; i < this.fieldCount; i++) {
      this.settingSubs[i] = this.props.dataBarSettingManager.whenSettingChanged(`navDataBarField${i}`).handle(this.onFieldSettingChanged.bind(this, i));
    }

    this.clockSub = this.props.bus.getSubscriber<ClockEvents>().on('realTime').whenChangedBy(1000 / this.props.updateFreq).handle(this.onUpdated.bind(this));
  }

  /**
   * Responds to changes in field settings.
   * @param index The index of the field whose setting changed.
   * @param type The new setting.
   */
  private onFieldSettingChanged(index: number, type: NavDataFieldType): void {
    const slot = this.fieldSlots[index].instance as HTMLDivElement;

    slot.innerHTML = '';
    this.fields[index]?.destroy();
    this.models[index]?.destroy();

    const model = this.props.modelFactory.create(type);
    model.update();
    const field = this.fieldRenderer.render(type, model);

    this.models[index] = model;
    FSComponent.render(field, slot);
    this.fields[index] = field.instance as NavDataField<any>;
  }

  /**
   * Responds to update events.
   */
  private onUpdated(): void {
    for (let i = 0; i < this.fieldCount; i++) {
      this.models[i].update();
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class='nav-data-bar'>{this.fieldSlots}</div>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.clockSub?.destroy();

    for (let i = 0; i < this.fieldCount; i++) {
      this.settingSubs[i].destroy();
      this.fields[i]?.destroy();
      this.models[i]?.destroy();
    }
  }
}