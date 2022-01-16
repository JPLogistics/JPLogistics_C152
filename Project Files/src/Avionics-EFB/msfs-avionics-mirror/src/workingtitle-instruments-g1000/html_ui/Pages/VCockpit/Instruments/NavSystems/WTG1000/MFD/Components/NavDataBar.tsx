import { FSComponent, DisplayComponent, VNode, Subscribable, Subject, NumberUnitSubject, NumberUnit, UnitType } from 'msfssdk';
import { DurationDisplay, DurationDisplayDelim, DurationDisplayFormat } from 'msfssdk/components/common';
import { EventBus } from 'msfssdk/data';
import { GNSSEvents } from 'msfssdk/instruments';
import { LNavSimVars } from '../../Shared/Autopilot/LNavSimVars';
import { UiPage } from '../../Shared/UI/UiPage';

import './NavDataBar.css';

/**
 * The properties on the airspeed component.
 */
interface NavDataBarProps {

  /** An instance of the event bus. */
  bus: EventBus;

  /** A subscribable which provides the current open page. */
  openPage: Subscribable<UiPage | null>;
}

/**
 * The PFD airspeed indicator with speed tape.
 */
export class NavDataBar extends DisplayComponent<NavDataBarProps> {

  private gsElement = FSComponent.createRef<HTMLElement>();

  private magneticTrackElement = FSComponent.createRef<HTMLElement>();

  private dtkRef = FSComponent.createRef<HTMLElement>();

  private groundSpeed = 0;

  private readonly titleTextSub = Subject.create('');
  private oldPage: UiPage | null = null;

  private readonly titleHandler = (title: string): void => { this.titleTextSub.set(title); }

  private readonly eteSubject = NumberUnitSubject.createFromNumberUnit(new NumberUnit(NaN, UnitType.SECOND));

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    const lnav = this.props.bus.getSubscriber<LNavSimVars>();
    const gnss = this.props.bus.getSubscriber<GNSSEvents>();
    gnss.on('ground_speed')
      .withPrecision(0)
      .handle(this.onUpdateGS);
    gnss.on('track_deg_magnetic')
      .withPrecision(0)
      .handle(this.onUpdateTrack);

    lnav.on('lnavDtkMag').whenChangedBy(1).handle((dtk) => {
      if (this.dtkRef.instance !== null) {
        const dtkRounded = Math.round(dtk);
        const dtkValue = dtkRounded == 0 ? 360 : dtkRounded;
        this.dtkRef.instance.textContent = `${dtkValue}`.padStart(3, '0') + '°';
      }
    });

    lnav.on('lnavDis').handle((dis) => {
      if (this.groundSpeed < 30) {
        this.eteSubject.set(NaN);
      } else {
        const eteSeconds = Math.round((dis / this.groundSpeed) * 3600);
        this.eteSubject.set(eteSeconds);
      }
    });

    this.props.openPage.sub(this.onOpenPageChanged.bind(this), true);
  }

  /**
   * A callback called when the GS updates from the event bus.
   * @param gs The current GS value.
   */
  private onUpdateGS = (gs: number): void => {
    if (this.gsElement.instance !== null) {
      this.gsElement.instance.textContent = `${(gs)}`;
      this.groundSpeed = gs;
    }
  }

  /**
   * A callback called when the magnetic track updates from the event bus.
   * @param trk The current trk value.
   */
  private onUpdateTrack = (trk: number): void => {
    if (this.magneticTrackElement.instance !== null && this.groundSpeed > 1) {
      this.magneticTrackElement.instance.textContent = `${(trk)}`.padStart(3, '0') + '°';
    }
  }

  /**
   * A callback which is called when the currently open page changes.
   * @param page The new open page.
   */
  private onOpenPageChanged(page: UiPage | null): void {
    this.oldPage?.title.unsub(this.titleHandler);
    page && page.title.sub(this.titleHandler, true);
    this.oldPage = page;
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div id="Center">
        <table>
          <tr>
            <td class="smallText fieldTitle">GS</td>
            <td class="magenta fieldData"><span ref={this.gsElement}>0</span><span class="smallText magenta">KT</span></td>
            <td class="smallText fieldTitle">DTK</td>
            <td ref={this.dtkRef} class="magenta fieldData">_ _ _°</td>
            <td class="smallText fieldTitle">TRK</td>
            <td ref={this.magneticTrackElement} class="magenta fieldData"></td>
            <td class="smallText fieldTitle">ETE</td>
            <td class="magenta fieldData">
              <DurationDisplay value={this.eteSubject} options={{ delim: DurationDisplayDelim.ColonOrCross, nanString: '_ _:_ _', format: DurationDisplayFormat.hh_mm_or_mm_ss, pad: 2 }} />
            </td>
          </tr>
        </table>
        <span id="mapTitle">{this.titleTextSub}</span>
      </div>
    );
  }
}
