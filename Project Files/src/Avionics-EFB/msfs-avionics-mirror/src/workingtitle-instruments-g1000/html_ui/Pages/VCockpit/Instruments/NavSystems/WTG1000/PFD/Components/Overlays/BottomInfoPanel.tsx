import { FSComponent, DisplayComponent, VNode, NodeReference, Subject, NavMath } from 'msfssdk';
import { ControlPublisher, EventBus } from 'msfssdk/data';
import { GNSSEvents, InstrumentEvents } from 'msfssdk/instruments';
import { ADCEvents } from 'msfssdk/instruments/ADC';
import { BearingDirection, BearingDistance, BearingIdent, BearingSource, NavEvents, NavSourceType } from 'msfssdk/instruments/NavProcessor';
import { G1000ControlEvents } from '../../../Shared/G1000Events';
import { Transponder } from './Transponder';

import './BottomInfoPanel.css';
import { FailedBox } from '../../../Shared/UI/FailedBox';
import { ADCSystemEvents, AvionicsSystemState } from '../../../Shared/Systems';

/**
 * The properties on the Attitude component.
 */
interface BottomInfoPanelProps {

  /** An instance of the event bus. */
  bus: EventBus;

  /** An instance of the control publisher. */
  controlPublisher: ControlPublisher;
}

/**
 * The PFD attitude indicator.
 */
export class BottomInfoPanel extends DisplayComponent<BottomInfoPanelProps> {

  private oatValue = Subject.create(13);
  private utcTimeStr = Subject.create('19:38:12');
  private timerStr = Subject.create('0:00:00');
  private hdg = 0;
  private bearingPointerAdf = [false, false];
  private bearingPointerDirection: (number | null)[] = [null, null];

  private bearing1Container = FSComponent.createRef<HTMLElement>();
  private bearing2Container = FSComponent.createRef<HTMLElement>();
  private bearing1SrcElement = FSComponent.createRef<HTMLElement>();
  private bearing2SrcElement = FSComponent.createRef<HTMLElement>();
  private bearing1DistElement = FSComponent.createRef<HTMLElement>();
  private bearing1DistUnits = FSComponent.createRef<HTMLElement>();
  private bearing2DistElement = FSComponent.createRef<HTMLElement>();
  private bearing2DistUnits = FSComponent.createRef<HTMLElement>();
  private bearing1DirElement = FSComponent.createRef<HTMLElement>();
  private bearing2DirElement = FSComponent.createRef<HTMLElement>();
  private bearing1IdentElement = FSComponent.createRef<HTMLElement>();
  private bearing2IdentElement = FSComponent.createRef<HTMLElement>();
  private tempBox = FSComponent.createRef<HTMLDivElement>();

  private oatFailedBox = FSComponent.createRef<FailedBox>();
  private oatHide = FSComponent.createRef<HTMLDivElement>();

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    const adc = this.props.bus.getSubscriber<ADCEvents>();
    const gnss = this.props.bus.getSubscriber<GNSSEvents>();
    const g1000 = this.props.bus.getSubscriber<G1000ControlEvents>();

    adc.on('ambient_temp_c')
      .withPrecision(0)
      .handle(this.onUpdateOAT);
    adc.on('hdg_deg')
      .withPrecision(0)
      .handle((h) => { this.hdg = h; });
    gnss.on('zulu_time')
      .withPrecision(0)
      .whenChangedBy(1)
      .handle(this.onUtcUpdate);
    g1000.on('timer_value')
      .whenChangedBy(1)
      .handle((time) => {
        this.timerStr.set(Utils.SecondsToDisplayDuration(time, true, true, true));
      });


    const nav = this.props.bus.getSubscriber<NavEvents>();
    nav.on('brg_source').whenChanged().handle(this.onUpdateBearingSrc);
    nav.on('brg_distance').handle(this.onUpdateBearingDist);
    nav.on('brg_direction').handle(this.onUpdateBearingDir);
    nav.on('brg_ident').whenChanged().handle(this.onUpdateBearingIdent);

    if (this.bearing1Container.instance !== null && this.bearing2Container.instance !== null) {
      this.bearing1Container.instance.style.display = 'none';
      this.bearing2Container.instance.style.display = 'none';
    }

    this.props.bus.getSubscriber<InstrumentEvents>().on('vc_screen_state').handle(state => {
      if (state.current === ScreenState.REVERSIONARY) {
        setTimeout(() => {
          this.tempBox.instance.classList.add('reversionary');
          this.props.bus.on('mfd_power_on', this.onMfdPowerOn);
        }, 250);
      }
    });

    this.props.bus.getSubscriber<ADCSystemEvents>()
      .on('adc_state')
      .handle(state => {
        if (state.current === AvionicsSystemState.On) {
          this.oatFailedBox.instance.setFailed(false);
          this.oatHide.instance.classList.remove('hidden-element');
        } else {
          this.oatFailedBox.instance.setFailed(true);
          this.oatHide.instance.classList.add('hidden-element');
        }
      });
  }

  /**
   * Handles when the MFD has powered on.
   * @param isPowered Whether or not the MFD is finished powering on.
   */
  private onMfdPowerOn = (isPowered: boolean): void => {
    if (isPowered) {
      setTimeout(() => {
        this.tempBox.instance.classList.remove('reversionary');
        this.props.bus.off('mfd_power_on', this.onMfdPowerOn);
      }, 250);
    }
  }

  /**
   * A callback called when the UTC time updates from the event bus.
   * @param utcTime The current utcTime value.
   */
  private onUtcUpdate = (utcTime: number): void => {
    const seconds = Math.round(utcTime);
    const time = Utils.SecondsToDisplayTime(seconds, true, true, false);
    this.utcTimeStr.set(time);
  }

  /**
   * A callback called when the pitch updates from the event bus.
   * @param temp The current pitch value.
   */
  private onUpdateOAT = (temp: number): void => {
    this.oatValue.set(temp);
  }

  /**
   * Handle an updated bearing source.
   * @param data The new bearing source info.
   */
  private onUpdateBearingSrc = (data: BearingSource): void => {
    let newLabel = '';
    let updateItem: NodeReference<HTMLElement> | null;

    switch (data.source?.type) {
      case NavSourceType.Nav:
        this.bearingPointerAdf[data.index] = false;
        newLabel = `NAV${data.source.index}`; break;
      case NavSourceType.Gps:
        this.bearingPointerAdf[data.index] = false;
        newLabel = 'GPS'; break;
      case NavSourceType.Adf:
        this.bearingPointerAdf[data.index] = true;
        newLabel = 'ADF';
        break;
      default:
        this.bearingPointerAdf[data.index] = false;
        newLabel = '';
    }

    const direction = this.bearingPointerDirection[data.index];
    if (direction !== null) {
      this.onUpdateBearingDir({ index: data.index, direction: direction });
    }

    switch (data.index) {
      case 0:
        updateItem = this.bearing1SrcElement; break;
      case 1:
        updateItem = this.bearing2SrcElement; break;
      default:
        updateItem = null;
    }

    if (updateItem && updateItem.instance !== null) {
      updateItem.instance.textContent = newLabel;
    }

    if (newLabel == '' && updateItem?.instance !== null) {
      this.onShowBearingDataElement(false, data.index);
    } else if (newLabel != '' && updateItem?.instance !== null) {
      this.onShowBearingDataElement(true, data.index);
    }
  }

  /**
   * Handle hiding or showing the entire bearing needle data element.
   * @param display Whether to show thhe bearing needle data element or not.
   * @param index is the index of the bearing source
   */
  private onShowBearingDataElement = (display: boolean, index: number): void => {
    const instance = index == 0 ? this.bearing1Container.instance : index == 1 ? this.bearing2Container.instance : null;
    if (instance !== null && display) {
      instance.style.display = '';
    } else if (instance !== null && !display) {
      instance.style.display = 'none';
    }
  }

  /**
   * Handle an updated bearing distance.
   * @param data The BearingDistance message.
   */
  private onUpdateBearingDist = (data: BearingDistance): void => {
    let element: NodeReference<HTMLElement> | undefined = undefined;
    let element2: NodeReference<HTMLElement> | undefined = undefined;
    switch (data.index) {
      case 0:
        element = this.bearing1DistElement;
        element2 = this.bearing1DistUnits; break;
      case 1:
        element = this.bearing2DistElement;
        element2 = this.bearing2DistUnits; break;
    }
    if (element !== undefined && element2 !== undefined && element.instance !== null && element2.instance !== null) {
      element.instance.textContent = data.distance == null ? '' : data.distance.toFixed(1);
      element2.instance.textContent = data.distance == null ? '' : 'NM';
    }
  }

  /**
   * Handle an updated bearing heading..
   * @param data The BearingDirection message.
   */
  private onUpdateBearingDir = (data: BearingDirection): void => {
    this.bearingPointerDirection[data.index] = data.direction;

    let element: NodeReference<HTMLElement> | undefined = undefined;
    switch (data.index) {
      case 0:
        element = this.bearing1DirElement; break;
      case 1:
        element = this.bearing2DirElement; break;
    }
    if (element !== undefined && element.instance !== null) {
      let direction = data.direction;
      if (this.bearingPointerAdf[data.index] && data.direction !== null) {
        direction = NavMath.normalizeHeading(data.direction + this.hdg);
      }
      element.instance.textContent = direction == null ? '' : direction.toFixed(0).padStart(3, '0') + '°';
    }
  }


  /**
   * Handle an updated bearing ident.
   * @param data The BearingIdent message.
   */
  private onUpdateBearingIdent = (data: BearingIdent): void => {
    let element: NodeReference<HTMLElement> | undefined = undefined;
    switch (data.index) {
      case 0:
        element = this.bearing1IdentElement; break;
      case 1:
        element = this.bearing2IdentElement; break;
    }
    if (element !== undefined && element.instance !== null) {
      element.instance.textContent = data.isLoc ? 'ILS' : data.ident == null ? ' _ _ _ _ _ _' : '' + data.ident + '';
    }
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (

      <div class="bottom-info-panel">
        <div class="bip-temp-box" ref={this.tempBox}>
          <div class="bip-oat">
            <div class="bip-oat-label"><span class='size16'>OAT</span></div>
            <div class="bip-oat-value">
              <FailedBox ref={this.oatFailedBox} />
              <div ref={this.oatHide}>
                <span>{this.oatValue}°</span>
                <span class='size16'>C</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bip-middle">
          <svg viewBox="0 0 721 55">
            <defs>
              <linearGradient id="gradientBottom" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgb(24,24,24);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:1" />
              </linearGradient>
            </defs>
            <path d="M 0 0 l 258 0 a 147 147 0 0 0 204 0 l 260 0 l 0 55 l -722 0 l 0 -55 z" fill="url(#gradientBottom)" />
          </svg>
          <div class="left-brg-ptr-container" ref={this.bearing1Container}>
            <div class="left-brg-ptr-dist"><span ref={this.bearing1DistElement}></span><span ref={this.bearing1DistUnits} class="size14"></span></div>
            <div class="left-brg-ptr-crs-ident">
              <span class="left-brg-ptr-crs" ref={this.bearing1DirElement}></span>
              <span class="left-brg-ptr-ident" ref={this.bearing1IdentElement}></span>
            </div>
            <div class="left-brg-ptr-src" ref={this.bearing1SrcElement}></div>
            <div class="left-brg-ptr-svg">
              <svg width="19" height="10">
                <path d="M 0 4 l 18 0 m -10 -4 l -4 4 l 4 4" fill="none" stroke="cyan" stroke-width="1.0px" />
              </svg>
            </div>
          </div>
          <div class="right-brg-ptr-container" ref={this.bearing2Container}>
            <div class="right-brg-ptr-dist"><span ref={this.bearing2DistElement}></span><span ref={this.bearing2DistUnits} class="size14"></span></div>
            <div class="right-brg-ptr-crs-ident">
              <span class="right-brg-ptr-ident" ref={this.bearing2IdentElement}></span>
              <span class="right-brg-ptr-crs" ref={this.bearing2DirElement}></span>
            </div>
            <div class="right-brg-ptr-src" ref={this.bearing2SrcElement}></div>
            <div class="right-brg-ptr-svg">
              <svg width="19" height="10">
                <path d="M 0 4 l 3 0 m 12 0 l 4 0 m -8 -4 l 4 4 l -4 4 m 2 -6 l -10 0 l 0 4 l 10 0" fill="none" stroke="cyan" stroke-width="1.0px" />
              </svg>
            </div>
          </div>
        </div>
        <Transponder bus={this.props.bus} controlPublisher={this.props.controlPublisher} />
        <div class="bip-time">
          <div class='size16'>TMR</div>
          <div class='size20'>{this.timerStr}</div>
          <div class='size16'>UTC</div>
          <div class='size20'>{this.utcTimeStr}</div>
        </div>
      </div >
    );
  }
}
