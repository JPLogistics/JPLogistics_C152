import { ArraySubject, ComponentProps, DisplayComponent, FSComponent, NodeReference, NumberFormatter, NumberUnitInterface, NumberUnitSubject, SubscribableArray, Subject, VNode, UnitFamily, Subscribable } from 'msfssdk';
import { UserSettingManager, UserSettingValueFilter } from 'msfssdk/settings';
import { MapUserSettingTypes } from '../../Map/MapUserSettings';
import { NumberUnitDisplay } from '../Common/NumberUnitDisplay';
import { ContextMenuDialog, ContextMenuItemDefinition } from '../Dialogs/ContextMenuDialog';
import { ScrollableControl } from '../UiView';
import { UserSettingSelectControl } from '../UserSettings/UserSettingSelectControl';
import { UserSettingToggleControl } from '../UserSettings/UserSettingToggleControl';

/**
 * Component props for MapSettingControl.
 */
export interface MapSettingControlProps<K extends keyof MapUserSettingTypes> extends ComponentProps {
  /** The function to use to register the setting control. */
  registerFunc: (control: ScrollableControl) => void;

  /** A map settings manager. */
  settingManager: UserSettingManager<MapUserSettingTypes>;

  /** The name of the setting to control. */
  settingName: K;

  /** CSS class(es) to add to the root of the control component. */
  class?: string;
}

/**
 * A component which controls a map setting.
 */
export abstract class MapSettingControl<K extends keyof MapUserSettingTypes, P extends MapSettingControlProps<K>> extends DisplayComponent<P> {
  protected readonly setting = this.props.settingManager.getSetting(this.props.settingName);
}

/**
 * A component which controls an on/off map setting.
 */
export class MapToggleSettingControl<K extends keyof UserSettingValueFilter<MapUserSettingTypes, boolean>> extends MapSettingControl<K, MapSettingControlProps<K>> {
  /** @inheritdoc */
  public render(): VNode {
    return (
      <UserSettingToggleControl<MapUserSettingTypes, K>
        settingManager={this.props.settingManager}
        settingName={this.props.settingName}
        registerFunc={this.props.registerFunc}
        falseText='Off'
        trueText='On'
        class={`mapsettings-control ${this.props.class ?? ''}`}
      />
    );
  }
}

/**
 * Component props for MapEnumSettingControl.
 */
export interface MapEnumSettingControlProps<K extends keyof MapUserSettingTypes> extends MapSettingControlProps<K> {
  /** An array of values assignable to the setting. */
  values: SubscribableArray<MapUserSettingTypes[K]>;

  /** An array of text representations of setting values. */
  valueText: SubscribableArray<string>;

  /** The HTML container in which the control resides. */
  outerContainer: NodeReference<HTMLElement>;
}

/**
 * A component which controls a map setting which can take on one of several enumerated values.
 */
export class MapEnumSettingControl<K extends keyof MapUserSettingTypes> extends MapSettingControl<K, MapEnumSettingControlProps<K>> {
  /** @inheritdoc */
  public render(): VNode {
    return (
      <UserSettingSelectControl<MapUserSettingTypes, K>
        settingManager={this.props.settingManager}
        settingName={this.props.settingName}
        values={this.props.values}
        valueText={this.props.valueText}
        outerContainer={this.props.outerContainer}
        registerFunc={this.props.registerFunc}
        class={`mapsettings-control ${this.props.class ?? ''}`}
      />
    );
  }
}

/**
 * Component props for MapRangeSettingControl.
 */
export interface MapRangeSettingControlProps<K extends keyof UserSettingValueFilter<MapUserSettingTypes, number>> extends MapSettingControlProps<K> {
  /** The values (range indexes) which can be assigned to the setting. */
  values: number[];

  /** A subscribable array which provides the map range values. */
  mapRanges: Subscribable<readonly NumberUnitInterface<UnitFamily.Distance>[]>;

  /** The HTML container in which the control resides. */
  outerContainer: NodeReference<HTMLElement>;
}

/**
 * A component which controls a map setting with values which represent map range indexes.
 */
export class MapRangeSettingControl<K extends keyof UserSettingValueFilter<MapUserSettingTypes, number>> extends MapSettingControl<K, MapRangeSettingControlProps<K>> {
  private static readonly NUMBER_FORMATTER = NumberFormatter.create({ precision: 0.1, forceDecimalZeroes: false, maxDigits: 3 });

  private readonly valuesSub = ArraySubject.create(Array.from(this.props.values));

  /** @inheritdoc */
  constructor(props: MapRangeSettingControlProps<K>) {
    super(props);

    this.props.mapRanges.sub(this.onMapRangesChanged.bind(this), true);
  }

  /**
   * A callback which is called when the map range values change.
   */
  private onMapRangesChanged(): void {
    // force a refresh of the SelectControl
    this.valuesSub.set(this.props.values);
  }

  /**
   * Builds a menu item definition for a range index value.
   * @param value A range index value.
   * @param index The index of the value in the menu.
   * @returns a menu item definition for the range index value.
   */
  private buildMenuItem(value: number, index: number): ContextMenuItemDefinition {
    return {
      id: `${index}`,
      renderContent: (): VNode => {
        return (
          <NumberUnitDisplay
            value={NumberUnitSubject.createFromNumberUnit(this.props.mapRanges.get()[value].copy())}
            displayUnit={Subject.create(null)}
            formatter={MapRangeSettingControl.NUMBER_FORMATTER}
          />
        );
      },
      estimatedWidth: ContextMenuDialog.CHAR_WIDTH * 6
    };
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <UserSettingSelectControl<MapUserSettingTypes, K>
        settingManager={this.props.settingManager}
        settingName={this.props.settingName}
        values={this.valuesSub as unknown as SubscribableArray<MapUserSettingTypes[K]>}
        outerContainer={this.props.outerContainer}
        registerFunc={this.props.registerFunc}
        buildMenuItem={this.buildMenuItem.bind(this)}
        class={`mapsettings-control ${this.props.class ?? ''}`}
      />
    );
  }
}