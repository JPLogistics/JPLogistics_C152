import { ComputedSubject, MappedSubject } from 'msfssdk';
import { LNavEvents } from 'msfssdk/autopilot';
import { ConsumerSubject, ControlPublisher, EventBus } from 'msfssdk/data';
import { InstrumentEvents, NavEvents } from 'msfssdk/instruments';

import { GarminControlEvents } from 'garminsdk/instruments';
import { ObsSuspModes } from 'garminsdk/navigation';

import { AlertMessageEvents } from '../../../PFD/Components/UI/Alerts/AlertsSubject';
import { G1000ControlPublisher } from '../../G1000Events';
import { MenuSystem } from './MenuSystem';
import { SoftKeyMenu } from './SoftKeyMenu';

/**
 * The root PFD softkey menu.
 */
export class RootMenu extends SoftKeyMenu {
  private readonly isLNavSuspended: ConsumerSubject<boolean>;
  private readonly isObsActive: ConsumerSubject<boolean>;
  private readonly obsMode: MappedSubject<[boolean, boolean], ObsSuspModes>;

  private readonly isObsAvailable: ConsumerSubject<boolean>;
  private readonly isObsButtonDisabled: MappedSubject<[ObsSuspModes, boolean], boolean>;

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
      const obsMode = this.obsMode.get();

      const isObsModeActive = obsMode === ObsSuspModes.OBS;

      if (obsMode === ObsSuspModes.SUSP) {
        controlPublisher.publishEvent('suspend_sequencing', false);
      } else if (isObsModeActive || this.isObsAvailable.get()) {
        SimVar.SetSimVarValue(`K:GPS_OBS_${isObsModeActive ? 'OFF' : 'ON'}`, 'number', 0);
        if (isObsModeActive) {
          controlPublisher.publishEvent('suspend_sequencing', false);
        }
      }
    };

    this.addItem(0, '', () => { });
    this.addItem(1, 'Map/HSI', () => menuSystem.pushMenu('map-hsi'));
    this.addItem(2, 'TFC Map');
    this.addItem(3, 'PFD Opt', () => menuSystem.pushMenu('pfd-opt'));
    this.addItem(4, this.obsLabel.get() as string, () => obsButtonPressed(), this.obsButtonValue.get() as boolean, true);
    this.addItem(5, 'CDI', () => { controlPublisher.publishEvent('cdi_src_switch', true); });
    this.addItem(6, 'ADF/DME', () => {
      g1000Publisher.publishEvent('pfd_dme_push', true);
    });
    this.addItem(7, 'XPDR', () => menuSystem.pushMenu('xpdr'));
    this.addItem(8, 'Ident', () => {
      controlPublisher.publishEvent('xpdr_send_ident_1', true);
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

    const sub = bus.getSubscriber<NavEvents & LNavEvents & GarminControlEvents & InstrumentEvents & AlertMessageEvents>();

    this.isLNavSuspended = ConsumerSubject.create(sub.on('lnav_is_suspended'), false);
    this.isObsActive = ConsumerSubject.create(sub.on('gps_obs_active'), false);
    this.isObsAvailable = ConsumerSubject.create(sub.on('obs_available'), false);

    this.obsMode = MappedSubject.create(
      ([isLnavSuspended, isObsActive]): ObsSuspModes => {
        return isObsActive
          ? ObsSuspModes.OBS
          : isLnavSuspended ? ObsSuspModes.SUSP : ObsSuspModes.NONE;
      },
      this.isLNavSuspended,
      this.isObsActive
    );
    this.isObsButtonDisabled = MappedSubject.create(
      ([obsMode, isObsAvailable]): boolean => {
        return obsMode === ObsSuspModes.NONE && !isObsAvailable;
      },
      this.obsMode,
      this.isObsAvailable
    );

    this.obsMode.sub(obsMode => {
      this.obsLabel.set(obsMode);
      this.obsButtonValue.set(obsMode);

      const item = this.getItem(4);
      item.label.set(this.obsLabel.get());
      item.value.set(this.obsButtonValue.get());
    }, true);

    this.isObsButtonDisabled.sub(isDisabled => {
      const item = this.getItem(4);
      item.disabled.set(isDisabled);
    });

    sub.on('vc_screen_state').handle(state => {
      if (state.current === ScreenState.REVERSIONARY) {
        setTimeout(() => {
          this.getItem(0).label.set('Engine');
          this.getItem(0).handler = (): void => this.menuSystem.pushMenu('engine-menu');

          bus.on('mfd_power_on', this.onMfdPowerOn);
        }, 250);
      }
    });

    sub.on('alerts_available')
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
  };
}
