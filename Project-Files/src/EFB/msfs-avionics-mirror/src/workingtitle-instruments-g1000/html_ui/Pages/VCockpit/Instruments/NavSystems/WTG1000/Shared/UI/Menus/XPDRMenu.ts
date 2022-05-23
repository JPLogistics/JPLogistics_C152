import { Subject } from 'msfssdk';
import { ControlPublisher, EventBus } from 'msfssdk/data';
import { XPDRSimVarEvents, XPDRMode } from 'msfssdk/instruments';
import { G1000ControlPublisher } from '../../G1000Events';
import { MenuSystem } from './MenuSystem';
import { SoftKeyMenu } from './SoftKeyMenu';

/**
 * The XPDR softkey menu.
 */
export class XPDRMenu extends SoftKeyMenu {
  private readonly xpdrMode = Subject.create(XPDRMode.OFF);
  private readonly isVfr = Subject.create(false);

  private readonly modeToIndex: Map<XPDRMode, number> = new Map([
    [XPDRMode.STBY, 2],
    [XPDRMode.ON, 3],
    [XPDRMode.ALT, 4]
  ]);

  /**
   * Creates an instance of the XPDR PFD softkey menu.
   * @param menuSystem the menu system
   * @param controlPublisher is the instance of the control publisher
   * @param g1000Publisher the G1000 control events publisher
   * @param bus the event bus
   */
  constructor(menuSystem: MenuSystem, controlPublisher: ControlPublisher, g1000Publisher: G1000ControlPublisher, bus: EventBus) {
    super(menuSystem);

    this.addItem(2, 'Standby', () => {
      controlPublisher.publishEvent('publish_xpdr_mode_1', XPDRMode.STBY);
    }, this.xpdrMode.get() === XPDRMode.STBY);
    this.addItem(3, 'On', () => {
      controlPublisher.publishEvent('publish_xpdr_mode_1', XPDRMode.ON);
    }, this.xpdrMode.get() === XPDRMode.ON);
    this.addItem(4, 'Alt', () => {
      controlPublisher.publishEvent('publish_xpdr_mode_1', XPDRMode.ALT);
    }, this.xpdrMode.get() === XPDRMode.ALT);
    this.addItem(6, 'VFR', () => {
      controlPublisher.publishEvent('publish_xpdr_code_1', this.getVfrCode());
    }, this.isVfr.get());
    this.addItem(7, 'Code', () => {
      menuSystem.pushMenu('xpdr-code');
      g1000Publisher.publishEvent('xpdr_code_push', true);
    }, false);
    this.addItem(8, 'Ident', () => {
      controlPublisher.publishEvent('xpdr_send_ident_1', true);
      menuSystem.back();
    });
    this.addItem(10, 'Back', () => menuSystem.back());
    this.addItem(11, 'Alerts');

    const xpdrSub = bus.getSubscriber<XPDRSimVarEvents>();

    // this.xpdrMode.set(xpdrInstr.getXpdrMode());
    this.xpdrMode.sub(this.onXpdrModeChanged.bind(this));
    xpdrSub.on('xpdr_mode_1').handle((mode: XPDRMode) => {
      this.xpdrMode.set(mode);
    });

    // this.isVfr.set(xpdrInstr.getXpdrCode() === 1200);
    this.isVfr.sub(this.onIsVfrChanged.bind(this));
    xpdrSub.on('xpdr_code_1').handle((code: number) => {
      this.isVfr.set(code === this.getVfrCode());
    });

  }

  /**
   * Callback when the isVfr indication is changed
   * @param v the new isVfr indication
   */
  private onIsVfrChanged(v: boolean): void {
    this.getItem(6).value.set(v);
  }

  /**
   * Callback when the xpdr mode is changed
   * @param v the new xpdr mode
   */
  private onXpdrModeChanged(v: XPDRMode): void {
    this.modeToIndex.forEach((index, mode) => {
      this.getItem(index).value.set(mode === v);
    });
  }

  /**
   * Gets the regional VFR code.
   * @returns The regional VFR Code
   */
  private getVfrCode(): number {
    switch (Simplane.getWorldRegion()) {
      case WorldRegion.NORTH_AMERICA:
      case WorldRegion.AUSTRALIA:
        return 1200;
      default:
        return 7000;
    }
  }
}