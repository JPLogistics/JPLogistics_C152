import { FSComponent, DisplayComponent, NodeReference, VNode, Subject, UnitType, NumberUnitSubject, NumberFormatter } from 'msfssdk';
import { ControlEvents, EventBus, HEvent } from 'msfssdk/data';
import { ADCEvents, APEvents } from 'msfssdk/instruments';
import { VNavMode, VNavSimVarEvents } from 'msfssdk/autopilot';

import { G1000ControlEvents, G1000ControlPublisher } from '../../../Shared/G1000Events';
import { AltAlertState, AltitudeAlertController } from './AltitudeAlertController';
import { PFDUserSettings } from '../../PFDUserSettings';
import { NumberUnitDisplay } from '../../../Shared/UI/Common/NumberUnitDisplay';

import './Altimeter.css';
import { FailedBox } from '../../../Shared/UI/FailedBox';
import { ADCSystemEvents } from '../../../Shared/Systems/ADCAvionicsSystem';
import { AvionicsSystemState, AvionicsSystemStateEvent } from '../../../Shared/Systems/G1000AvionicsSystem';

/**
 * The properties of the altitude indicator component.
 */
interface AltimeterProps {

  /** An instance of the event bus. */
  bus: EventBus;

  /** The g1000 control event bus publisher. */
  g1000Publisher: G1000ControlPublisher;
}

/**
 * The PFD airspeed indicator with speed tape.
 */
export class Altimeter extends DisplayComponent<AltimeterProps> {
  protected readonly controller = new AltitudeAlertController(this.props.bus);

  private altitudeBoxElement = FSComponent.createRef<HTMLDivElement>();
  private altitudeMetricBoxElement = FSComponent.createRef<HTMLDivElement>();
  private altitudeTenThousandsDataElement = FSComponent.createRef<SVGElement>();
  private altitudeThousandsDataElement = FSComponent.createRef<SVGElement>();
  private altitudeHundredsDataElement = FSComponent.createRef<SVGElement>();
  private altitudeTensDataElement = FSComponent.createRef<SVGElement>();
  private altitudeTapeTickElement = FSComponent.createRef<HTMLDivElement>();
  private altitudeTapeValuesElement = FSComponent.createRef<SVGGElement>();
  private altitudeScrollerValues: NodeReference<SVGTextElement>[] = [];
  private altitudeScrollerZeroes: NodeReference<SVGTextElement>[] = [];
  private kohlsmanSetting = FSComponent.createRef<HTMLElement>();
  private baroUnits = FSComponent.createRef<HTMLElement>();
  private altitudeBugRef = FSComponent.createRef<HTMLDivElement>();
  private minimumsBugRef = FSComponent.createRef<HTMLDivElement>();
  private minimumsBugColor = FSComponent.createRef<SVGElement>();
  private altitudeTrendVector = FSComponent.createRef<SVGElement>();
  private selectedAltitudeTensSubject = Subject.create('');
  private selectedAltitudeTensRef = FSComponent.createRef<HTMLSpanElement>();
  private selectedAltitudeHundredsSubject = Subject.create('––––');
  private selectedAltitudeHundredsRef = FSComponent.createRef<HTMLSpanElement>();
  private vnavTargetAltSubject = Subject.create(0);
  private vnavTargetAltRef = FSComponent.createRef<HTMLDivElement>();
  private alerterBoxRef = FSComponent.createRef<HTMLDivElement>();
  private alerterTextRef = FSComponent.createRef<HTMLDivElement>();
  private alerterSVGBugRef = FSComponent.createRef<SVGElement>();
  private alerterMetricBoxRef = FSComponent.createRef<HTMLDivElement>();
  private failedBox = FSComponent.createRef<FailedBox>();

  private isSelectedAltitudeSet = false;
  private selectedAltitude = 0;

  private readonly indicatedAltitudeSub = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));
  private readonly selectedAltitudeSub = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(NaN));

  private currentBaro = {
    units_hpa: false,
    standard: false,
    settingIn: 0
  }

  private vnavState = VNavMode.Enabled;
  private constraintAltitude = 0;

  private storedBaroIn: number | undefined = undefined;
  private currentDrawnAlt = 0;
  private minimumsAltitude = 0;

  private isFailed = false;

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    const adc = this.props.bus.getSubscriber<ADCEvents>();
    const ap = this.props.bus.getSubscriber<APEvents>();
    const vnav = this.props.bus.getSubscriber<VNavSimVarEvents>();
    const hEvtPub = this.props.bus.getSubscriber<HEvent>();
    const g1000ControlEvents = this.props.bus.getSubscriber<G1000ControlEvents>();

    adc.on('alt')
      .withPrecision(1)
      .handle(this.updateAltitude.bind(this));
    ap.on('alt_select')
      .withPrecision(0)
      .handle(alt => {
        this.selectedAltitude = alt;
        this.updateSelectedAltitude();
      });
    adc.on('kohlsman_setting_hg_1')
      .withPrecision(2)
      .handle(this.updateKohlsmanSetting.bind(this));
    adc.on('baro_units_hpa_1')
      .handle(this.updateBaroUnits.bind(this));
    adc.on('vs')
      .withPrecision(-1)
      .handle(this.updateVerticalSpeed.bind(this));
    hEvtPub.on('hEvent').handle(hEvent => {
      if (hEvent == 'AS1000_PFD_BARO_INC') {
        this.onbaroKnobTurn(true);
      } else if (hEvent == 'AS1000_PFD_BARO_DEC') {
        this.onbaroKnobTurn(false);
      }
    });

    PFDUserSettings.getManager(this.props.bus).whenSettingChanged('altMetric').handle(this.updateMetricDisplay.bind(this));
    PFDUserSettings.getManager(this.props.bus).whenSettingChanged('baroHpa').handle(this.updateBaroUnits.bind(this));

    g1000ControlEvents.on('std_baro_switch')
      .handle(this.updateBaroStd.bind(this));
    g1000ControlEvents.on('set_minimums')
      .handle(this.updateMinimums.bind(this));
    g1000ControlEvents.on('show_minimums')
      .handle((show) => {
        if (show) {
          this.minimumsBugRef.instance.style.display = '';
        } else {
          this.minimumsBugRef.instance.style.display = 'none';
        }
      });
    g1000ControlEvents.on('ap_alt_sel_set')
      .whenChanged()
      .handle(isSet => {
        this.isSelectedAltitudeSet = isSet;
        this.updateSelectedAltitude();
        this.updateSelectedAltitudeBugVisibility();
      });

    this.props.bus.getSubscriber<ControlEvents>().on('baro_set')
      .handle(() => this.handleBaroSetEvent());

    vnav.on('vnavConstraintAltitude').whenChanged().handle(alt => {
      this.constraintAltitude = alt;
      this.manageVnavConstraintAltitudeDisplay();
    });
    vnav.on('vnavMode').whenChanged().handle(state => {
      this.vnavState = state;
      this.manageVnavConstraintAltitudeDisplay();
    });

    this.controller.alerterState.sub(this.onAlerterStateChanged.bind(this));

    //init minimums to display = none
    this.minimumsBugRef.instance.style.display = 'none';
    this.altitudeBugRef.instance.style.display = 'none';

    this.failedBox.instance.setFailed(true);
    this.props.bus.getSubscriber<ADCSystemEvents>()
      .on('adc_state')
      .handle(this.onAdcStateChanged.bind(this));
  }

  /**
   * A callaback called when the system screen state changes.
   * @param state The state change event to handle.
   */
  private onAdcStateChanged(state: AvionicsSystemStateEvent): void {
    if (state.previous === undefined && state.current !== AvionicsSystemState.Off) {
      this.setFailed(false);
    } else {
      if (state.current === AvionicsSystemState.On) {
        this.setFailed(false);
      } else {
        this.setFailed(true);
      }
    }
  }

  /**
   * Sets if the display should be failed or not.
   * @param isFailed True if failed, false otherwise.
   */
  private setFailed(isFailed: boolean): void {
    if (isFailed) {
      this.isFailed = true;
      this.failedBox.instance.setFailed(true);

      this.altitudeTapeValuesElement.instance.classList.add('hidden-element');
      this.altitudeTrendVector.instance.classList.add('hidden-element');
      this.altitudeMetricBoxElement.instance.classList.add('hidden-element');

      this.altitudeBoxElement.instance.classList.add('hidden-element');
      this.altitudeBugRef.instance.classList.add('hidden-element');
      this.vnavTargetAltRef.instance.classList.add('hidden-element');
    } else {
      this.isFailed = false;
      this.failedBox.instance.setFailed(false);

      this.altitudeTapeValuesElement.instance.classList.remove('hidden-element');
      this.altitudeTrendVector.instance.classList.remove('hidden-element');
      this.altitudeMetricBoxElement.instance.classList.remove('hidden-element');

      this.altitudeBoxElement.instance.classList.remove('hidden-element');
      this.altitudeBugRef.instance.classList.remove('hidden-element');
      this.vnavTargetAltRef.instance.classList.remove('hidden-element');
    }
  }

  /**
   * Set the Kohlsman setting directly.
   * @param baroMbar The new barometer setting in millibars.
   */
  private static setKohlsmanMbar(baroMbar: number): void {
    SimVar.SetSimVarValue('K:KOHLSMAN_SET', 'number', (baroMbar * 16));
  }

  /**
   * Convenience function to set the Kohlsman in inHg, since that's the main unit we use here.
   * @param baroIn The new barometer setting in inHg.
   */
  private static setKohlsman(baroIn: number): void {
    Altimeter.setKohlsmanMbar(UnitType.IN_HG.convertTo(baroIn, UnitType.HPA));
  }

  /**
   * Handle when the G1000 detects that the user pressed the 'B' key to set the barometric pressure.
   */
  private handleBaroSetEvent(): void {
    const indicatedAltitude = this.controller.altitude;
    if (indicatedAltitude > 18000) {
      if (!this.currentBaro.standard) {
        this.props.g1000Publisher.publishEvent('std_baro_switch', true);
      }
    } else {
      if (this.currentBaro.standard) {
        this.storedBaroIn = undefined;
        this.props.g1000Publisher.publishEvent('std_baro_switch', false);
      }
    }
  }

  /**
   * Handle when the vnav constraint changes or the vnav state changes.
   */
  private manageVnavConstraintAltitudeDisplay(): void {
    if (this.constraintAltitude > 0 && this.vnavState === VNavMode.Enabled) {
      this.vnavTargetAltSubject.set(Math.round(this.constraintAltitude));
      this.vnavTargetAltRef.instance.classList.remove('hidden');
    } else {
      this.vnavTargetAltRef.instance.classList.add('hidden');
    }
  }

  /**
   * A method called when a minimums altitude value changes from the event bus.
   * @param mins The minimums altitude value.
   */
  private updateMinimums = (mins: number): void => {
    this.minimumsAltitude = Math.round(mins);
    this.updateMinimumsBug();
  }

  /**
   * A method called to update the location of the Minimums Bug on the altitude tape.
   */
  private updateMinimumsBug(): void {
    const deltaBug = this.minimumsAltitude - this.controller.altitude;
    //53.5px per hundred ft

    // if (this.altitude < 20) {
    //   deltaBug = this.selectedAltitude < 20 ? 0 : this.selectedAltitude - 20;
    // } else if (this.altitude < 50) {
    //   deltaBug = Math.max(this.selectedAltitude - (this.ias - 20), -30);
    // }
    if (this.controller.altitude >= -2000 && this.controller.altitude <= 99900) {
      this.minimumsBugRef.instance.style.transform = `translate3d(0,${-0.5575 * Utils.Clamp(deltaBug, -300, 300)}px,0)`;
    }

    if (this.controller.altitude < this.minimumsAltitude) {
      this.minimumsBugColor.instance?.setAttribute('fill', 'yellow');
    } else if (this.minimumsAltitude > (this.controller.altitude - 100) && this.controller.altitude >= this.minimumsAltitude) {
      this.minimumsBugColor.instance?.setAttribute('fill', 'white');
    } else {
      this.minimumsBugColor.instance?.setAttribute('fill', 'cyan');
    }
  }

  /**
   * Updates the displayed selected altitude..
   */
  private updateSelectedAltitude(): void {
    if (this.isSelectedAltitudeSet) {
      this.selectedAltitudeSub.set(this.selectedAltitude);

      this.controller.selectedAltitude = Math.round(this.selectedAltitude);

      if (this.controller.selectedAltitude == 0) {
        this.selectedAltitudeHundredsRef.instance.classList.add('preselect-hundreds-small');
        this.selectedAltitudeTensRef.instance.classList.add('hidden-preselect-tens');
        this.selectedAltitudeHundredsSubject.set('0');
        this.selectedAltitudeTensSubject.set('00');
      } else {
        this.selectedAltitudeHundredsRef.instance.classList.remove('preselect-hundreds-small');
        this.selectedAltitudeTensRef.instance.classList.remove('hidden-preselect-tens');
        this.selectedAltitudeHundredsSubject.set(`${Math.trunc(this.controller.selectedAltitude / 100)}`);
        this.selectedAltitudeTensSubject.set(`${Math.abs(this.controller.selectedAltitude % 100)}`.padStart(2, '0'));
        this.altitudeBugRef.instance.style.display = ''; //This initializes the bug so it doesn't show until the preselector has initially changed.
      }
    } else {
      this.selectedAltitudeSub.set(NaN);
      this.selectedAltitudeTensSubject.set('');
      this.selectedAltitudeHundredsSubject.set('––––');
      this.controller.selectedAltitude = NaN;
    }

    this.updateSelectedAltitudeBugPosition();
  }

  /**
   * Updates the position of the Selected Altitude Bug on the altitude tape.
   */
  private updateSelectedAltitudeBugPosition(): void {
    const deltaBug = this.controller.selectedAltitude - this.controller.altitude;
    if (this.controller.altitude >= -2000 && this.controller.altitude <= 99900) {
      this.altitudeBugRef.instance.style.transform = `translate3d(0,${-0.5575 * Utils.Clamp(deltaBug, -300, 300)}px,0)`;
    }
  }

  /**
   * Updates the visibility of the selected altitude bug.
   */
  private updateSelectedAltitudeBugVisibility(): void {
    this.altitudeBugRef.instance.style.display = this.isSelectedAltitudeSet ? '' : 'none';
  }

  /**
   * A method called when the alt alerter state is changed.
   * @param state is the altitude alerter state
   */
  private onAlerterStateChanged(state: AltAlertState): void {
    switch (state) {
      case AltAlertState.DISABLED:
      case AltAlertState.ARMED:
        this.alerterBoxRef.instance.classList.remove('thousand-flash', 'two-hundo-flash', 'yellow-flash');
        this.alerterTextRef.instance.classList.remove('thousand-flash', 'two-hundo-flash', 'yellow-flash');
        this.alerterSVGBugRef.instance.classList.remove('thousand-flash', 'two-hundo-flash', 'yellow-flash');
        break;
      case AltAlertState.WITHIN_1000:
        this.alerterBoxRef.instance.classList.add('thousand-flash');
        this.alerterTextRef.instance.classList.add('thousand-flash');
        this.alerterSVGBugRef.instance.classList.add('thousand-flash');
        break;
      case AltAlertState.WITHIN_200:
        this.alerterBoxRef.instance.classList.remove('thousand-flash', 'yellow-flash');
        this.alerterTextRef.instance.classList.remove('thousand-flash', 'yellow-flash');
        this.alerterSVGBugRef.instance.classList.remove('thousand-flash', 'yellow-flash');
        this.alerterBoxRef.instance.classList.add('two-hundo-flash');
        this.alerterTextRef.instance.classList.add('two-hundo-flash');
        this.alerterSVGBugRef.instance.classList.add('two-hundo-flash');
        break;
      case AltAlertState.CAPTURED:
        break;
      case AltAlertState.DEVIATION_200:
        this.alerterBoxRef.instance.classList.remove('two-hundo-flash');
        this.alerterTextRef.instance.classList.remove('two-hundo-flash');
        this.alerterSVGBugRef.instance.classList.remove('two-hundo-flash');
        this.alerterBoxRef.instance.classList.add('yellow-flash');
        this.alerterTextRef.instance.classList.add('yellow-flash');
        this.alerterSVGBugRef.instance.classList.add('yellow-flash');
        break;
    }
  }

  /**
   * Updates the kohlsman value based on knob input.
   * @param increase a bool to determine whether to increcement up or down the current baro setting.
   */
  private onbaroKnobTurn(increase: boolean): void {
    if (this.currentBaro.standard) {
      this.currentBaro.settingIn = 29.92;
      this.currentBaro.standard = false;
      this.props.g1000Publisher.publishEvent('std_baro_switch', this.currentBaro.standard);
    }
    if (increase) {
      if (this.currentBaro.units_hpa) {
        Altimeter.setKohlsman(this.currentBaro.settingIn + UnitType.HPA.convertTo(1, UnitType.IN_HG));
      } else {
        Altimeter.setKohlsman(this.currentBaro.settingIn + 0.01);
      }
    } else {
      if (this.currentBaro.units_hpa) {
        Altimeter.setKohlsman(this.currentBaro.settingIn - UnitType.HPA.convertTo(1, UnitType.IN_HG));
      } else {
        Altimeter.setKohlsman(this.currentBaro.settingIn - 0.01);
      }
    }
    this.updateBaroDisplay();
  }

  /**
   * Updates the kohlsman value when it changes.
   * @param baroUnits The new selected altitude value.
   */
  private updateBaroUnits(baroUnits: boolean): void {
    this.currentBaro.units_hpa = baroUnits;
    this.updateBaroDisplay();
  }

  /**
   * Updates the kohlsman value when it changes.
   * @param baroStd The new selected altitude value.
   */
  private updateBaroStd(baroStd: boolean): void {
    this.currentBaro.standard = baroStd;
    if (baroStd == true) {
      this.storedBaroIn = this.currentBaro.settingIn;
      this.currentBaro.settingIn = 29.92;
    } else if (this.storedBaroIn !== undefined) {
      this.currentBaro.settingIn = this.storedBaroIn;
      this.storedBaroIn = undefined;
    }
    Altimeter.setKohlsman(this.currentBaro.settingIn);
    this.updateBaroDisplay();
  }

  /**
   * Updates the kohlsman value when it changes.
   * @param kohlsmanSetting The new selected altitude value.
   */
  private updateKohlsmanSetting(kohlsmanSetting: number): void {
    this.currentBaro.settingIn = kohlsmanSetting;
    this.updateBaroDisplay();
  }

  /**
   * Updates the metric display.
   * @param isMetric whether the metric display options should be shown.
   */
  private updateMetricDisplay(isMetric: boolean): void {
    if (isMetric) {
      this.altitudeMetricBoxElement.instance.style.visibility = 'visible';
      this.alerterMetricBoxRef.instance.style.visibility = 'visible';
    } else {
      this.altitudeMetricBoxElement.instance.style.visibility = 'hidden';
      this.alerterMetricBoxRef.instance.style.visibility = 'hidden';
    }
  }

  /**
   * Updates the kohlsman display value.
   */
  private updateBaroDisplay(): void {
    if (this.currentBaro.standard && this.kohlsmanSetting.instance !== null && this.baroUnits.instance !== null) {
      this.kohlsmanSetting.instance.textContent = 'STD BARO';
      this.baroUnits.instance.textContent = '';
    } else if (this.currentBaro.units_hpa && this.kohlsmanSetting.instance !== null && this.baroUnits.instance !== null) {
      this.kohlsmanSetting.instance.textContent = `${Math.round(33.864 * this.currentBaro.settingIn)}`;
      this.baroUnits.instance.textContent = 'HPA';
    } else if (this.kohlsmanSetting.instance !== null && this.baroUnits.instance !== null) {
      this.kohlsmanSetting.instance.textContent = `${(this.currentBaro.settingIn.toPrecision(4))}`;
      this.baroUnits.instance.textContent = 'IN';
    }
  }

  /**
   * Updates the altitude indicator when the altitude changes.
   * @param indicatedAlt The indicated altitude, in feet.
   */
  private updateAltitude(indicatedAlt: number): void {
    if (this.isFailed) {
      indicatedAlt = 0;
    }

    this.indicatedAltitudeSub.set(indicatedAlt);

    this.controller.altitude = indicatedAlt;
    const alt = Math.abs(indicatedAlt);
    const altPrefix = indicatedAlt < 0 ? -1 : 1;

    indicatedAlt < 0 ? this.altitudeBoxElement.instance.classList.add('below-msl') : this.altitudeBoxElement.instance.classList.remove('below-msl');
    indicatedAlt < 20 && indicatedAlt > -20 ? this.altitudeBoxElement.instance.classList.add('trans-msl') : this.altitudeBoxElement.instance.classList.remove('trans-msl');

    const tens = alt % 100;
    const hundreds = (alt % 1000 - tens) / 100;
    const thousands = ((alt - (alt % 1000)) / 1000) % 10;
    const tenThousands = (alt - (alt % 10000)) / 10000;

    if (this.altitudeTenThousandsDataElement.instance !== null) {
      let newTranslation: number;
      if (indicatedAlt < -980 || (indicatedAlt < -2000 || indicatedAlt > 99900)) {
        newTranslation = -660;
      } else {
        newTranslation = -300 + (tenThousands * 30) * altPrefix;
        if (thousands === 9 && hundreds == 9 && tens > 80) {
          newTranslation += 1.5 * (tens - 80) * altPrefix;
        }
      }
      this.altitudeTenThousandsDataElement.instance.setAttribute('transform', `translate(0,${newTranslation})`);
    }
    if (this.altitudeThousandsDataElement.instance !== null) {
      (indicatedAlt < 1000 && indicatedAlt > -1000) ? this.altitudeThousandsDataElement.instance.classList.add('no-zero') : this.altitudeThousandsDataElement.instance.classList.remove('no-zero');
      let newTranslation: number;
      if ((indicatedAlt > -980 && indicatedAlt < -80) || (indicatedAlt < -2000 || indicatedAlt > 99900)) {
        newTranslation = -660;
      } else {
        newTranslation = -300 + (thousands * 30) * altPrefix;
        if (hundreds == 9 && tens > 80) {
          newTranslation += 1.5 * (tens - 80) * altPrefix;
        }
      }
      this.altitudeThousandsDataElement.instance.setAttribute('transform', `translate(0,${newTranslation})`);
    }
    if (this.altitudeHundredsDataElement.instance !== null) {
      (indicatedAlt < 100 && indicatedAlt > -100) ? this.altitudeHundredsDataElement.instance.classList.add('no-zero') : this.altitudeHundredsDataElement.instance.classList.remove('no-zero');
      let newTranslation: number;
      if ((indicatedAlt > -80 && indicatedAlt < 0) || (indicatedAlt < -2000 || indicatedAlt > 99900)) {
        newTranslation = -660;
      } else {
        newTranslation = -300 + (hundreds * 30) * altPrefix;
        if (tens > 80) {
          newTranslation += 1.5 * (tens - 80) * altPrefix;
        }
      }
      this.altitudeHundredsDataElement.instance.setAttribute('transform', `translate(0,${newTranslation})`);
    }
    if (this.altitudeTensDataElement.instance !== null) {
      const newTranslation = (indicatedAlt < -2000 || indicatedAlt > 99900) ? -399 : -191 + (tens * 1.3) * altPrefix;
      this.altitudeTensDataElement.instance.setAttribute('transform', `translate(0,${newTranslation})`);
    }

    if (this.altitudeTapeTickElement.instance !== null) {
      const offset = indicatedAlt >= 0 ? -104 : -4;
      const newTranslation = (indicatedAlt < -2000 || indicatedAlt > 99900) ? -104 : offset + indicatedAlt % 100;
      this.altitudeTapeTickElement.instance.style.transform = `translate3d(0px, ${newTranslation * 0.5575}px, 0px)`;
    }

    if ((indicatedAlt / 100 >= this.currentDrawnAlt + 1 || indicatedAlt / 100 < this.currentDrawnAlt) && (indicatedAlt > -2000 || indicatedAlt > 99900)) {
      this.currentDrawnAlt = Math.floor(indicatedAlt / 100);
      for (let i = 0; i < this.altitudeScrollerValues.length; i++) {
        const scrollerValue = this.altitudeScrollerValues[i].instance;
        const zeroValue = this.altitudeScrollerZeroes[i].instance;
        if (scrollerValue !== null) {
          if ((i - 4) + this.currentDrawnAlt === 0) {
            scrollerValue.textContent = '';
            zeroValue.textContent = '0';
          } else {
            scrollerValue.textContent = ((i - 4) + this.currentDrawnAlt).toString();
            zeroValue.textContent = '00';
          }
        }
      }
    }
    this.updateSelectedAltitudeBugPosition();
    this.updateMinimumsBug();
    this.controller.updateAltitudeAlerter();
  }

  /**
   * Updates the Altitude Trend Vector when the vertical speed changes.
   * @param vs The new vertical speed.
   */
  private updateVerticalSpeed(vs: number): void {
    const currentTrend = vs / 10;
    const verticalOffset = -104 - Math.max(0, currentTrend);

    this.altitudeTrendVector.instance.setAttribute('y', verticalOffset.toString());
    this.altitudeTrendVector.instance.setAttribute('height', Math.abs(currentTrend).toString());
  }

  /**
   * Builds a numerical scroller with dual numbers for the altimeter window.
   * @param startYValue The starting Y value in the svg to start number at.
   * @returns A collection of text elements for the numerical scroller.
   */
  private buildDoubleScroller(startYValue = 78): SVGTextElement[] {
    const scroller: SVGTextElement[] = [];

    let yValue = startYValue;

    for (let i = 0; i < 15; i++) {
      const number = i < 7 ? (220 - i * 20) : i * 20 - 20;
      const numberText = i == 13 ? ' ' : i == 14 ? '- -' : number.toString().slice(-2);

      let className = numberText == '00' ? 'zero-digit' : 'normal-digit';
      if (i == 5 || i == 7) {
        const altClassName = i == 5 ? className + ' top show-below-msl' : className + ' bottom show-above-msl';
        const altNumberText = (100 - number % 100).toString().slice(-2);
        scroller.push(<text x='15' y={yValue} class={altClassName} fill="white" text-anchor="middle" font-size='26'>{altNumberText}</text>);
        className += i == 5 ? ' top show-above-msl' : ' bottom show-below-msl';
      }
      scroller.push(<text x='15' y={yValue} class={className} fill="white" text-anchor="middle" font-size='26'>{numberText}</text>);

      yValue += 26;
    }

    return scroller;
  }

  /**
   * Builds a numerical scroller for the altimeter window.
   * @param startYValue The starting Y value in the svg to start number at.
   * @returns A collection of text elements for the numerical scroller.
   */
  private buildSingleScroller(startYValue = -3): SVGTextElement[] {
    const scroller: SVGTextElement[] = [];
    let yValue = startYValue;

    for (let i = 0; i < 24; i++) {
      const number = i < 12 ? (11 - i) : i - 11;
      const numberText = i == 23 ? '-' : number.toString().slice(-1);

      let className = number === 0 ? 'zero-digit' : 'normal-digit';
      if (i == 10 || i == 12) {
        const altClassName = i == 10 ? className + ' top show-below-msl' : className + ' bottom show-above-msl';
        const altNumber = 10 - number;
        const altNumberText = altNumber.toString();
        scroller.push(<text x='8' y={yValue} class={altClassName} fill="white" text-anchor="middle" font-size='26'>{altNumberText}</text>);
        className += i == 10 ? ' top show-above-msl' : ' bottom show-below-msl';
      }
      scroller.push(<text x='8' y={yValue} class={className} fill="white" text-anchor="middle" font-size='26'>{numberText}</text>);

      yValue += 30;
    }

    return scroller;
  }

  /**
   * Builds the tick marks on the altitude tape.
   * @returns A collection of tick mark line elements.
   */
  private buildAltitudeTapeTicks(): SVGLineElement[] {
    const ticks: SVGLineElement[] = [];

    for (let i = 0; i < 41; i++) {
      const length = i === 0 || i % 5 === 0 ? 30 : 15;

      const startX = 1;
      const startY = 400 - (i * 20);

      const endX = startX + length;
      const endY = startY;

      ticks.push(<line x1={startX} y1={startY} x2={endX} y2={endY} stroke="rgb(203,203,203)" stroke-width="3px" />);
    }

    return ticks;
  }

  /**
   * Builds the altitude numbers for the altimeter tape.
   * @returns A collection of airspeed number text elements.
   */
  private buildAltitudeTapeNumbers(): SVGTextElement[] {
    const text: SVGTextElement[] = [];
    let altStart = -4;

    for (let i = 0; i < 9; i++) {
      const startX = 133;
      const startY = 415 - (i * 100);

      const numberText = altStart.toString();
      const textElement = FSComponent.createRef<SVGTextElement>();
      text.push(<text x={startX} y={startY} fill="rgb(203,203,203)" text-anchor="end" font-size='44' ref={textElement}>{numberText}</text>);
      this.altitudeScrollerValues.push(textElement);
      altStart++;
    }

    return text;
  }

  /**
   * Builds the zeroes for the altitude tape.
   * @returns A collection of zeroes text elements.
   */
  private buildAltitudeTapeZeros(): SVGTextElement[] {
    const zeros: SVGTextElement[] = [];

    for (let i = 0; i < 9; i++) {
      const startX = 175;
      const startY = 415 - (i * 100);

      const zeroElement = FSComponent.createRef<SVGTextElement>();
      zeros.push(<text x={startX} y={startY} fill="rgb(203,203,203)" text-anchor="end" font-size='38' ref={zeroElement}>00</text>);
      this.altitudeScrollerZeroes.push(zeroElement);
    }

    return zeros;
  }

  /**
   * Render the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (

      <div class="altimeter">
        <div class="altimeter-middle-border"></div>
        <div class="altitude-tick-marks">
          <div style="height: 446px; width: 100px;" ref={this.altitudeTapeTickElement} >
            <FailedBox ref={this.failedBox} />
            <svg height="446" width="100" viewBox="0 -400 179 800">
              <g class="AltitudeTape" transform="translate(0,0)">
                {this.buildAltitudeTapeTicks()}
                <g ref={this.altitudeTapeValuesElement}>
                  {this.buildAltitudeTapeZeros()}
                  {this.buildAltitudeTapeNumbers()}
                </g>
              </g>
            </svg>
          </div>
        </div>

        <div class="altitude-trend-vector">
          <svg height="446" width="100" viewBox="0 -400 179 800">
            <rect ref={this.altitudeTrendVector} x="1" y="-104" width="7" height="0" stroke="white" stroke-width="1px" fill="magenta" />
          </svg>
        </div>

        <div class="altitude-box" ref={this.altitudeBoxElement}>
          <svg>
            <path d="M 4 50 l 8 -5 l 0 -12 c 0 -1 1 -2 2 -2 l 54 0 l 0 -13 c 0 -1 1 -2 2 -2 l 30 0 c 1 0 2 1 2 2 l 0 63 c 0 1 -1 2 -2 2 l -30 0 c -1 0 -2 -1 -2 -2 l 0 -13 l -54 0 c -1 0 -2 -1 -2 -2 l 0 -12 l -8 -4 z" fill="black" stroke="whitesmoke" stroke-width="1" />
          </svg>

          <div class="alt-ten-thousands-scroller altitude-scroller-background no-zero">
            <svg height="35" width="17">
              <g ref={this.altitudeTenThousandsDataElement} transform="translate(0,0)">{this.buildSingleScroller()}</g>
            </svg>
          </div>

          <div class="alt-thousands-scroller altitude-scroller-background">
            <svg height="35" width="17">
              <g ref={this.altitudeThousandsDataElement} transform="translate(0,0)">{this.buildSingleScroller()}</g>
            </svg>
          </div>

          <div class="alt-hundreds-scroller altitude-scroller-background">
            <svg height="35" width="17">
              <g ref={this.altitudeHundredsDataElement} transform="translate(0,0)">{this.buildSingleScroller()}</g>
            </svg>
          </div>

          <div class="alt-tens-scroller altitude-scroller-background">
            <div class="alt-tens-mask"></div>
            <svg height="66" width="29">
              <g ref={this.altitudeTensDataElement} transform="translate(0,0)">{this.buildDoubleScroller()}</g>
            </svg>
          </div>
        </div>
        <div class="altitude-metric-box" ref={this.altitudeMetricBoxElement}>
          <NumberUnitDisplay
            value={this.indicatedAltitudeSub}
            formatter={NumberFormatter.create({ precision: 1, nanString: '––––' })}
            displayUnit={Subject.create(UnitType.METER)}
            class='metric-altitude'
          />
        </div>

        <div class="preselect-bug" ref={this.altitudeBugRef}>
          <svg>
            <path d="M 0 36 l 12 0 l 0 9 l -8 5 l 8 4 l 0 9 l -12 0 z" fill="cyan" stroke="black" stroke-width="1" />
          </svg>
        </div>

        <div class="minimums-bug" ref={this.minimumsBugRef}>
          <svg>
            <path ref={this.minimumsBugColor} d='M 5 50 l 8 -5 l 0 -14 l 3 0 l 0 14 l -9 5 l 9 4 l 0 14 l -3 0 l 0 -14 l -8 -4' fill="cyan" />
          </svg>
        </div>

        <div class="preselect-box" ref={this.alerterBoxRef}>
          <svg>
            <path ref={this.alerterSVGBugRef} d="M 6 8 l 8 0 l 0 4 l -4 3 l 0 2 l 4 3 l 0 4 l -8 0 l 0 -16 z" fill="cyan" />
          </svg>

          <div class="preselect-value" ref={this.alerterTextRef}>
            <span ref={this.selectedAltitudeHundredsRef}>{this.selectedAltitudeHundredsSubject}</span>
            {/* <span style="font-size:20px;fill:cyan">{this.selectedAltitudeTensSubject}</span> */}
            <span ref={this.selectedAltitudeTensRef} class='preselect-tens'>{this.selectedAltitudeTensSubject}</span>
          </div>
        </div>

        <div class="preselect-metric-box" ref={this.alerterMetricBoxRef}>
          <NumberUnitDisplay
            value={this.selectedAltitudeSub}
            formatter={NumberFormatter.create({ precision: 1, nanString: '––––' })}
            displayUnit={Subject.create(UnitType.METER)}
            class='metric-altitude'
          />
        </div>

        <div class="alt-indicator-vnav-target" ref={this.vnavTargetAltRef}>{this.vnavTargetAltSubject}</div>

        <div class="pressure-box">
          <span ref={this.kohlsmanSetting} />
          <span ref={this.baroUnits} class="size14">IN</span>
        </div>

      </div >
    );
  }
}
