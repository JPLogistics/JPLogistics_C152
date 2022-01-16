import { MenuSystem } from './MenuSystem';
import { SoftKeyMenu } from './SoftKeyMenu';
import { ControlPublisher, EventBus } from 'msfssdk/data';
import { G1000ControlEvents, G1000ControlPublisher } from '../../G1000Events';
import { LNavEvents } from '../../Autopilot/Directors/LNavDirector';
import { InstrumentEvents, NavEvents } from 'msfssdk/instruments';
import { ComputedSubject } from 'msfssdk';
import { ObsSuspModes } from '../../Navigation/NavIndicatorController';
import { AlertMessageEvents } from '../../../PFD/Components/UI/Alerts/AlertsSubject';

/**
 * The root PFD softkey menu.
 */
export class RootMenu extends SoftKeyMenu {
  private obsMode = ObsSuspModes.NONE;
  private obsAvailable = false;
  private obsButtonDisabled = true;

  private readonly obsLabel = ComputedSubject.create(ObsSuspModes.NONE, (v): string => {
    return v === ObsSuspModes.SUSP ? 'SUSP' : 'OBS';
  });

  private readonly obsButtonValue = ComputedSubject.create(ObsSuspModes.NONE, (v): boolean => {
    return v === ObsSuspModes.NONE ? false : true;
  });

  /**
   * Creates an instance of the root PFD softkey menu.
   * @param menuSystem The menu system.
   * @param controlPublisher A ControlPublisher for command events.
   * @param g1000Publisher A publisher for G1000-specific command events.
   * @param bus The event bus to use.
   */
  constructor(menuSystem: MenuSystem, controlPublisher: ControlPublisher, g1000Publisher: G1000ControlPublisher, bus: EventBus) {
    super(menuSystem);

    const obsButtonPressed = (): void => {
      if (this.obsMode === ObsSuspModes.SUSP) {
        g1000Publisher.publishEvent('suspend', false);
      } else if (this.obsMode === ObsSuspModes.OBS || this.obsAvailable) {
        SimVar.SetSimVarValue('K:GPS_OBS', 'number', 0);
      }
    };

    this.addItem(0, '', () => { });
    this.addItem(1, 'Map/HSI', () => menuSystem.pushMenu('map-hsi'));
    this.addItem(2, 'TFC Map');
    this.addItem(3, 'PFD Opt', () => menuSystem.pushMenu('pfd-opt'));
    this.addItem(4, this.obsLabel.get() as string, () => obsButtonPressed(), this.obsButtonValue.get() as boolean, this.obsButtonDisabled);
    this.addItem(5, 'CDI', () => { controlPublisher.publishEvent('cdi_src_switch', true); });
    this.addItem(6, 'ADF/DME', () => {
      g1000Publisher.publishEvent('pfd_dme_push', true);
    });
    this.addItem(7, 'XPDR', () => menuSystem.pushMenu('xpdr'));
    this.addItem(8, 'Ident', () => {
      controlPublisher.publishEvent('xpdr_send_ident', true);
    });
    this.addItem(9, 'Tmr/Ref', () => {
      g1000Publisher.publishEvent('pfd_timerref_push', true);
    });
    this.addItem(10, 'Nearest', () => {
      g1000Publisher.publishEvent('pfd_nearest_push', true);
    });
    this.addItem(11, 'Alerts', () => {
      g1000Publisher.publishEvent('pfd_alert_push', true);
    }, undefined, false);

    const obsMenuItemHandler = (): void => {
      this.obsLabel.set(this.obsMode);
      this.obsButtonValue.set(this.obsMode);
      if (this.obsMode === ObsSuspModes.NONE && !this.obsAvailable) {
        this.obsButtonDisabled = true;
      } else {
        this.obsButtonDisabled = false;
      }
      const item = this.getItem(4);
      item.disabled.set(this.obsButtonDisabled);
      item.label.set(this.obsLabel.get());
      item.value.set(this.obsButtonValue.get());
    };

    bus.getSubscriber<NavEvents>().on('gps_obs_active').whenChanged().handle(obsActive => {
      this.obsMode = obsActive ? ObsSuspModes.OBS : ObsSuspModes.NONE;
      obsMenuItemHandler();
    });

    bus.getSubscriber<LNavEvents>().on('suspChanged').whenChanged().handle(isSuspended => {
      if (this.obsMode === ObsSuspModes.OBS && !isSuspended) {
        SimVar.SetSimVarValue('K:GPS_OBS', 'number', 0);
      }
      this.obsMode = isSuspended ? ObsSuspModes.SUSP : ObsSuspModes.NONE;
      obsMenuItemHandler();
    });

    bus.getSubscriber<G1000ControlEvents>().on('obs_available').whenChanged().handle(v => {
      this.obsAvailable = v;
      obsMenuItemHandler();
    });

    bus.getSubscriber<InstrumentEvents>().on('vc_screen_state').handle(state => {
      if (state.current === ScreenState.REVERSIONARY) {
        setTimeout(() => {
          this.getItem(0).label.set('Engine');
          this.getItem(0).handler = (): void => this.menuSystem.pushMenu('engine-menu');

          bus.on('mfd_power_on', this.onMfdPowerOn);
        }, 250);
      }
    });

    bus.getSubscriber<AlertMessageEvents>().on('alerts_available')
      .handle(available => this.getItem(11).highlighted.set(available));
  }

  /**
   * Handles when the MFD has powered on.
   * @param isPowered Whether or not the MFD has finished powering up.
   */
  private onMfdPowerOn = (isPowered: boolean): void => {
    if (isPowered) {
      setTimeout(() => {
        this.getItem(0).label.set('');
        this.getItem(0).handler = undefined;

        this.menuSystem.bus.off('mfd_power_on', this.onMfdPowerOn);
      }, 250);
    }
  }
}
