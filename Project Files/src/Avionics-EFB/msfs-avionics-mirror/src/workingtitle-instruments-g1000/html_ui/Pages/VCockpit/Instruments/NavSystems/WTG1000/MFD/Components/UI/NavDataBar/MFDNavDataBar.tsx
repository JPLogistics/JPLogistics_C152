import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { ClockEvents } from 'msfssdk/instruments';
import { UserSettingManager } from 'msfssdk/settings';
import { NavDataField } from '../../../../Shared/UI/NavDataField/NavDataField';
import { MFDNavDataBarFieldModel, MFDNavDataBarFieldModelFactory } from './MFDNavDataBarFieldModel';
import { NavDataFieldType } from '../../../../Shared/UI/NavDataField/NavDataFieldType';
import { MFDNavDataBarSettingName, MFDNavDataBarSettingTypes } from './MFDNavDataBarUserSettings';
import { UiPage } from '../../../../Shared/UI/UiPage';
import { UnitsUserSettingManager } from '../../../../Shared/Units/UnitsUserSettings';
import { DefaultMFDNavDataBarFieldRenderer } from './DefaultMFDNavDataBarFieldRenderer';

import './MFDNavDataBar.css';

/**
 * Component props for NavDataBar.
 */
export interface MFDNavDataBarProps extends ComponentProps {
  /** The event bus. */
  bus: EventBus;

  /** A navigation data bar field model factory. */
  modelFactory: MFDNavDataBarFieldModelFactory;

  /** A user setting manager for the settings that control the data bar's field types. */
  dataBarSettingManager: UserSettingManager<MFDNavDataBarSettingTypes>;

  /** A user setting manager for measurement units. */
  unitsSettingManager: UnitsUserSettingManager;

  /** The update frequency of the data fields, in hertz. */
  updateFreq: number;

  /** A subscribable which provides the current open page. */
  openPage: Subscribable<UiPage | null>;
}

/**
 * An MFD navigation data bar. Displays four navigation data fields in addition to the title of the current open MFD
 * page.
 */
export class MFDNavDataBar extends DisplayComponent<MFDNavDataBarProps> {
  private static readonly FIELD_COUNT = 4;

  private readonly fieldRenderer = new DefaultMFDNavDataBarFieldRenderer(this.props.unitsSettingManager);

  private readonly fieldSlots: VNode[] = [];
  private readonly fields: NavDataField<any>[] = [];
  private readonly models: MFDNavDataBarFieldModel<any>[] = [];

  /** @inheritdoc */
  constructor(props: MFDNavDataBarProps) {
    super(props);

    for (let i = 0; i < MFDNavDataBar.FIELD_COUNT; i++) {
      this.fieldSlots[i] = <div />;
    }
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    for (let i = 0; i < MFDNavDataBar.FIELD_COUNT; i++) {
      this.props.dataBarSettingManager.whenSettingChanged(`navDataBarField${i}` as MFDNavDataBarSettingName).handle(this.onFieldSettingChanged.bind(this, i));
    }

    this.props.bus.getSubscriber<ClockEvents>().on('realTime').whenChangedBy(1000 / this.props.updateFreq).handle(this.onUpdated.bind(this));
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
    for (let i = 0; i < MFDNavDataBar.FIELD_COUNT; i++) {
      this.models[i].update();
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class='nav-data-bar'>
        <div class='nav-data-bar-fields'>{this.fieldSlots}</div>
        <PageTitle openPage={this.props.openPage} />
      </div>
    );
  }
}

/**
 * Component props for PageTitle.
 */
interface PageTitleProps extends ComponentProps {
  /** A subscribable which provides the current open page. */
  openPage: Subscribable<UiPage | null>;
}

/**
 * Displays the title of the current open MFD page.
 */
class PageTitle extends DisplayComponent<PageTitleProps> {
  private readonly textSub = Subject.create('');
  private oldPage: UiPage | null = null;

  private readonly titleHandler = (title: string): void => { this.textSub.set(title); }

  /** @inheritdoc */
  public onAfterRender(): void {
    this.props.openPage.sub(this.onOpenPageChanged.bind(this), true);
  }

  /**
   * Responds to changes in the currently open page.
   * @param page The new open page.
   */
  private onOpenPageChanged(page: UiPage | null): void {
    this.oldPage?.title.unsub(this.titleHandler);
    page && page.title.sub(this.titleHandler, true);
    this.oldPage = page;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class='nav-data-bar-page-title'>{this.textSub}</div>
    );
  }
}