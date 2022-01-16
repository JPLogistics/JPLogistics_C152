import { Subject } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { ADCEvents } from 'msfssdk/instruments';
import { PFDUserSettings, WindOverlaySettingMode } from '../../../PFD/PFDUserSettings';

/**
 * The wind data input.
 */
export interface WindData {
  /** The wind direction in degrees. */
  direction: number;
  /** The wind velocity in knots. */
  velocity: number;
}

/** The controller for the Wind Overlay. */
export class WindOptionController {
  /**
   * Creates the Wind Overlay Controller
   * @param bus is the event bus
   * @param store is the WindOptionStore
   */
  constructor(readonly bus: EventBus, readonly store: WindOptionStore) {
    const settingManager = PFDUserSettings.getManager(bus);
    settingManager.whenSettingChanged('windOption').handle((opt) => {
      this.store.selectedView.set(opt as WindOverlaySettingMode);
    });

    const adc = this.bus.getSubscriber<ADCEvents>();
    adc.on('ambient_wind_velocity').withPrecision(1).handle((v) => {
      this.store.lastWindVelocity = v;
      this.store.currentWind.set({ direction: this.store.lastWindDirection, velocity: v });
    });

    adc.on('ambient_wind_direction').withPrecision(1).handle((v) => {
      this.store.lastWindDirection = v;
      this.store.currentWind.set({ direction: v, velocity: this.store.lastWindVelocity });
    });

    adc.on('hdg_deg').withPrecision(1).handle((hdg) => {
      this.store.currentHeading.set(hdg);
    });

    adc.on('ias').withPrecision(0).handle((v) => {
      this.store.lastIas = v;
      this.noWindHandler(undefined, v);
    });

    adc.on('on_ground').handle((v) => {
      this.store.lastOnGround = v;
      this.noWindHandler(v, undefined);
    });

    this.store.noWindData.sub(() => {
      this.updateView();
    });
    this.store.selectedView.sub(() => {
      this.updateView();
    }, true);
  }

  /**
   * The No Wind Handler.
   * @param onGround is whether the plane is on the ground
   * @param ias is the indicated airspeed
   */
  private noWindHandler(onGround: boolean | undefined, ias: number | undefined): void {
    onGround = onGround === undefined ? this.store.lastOnGround : onGround;
    ias = ias === undefined ? this.store.lastIas : ias;
    if (onGround && ias < 30) {
      this.store.noWindData.set(true);
    } else {
      this.store.noWindData.set(false);
    }
  }

  /** Updates the view. */
  public updateView(): void {
    const view = this.store.selectedView.get();
    const noData = this.store.noWindData.get();
    if (view === WindOverlaySettingMode.Off) {
      this.store.renderOption.set(WindOverlayRenderOption.NONE);
    } else if (noData) {
      this.store.renderOption.set(WindOverlayRenderOption.NOWIND);
    } else {
      switch (view) {
        case WindOverlaySettingMode.Opt1:
          this.store.renderOption.set(WindOverlayRenderOption.OPT1);
          break;
        case WindOverlaySettingMode.Opt2:
          this.store.renderOption.set(WindOverlayRenderOption.OPT2);
          break;
        case WindOverlaySettingMode.Opt3:
          this.store.renderOption.set(WindOverlayRenderOption.OPT3);
          break;
      }
    }
  }
}

export enum WindOverlayRenderOption {
  NONE,
  OPT1,
  OPT2,
  OPT3,
  NOWIND
}


/** The data store for Wind Overlay */
export class WindOptionStore {
  public readonly selectedView = Subject.create(WindOverlaySettingMode.Off);
  public readonly currentWind = Subject.create({ direction: 0, velocity: 0 } as WindData);
  public readonly currentHeading = Subject.create(0);
  public readonly noWindData = Subject.create(true);
  public readonly renderOption = Subject.create(WindOverlayRenderOption.NONE);

  public lastWindDirection = 0;
  public lastWindVelocity = 0;
  public lastIas = 0;
  public lastOnGround = true;
}