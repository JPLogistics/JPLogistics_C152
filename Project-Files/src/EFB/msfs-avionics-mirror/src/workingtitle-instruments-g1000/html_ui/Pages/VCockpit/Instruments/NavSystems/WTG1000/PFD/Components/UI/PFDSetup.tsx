import { ArraySubject, ComponentProps, DisplayComponent, FSComponent, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { UserSettingManager } from 'msfssdk/settings';

import { UiViewProps, UiView } from '../../../Shared/UI/UiView';
import { ArrowToggle } from '../../../Shared/UI/UIControls/ArrowToggle';
import { SelectControl } from '../../../Shared/UI/UIControls/SelectControl';
import { UiControl } from '../../../Shared/UI/UiControl';
import { ContextMenuDialog, ContextMenuItemDefinition } from '../../../Shared/UI/Dialogs/ContextMenuDialog';
import { BacklightIntensitySettingName, BacklightMode, BacklightModeSettingName, BacklightUserSettings, BacklightUserSettingTypes } from '../../../Shared/Backlight/BacklightUserSettings';
import { UserSettingSelectController } from '../../../Shared/UI/UserSettings/UserSettingSelectController';
import { UserSettingNumberController } from '../../../Shared/UI/UserSettings/UserSettingNumberController';
import { G1000UiControlWrapper } from '../../../Shared/UI/UiControls2/G1000UiControlWrapper';
import { DigitInput } from '../../../Shared/UI/UiControls2/DigitInput';

import './PFDSetup.css';
import { ViewService } from '../../../Shared/UI/ViewService';

/**Options for controlling the brightness of an item. */
interface ItemBrightnessOptions extends ComponentProps {

  /** The View Service. */
  viewService: ViewService;

  /** Register function for interior UIControls */
  onRegister: (control: UiControl) => void;

  /** A backlight settings manager. */
  settingManager: UserSettingManager<BacklightUserSettingTypes>;

  /** The name of the backlight mode setting. */
  modeSettingName: BacklightModeSettingName;

  /** The name of the backlight intensity setting. */
  intensitySettingName: BacklightIntensitySettingName;

  /** Is this missing a manual mode (for key brightness, currently) */
  noManualMode?: boolean;
}

/** Brightness control for a portion of a display. */
class ItemBrightnessControl extends DisplayComponent<ItemBrightnessOptions> {
  private static readonly MODE_TEXT = {
    [BacklightMode.Auto]: 'Auto',
    [BacklightMode.Manual]: 'Manual'
  };

  private readonly container = FSComponent.createRef<HTMLDivElement>();
  private readonly modeDiv = FSComponent.createRef<HTMLDivElement>();
  private readonly modeControl = FSComponent.createRef<SelectControl<BacklightMode>>();
  private readonly valDiv = FSComponent.createRef<HTMLDivElement>();
  private readonly valInput = FSComponent.createRef<DigitInput>();

  private readonly modeValues = ArraySubject.create(
    this.props.noManualMode
      ? [BacklightMode.Auto]
      : [BacklightMode.Auto, BacklightMode.Manual]
  );

  private readonly modeSetting = this.props.settingManager.getSetting(this.props.modeSettingName);
  private readonly modeController = new UserSettingSelectController(
    this.props.settingManager, this.props.modeSettingName,
    this.modeValues,
    this.modeControl
  );

  private readonly intensitySetting = this.props.settingManager.getSetting(this.props.intensitySettingName);
  private readonly intensityController = new UserSettingNumberController(this.props.settingManager, this.props.intensitySettingName);

  /** Init after rendering. */
  public onAfterRender(): void {
    this.props.settingManager.whenSettingChanged(this.props.modeSettingName).handle(this.onManAutoSelected.bind(this));
    this.modeController.init();
    this.intensityController.init();
  }

  /**
   * Disable the element.
   */
  public disable(): void {
    this.container.instance.style.display = 'none';
    this.valInput.instance.setDisabled(true);
    this.modeControl.instance.setIsEnabled(false);
  }

  /**
   * Enable the element.
   */
  public enable(): void {
    this.container.instance.style.display = '';
    this.modeControl.instance.setIsEnabled(true);
    if (this.modeSetting.value == BacklightMode.Manual) {
      this.valInput.instance.setDisabled(false);
    }
  }

  /**
   * Handle a manual/auto switch.
   * @param mode The index number of the option chosen.
   */
  public onManAutoSelected(mode: BacklightMode): void {
    switch (mode) {
      case BacklightMode.Auto:
        // Auto enabled.
        this.valInput.instance.setDisabled(true);
        break;
      case BacklightMode.Manual:
        // Manual enabled.
        this.valInput.instance.setDisabled(false);
        break;
      default:
      // Shouldn't happen.
      // console.log(`Unknown option for onManAutoSelected: ${mode}`);
    }
  }

  /**
   * Builds a menu item definition for a setting value.
   * @param value A setting value.
   * @param index The index of the value in the menu.
   * @returns a menu item definition for the setting value.
   */
  private buildModeMenuItem(value: BacklightMode, index: number): ContextMenuItemDefinition {
    return {
      id: `${index}`,
      renderContent: (): VNode => <span>{ItemBrightnessControl.MODE_TEXT[value]}</span>,
      estimatedWidth: ItemBrightnessControl.MODE_TEXT[value].length * ContextMenuDialog.CHAR_WIDTH
    };
  }

  /**
   * Render the control.
   * @returns The VNode for the control.
   */
  public render(): VNode {
    return (
      <div ref={this.container} class='pfd-setup-item-block pfd-setup-inline'>
        <div class='pfd-setup-mode-switch pfd-setup-inline' ref={this.modeDiv}>
          <SelectControl<BacklightMode> viewService={this.props.viewService} class='pfd-setup-inline'
            ref={this.modeControl}
            onRegister={this.props.onRegister}
            buildMenuItem={this.buildModeMenuItem.bind(this)}
            data={this.modeValues}
            onItemSelected={this.modeController.itemSelectedHandler}
            outerContainer={this.container}
          />
        </div>
        <div class='pfd-setup-number-input pfd-setup-inline' ref={this.valDiv}>
          <G1000UiControlWrapper onRegister={this.props.onRegister}>
            <DigitInput
              ref={this.valInput}
              value={this.intensityController.dataSub}
              minValue={0}
              maxValue={100}
              increment={1}
              wrap={false}
              scale={1}
              formatter={(num: number): string => `${num.toFixed(2)}%`}
            />
          </G1000UiControlWrapper>
        </div>
      </div>
    );
  }
}


/** The brightness options for a single display. */
interface BrightnessOptions extends ComponentProps {

  /** The View Service. */
  viewService: ViewService;

  /** Register function for interior UiControls */
  onRegister: (control: UiControl) => void;

  /** The name of the display. */
  displayName: 'pfd' | 'mfd';

  /** A backlight settings manager. */
  settingManager: UserSettingManager<BacklightUserSettingTypes>;
}

/** Display brightness control component. */
class BrightnessControl extends DisplayComponent<BrightnessOptions> {
  private readonly itemValue = Subject.create(0);
  private readonly setupItems: Array<string>;
  private readonly dispInput = FSComponent.createRef<ItemBrightnessControl>();
  private readonly keyInput = FSComponent.createRef<ItemBrightnessControl>();

  private readonly screenModeSettingName = `${this.props.displayName}ScreenBacklightMode` as BacklightModeSettingName;
  private readonly screenIntensitySettingName = `${this.props.displayName}ScreenBacklightIntensity` as BacklightIntensitySettingName;
  private readonly keyModeSettingName = `${this.props.displayName}KeyBacklightMode` as BacklightModeSettingName;
  private readonly keyIntensitySettingName = `${this.props.displayName}KeyBacklightIntensity` as BacklightIntensitySettingName;

  /**
   * Create a BrightnessControl
   * @param props The properties for the control.
   */
  public constructor(props: BrightnessOptions) {
    super(props);
    this.setupItems = [`${this.props.displayName.toUpperCase()} Display`, `${this.props.displayName.toUpperCase()} Key`];
  }

  /** Do things after render. */
  public onAfterRender(): void {
    this.keyInput.instance.disable();
  }

  /**
   * Handle an item selection event.
   * @param option The index number of the option chosen
   */
  private onItemSelected(option: number): void {
    switch (option) {
      case 0:
        // Display selected.
        this.dispInput.instance.enable();
        this.keyInput.instance.disable();
        break;
      case 1:
        // Key selected.
        this.dispInput.instance.disable();
        this.keyInput.instance.enable();
        break;
      default:
      // console.log(`Invalid option for onItemSelected: ${option}`);
    }
  }

  /**
   * Render a brightness control.
   * @returns a VNode
   */
  public render(): VNode {
    return (
      <div class='pfd-setup-row'>
        <div class='pfd-setup-mode-toggle pfd-setup-inline'>
          <ArrowToggle class='pfd-setup-inline'
            onRegister={this.props.onRegister}
            onOptionSelected={this.onItemSelected.bind(this)}
            options={this.setupItems}
            dataref={this.itemValue}
          />
        </div>
        <ItemBrightnessControl
          viewService={this.props.viewService}
          ref={this.dispInput}
          onRegister={this.props.onRegister}
          settingManager={this.props.settingManager}
          modeSettingName={this.screenModeSettingName}
          intensitySettingName={this.screenIntensitySettingName}
        />
        <ItemBrightnessControl
          viewService={this.props.viewService}
          ref={this.keyInput}
          onRegister={this.props.onRegister}
          settingManager={this.props.settingManager}
          modeSettingName={this.keyModeSettingName}
          intensitySettingName={this.keyIntensitySettingName}
          noManualMode={true}
        />
      </div>
    );
  }
}

/**
 * Component props for PFDSetup.
 */
export interface PFDSetupProps extends UiViewProps {
  /** The event bus. */
  bus: EventBus;
}

/** A PFD setup menu. */
export class PFDSetup extends UiView<PFDSetupProps> {
  private readonly backlightSettingManager = BacklightUserSettings.getManager(this.props.bus);

  /**
   * Render the menu.
   * @returns a VNode
   */
  render(): VNode {
    return (
      <div class="popout-dialog" ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <div class='pfd-setup-popout'>
          <BrightnessControl viewService={this.props.viewService} onRegister={this.register} displayName='pfd' settingManager={this.backlightSettingManager} />
          <BrightnessControl viewService={this.props.viewService} onRegister={this.register} displayName='mfd' settingManager={this.backlightSettingManager} />
        </div>
      </div>
    );
  }
}