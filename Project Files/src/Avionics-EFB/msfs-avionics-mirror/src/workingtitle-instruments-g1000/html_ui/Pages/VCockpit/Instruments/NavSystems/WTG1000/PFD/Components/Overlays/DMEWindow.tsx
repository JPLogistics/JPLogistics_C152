import { DisplayComponent, FSComponent, VNode, ComponentProps, Subject } from 'msfssdk';
import { EventBus, ControlEvents } from 'msfssdk/data';
import { RadioEvents, RadioType, FrequencyBank } from 'msfssdk/instruments';
import { NavIndicatorController } from '../../../Shared/Navigation/NavIndicatorController';
import { PFDUserSettings, PfdMapLayoutSettingMode } from '../../PFDUserSettings';
import './DMEWindow.css';

/**
 * The properties for the DMEWindow
 * component.
 */
interface DMEWindowProps extends ComponentProps {
  /** An instance of the event bus. */
  bus: EventBus;
  /** An instance of the NavIndicatorController. */
  navIndicatorController: NavIndicatorController;
}

/**
 * The DMEWindow
 * component.
 */
export class DMEWindow extends DisplayComponent<DMEWindowProps> {

  private navSource = Subject.create('NAV1');
  private navFreq = Subject.create('___.__');
  private navDist = Subject.create('- - . -');

  private dmeElement = FSComponent.createRef<HTMLElement>();

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    const control = this.props.bus.getSubscriber<ControlEvents>();
    control.on('dme_toggle').handle(this.updateDMEDisplay);
    const navcom = this.props.bus.getSubscriber<RadioEvents>();
    navcom.on('setFrequency').handle((setFrequency) => {
      if (setFrequency.radio.radioType === RadioType.Nav && setFrequency.bank == FrequencyBank.Active) {
        const srcIndex = this.props.navIndicatorController.dmeSourceIndex.get();
        this.navSource.set(`NAV${srcIndex + 1}`);
        const frequency = this.props.navIndicatorController.navStates[srcIndex].frequency;
        if (frequency) {
          this.navFreq.set(`${(Math.round(frequency * 100) / 100).toFixed(2)}`);
        }
      }
    });

    PFDUserSettings.getManager(this.props.bus).whenSettingChanged('mapLayout').handle((mode) => {
      this.setOffset(mode === PfdMapLayoutSettingMode.HSI);
    });

    this.dmeElement.instance.style.display = 'none';

    this.props.navIndicatorController.dmeSourceIndex.sub((v) => {
      this.navSource.set(`NAV${v + 1}`);
      const frequency = this.props.navIndicatorController.navStates[v].frequency;
      if (frequency) {
        this.navFreq.set(`${(Math.round(frequency * 100) / 100).toFixed(2)}`);
      }
    });

    this.props.navIndicatorController.dmeDistanceSubject.sub((v) => {
      if (v >= 100) {
        this.navDist.set(v.toFixed(0));
      } else if (v > 0) {
        this.navDist.set(v.toFixed(1));
      } else {
        this.navDist.set('- - . -');
      }
    });

    this.init();
  }

  /**
   * Inits the DME Display.
   */
  private init(): void {
    setTimeout(() => {
      const frequency = this.props.navIndicatorController.navStates[0].frequency;
      if (frequency) {
        this.navFreq.set(`${(Math.round(frequency * 100) / 100).toFixed(2)}`);
      }
    }, 2000);
  }

  /**
   * Updated the DME Display.
   * @param toggle If the DME button has been turned on or off
   */
  private updateDMEDisplay = (toggle: boolean): void => {
    if (toggle) {
      this.dmeElement.instance.style.display = '';
    } else {
      this.dmeElement.instance.style.display = 'none';
    }
  }

  /**
   * Offsets the display to the left when the HSI map is active to prevent it from being obscured
   * @param isHSIMAP Boolean if HSI map is active or not
   */
  private setOffset = (isHSIMAP: boolean): void => {
    if (isHSIMAP) {
      this.dmeElement.instance.classList.add('DME-window-hsi-map');
    } else {
      this.dmeElement.instance.classList.remove('DME-window-hsi-map');
    }
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div ref={this.dmeElement} class="DME-window">
        <div>DME</div>
        <div class="cyan">{this.navSource}</div>
        <div class="cyan">{this.navFreq}</div>
        <div>{this.navDist}<span class="size14"> NM</span></div>
      </div>
    );
  }
}