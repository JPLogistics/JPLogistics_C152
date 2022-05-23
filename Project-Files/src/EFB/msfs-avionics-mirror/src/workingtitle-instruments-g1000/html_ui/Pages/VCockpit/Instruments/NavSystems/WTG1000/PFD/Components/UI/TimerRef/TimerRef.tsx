import { FSComponent, VNode, Subject, ArraySubject, ComputedSubject, UnitType, UnitFamily, Unit } from 'msfssdk';
import { ControlEvents, EventBus } from 'msfssdk/data';
import { DHEvents } from 'msfssdk/instruments';

import { G1000ControlEvents } from '../../../../Shared/G1000Events';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { ArrowToggle } from '../../../../Shared/UI/UIControls/ArrowToggle';
import { NumberInput } from '../../../../Shared/UI/UIControls/NumberInput';
import { ActionButton } from '../../../../Shared/UI/UIControls/ActionButton';
import { UiView, UiViewProps } from '../../../../Shared/UI/UiView';
import { VSpeed, VSpeedType } from '../../FlightInstruments/AirspeedIndicator';
import { TimerInput } from './TimerInput';
import { SelectControl } from '../../../../Shared/UI/UIControls/SelectControl';
import { ContextMenuDialog, ContextMenuItemDefinition } from '../../../../Shared/UI/Dialogs/ContextMenuDialog';
import { Timer, TimerMode } from './Timer';
import { PFDPageMenuDialog } from '../PFDPageMenuDialog';
import './TimerRef.css';
import { UnitsUserSettingManager } from '../../../../Shared/Units/UnitsUserSettings';

/**
 * The properties on the timer ref popout component.
 */
interface TimerRefProps extends UiViewProps {
  /** An instance of the event bus. */
  bus: EventBus;
  /** A user setting manager. */
  unitsSettingManager: UnitsUserSettingManager;
}

/**
 * The PFD timer ref popout.
 */
export class TimerRef extends UiView<TimerRefProps> {
  public popoutRef = FSComponent.createRef<UiView>();
  private readonly containerRef = FSComponent.createRef<HTMLElement>();

  private readonly glideRef = Subject.create(1);
  private readonly glideRefChanged = ComputedSubject.create(false, (v) => { return v ? ' *' : ''; });
  private readonly vrRef = Subject.create(1);
  private readonly vrRefChanged = ComputedSubject.create(false, (v) => { return v ? ' *' : ''; });
  private readonly vxRef = Subject.create(1);
  private readonly vxRefChanged = ComputedSubject.create(false, (v) => { return v ? ' *' : ''; });
  private readonly vyRef = Subject.create(1);
  private readonly vyRefChanged = ComputedSubject.create(false, (v) => { return v ? ' *' : ''; });
  private readonly minsRef = Subject.create(0);
  private readonly timerComponentRef = FSComponent.createRef<TimerInput>();
  private readonly upDownItems = ArraySubject.create<string>();
  private readonly buttonRef = FSComponent.createRef<ActionButton>();
  private readonly upDownControlRef = FSComponent.createRef<SelectControl<string>>();
  private timerButtonSubject = Subject.create('Start?');
  private g1000Pub = this.props.bus.getPublisher<G1000ControlEvents>();
  private controlPub = this.props.bus.getPublisher<ControlEvents>();
  private dhSub = this.props.bus.getSubscriber<DHEvents>();

  /**
   * Callback to handle when Timer changes the mode after reaching 0.
   * @param mode is the TimerMode
   */
  private onTimerModeChanged = (mode: TimerMode): void => {
    this.upDownControlRef.instance.SelectedValue.set(mode);
  };

  /**
   * Callback to handle when Timer value changes.
   * @param seconds is the new timer time value in seconds.
   */
  private onTimerValueChanged = (seconds: number): void => {
    if (!this.timerComponentRef.instance.getIsActivated()) {
      this.timerComponentRef.instance.setInput(seconds);
    }
  };

  public timer = new Timer(this.props.bus, this.onTimerModeChanged, this.onTimerValueChanged);

  private vSpeeds: VSpeed[] = [
    { type: VSpeedType.Vx, value: Math.round(Simplane.getDesignSpeeds().Vx), modified: Subject.create<boolean>(false), display: true },
    { type: VSpeedType.Vy, value: Math.round(Simplane.getDesignSpeeds().Vy), modified: Subject.create<boolean>(false), display: true },
    { type: VSpeedType.Vr, value: Math.round(Simplane.getDesignSpeeds().Vr), modified: Subject.create<boolean>(false), display: true },
    { type: VSpeedType.Vglide, value: Math.round(Simplane.getDesignSpeeds().BestGlide), modified: Subject.create<boolean>(false), display: true },
    { type: VSpeedType.Vapp, value: Math.round(Simplane.getDesignSpeeds().Vapp), modified: Subject.create<boolean>(false), display: false }
  ];
  private vSpeedSubjects = {
    vx: Subject.create(this.vSpeeds[0].value),
    vy: Subject.create(this.vSpeeds[1].value),
    vr: Subject.create(this.vSpeeds[2].value),
    vg: Subject.create(this.vSpeeds[3].value),
    vapp: Subject.create(this.vSpeeds[4].value)
  };
  private currentMinFeet = Subject.create(0);
  private minimumsSubject = Subject.create(0);
  private minimumsUnit = ComputedSubject.create<Unit<UnitFamily.Distance>, string>(
    UnitType.FOOT, (u) => { return u === UnitType.METER ? 'M' : 'FT'; }
  );
  private vSpeedToggleMap: Map<number, VSpeed> = new Map();
  private vSpeedSubjectMap: Map<VSpeedType, Subject<number>> = new Map();
  private vSpeedObjectMap: Map<VSpeedType, VSpeed> = new Map();

  private onOffToggleOptions = ['Off', 'On'];
  private minsToggleOptions = ['Off', 'BARO', 'TEMP COMP'];

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.CLR:
        this.close();
        return true;
      case FmsHEvent.MENU:
        this.onMenu();
        return true;
    }
    return false;
  }

  /**
   * An event called when the menu button is pressed.
   * @returns True if the event was handled in this section.
   */
  public onMenu(): boolean {
    // console.log('called menu');
    const dialog = this.props.viewService.open('PageMenuDialog', true) as PFDPageMenuDialog;
    dialog.setMenuItems([
      {
        id: 'enable-all',
        renderContent: (): VNode => <span>All References On</span>,
        isEnabled: true,
        action: (): void => {
          this.enableAllRefSpeeds(true);
        }
      },
      {
        id: 'disable-all',
        renderContent: (): VNode => <span>All References Off</span>,
        isEnabled: true,
        action: (): void => {
          this.enableAllRefSpeeds(false);
        }
      },
      {
        id: 'restore-defaults',
        renderContent: (): VNode => <span>Restore Defaults</span>,
        isEnabled: true,
        action: (): void => {
          // console.log('Restore defaults');
          this.resetVSpeeds();
        }
      },
    ]);

    return true;
  }

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.upDownItems.set(['Up', 'Dn']);
    this.vSpeedToggleMap.set(3, this.vSpeeds[3]);
    this.vSpeedToggleMap.set(5, this.vSpeeds[2]);
    this.vSpeedToggleMap.set(7, this.vSpeeds[0]);
    this.vSpeedToggleMap.set(9, this.vSpeeds[1]);
    this.vSpeedSubjectMap.set(VSpeedType.Vglide, this.vSpeedSubjects.vg);
    this.vSpeedSubjectMap.set(VSpeedType.Vr, this.vSpeedSubjects.vr);
    this.vSpeedSubjectMap.set(VSpeedType.Vx, this.vSpeedSubjects.vx);
    this.vSpeedSubjectMap.set(VSpeedType.Vy, this.vSpeedSubjects.vy);
    this.vSpeedObjectMap.set(VSpeedType.Vglide, this.vSpeeds[3]);
    this.vSpeedObjectMap.set(VSpeedType.Vr, this.vSpeeds[2]);
    this.vSpeedObjectMap.set(VSpeedType.Vx, this.vSpeeds[0]);
    this.vSpeedObjectMap.set(VSpeedType.Vy, this.vSpeeds[1]);

    this.vSpeeds[0].modified.sub(v => this.vxRefChanged.set(v));
    this.vSpeeds[1].modified.sub(v => this.vyRefChanged.set(v));
    this.vSpeeds[2].modified.sub(v => this.vrRefChanged.set(v));
    this.vSpeeds[3].modified.sub(v => this.glideRefChanged.set(v));

    this.props.unitsSettingManager.altitudeUnits.sub(u => {
      const oldUnit = this.minimumsUnit.getRaw();
      this.minimumsUnit.set(u);
      if (u !== oldUnit) {
        switch (u) {
          case UnitType.FOOT:
            this.minimumsSubject.set(Math.round(this.currentMinFeet.get()));
            this.controlPub.pub('set_da_distance_unit', 'feet');
            break;
          case UnitType.METER:
            this.minimumsSubject.set(Math.round(UnitType.METER.convertFrom(this.currentMinFeet.get(), UnitType.FOOT)));
            this.controlPub.pub('set_da_distance_unit', 'meters');
            break;
          default:
            console.warn('Unknown altitude unit handled in TMR/REF: ' + u.name);
        }
      }
    });

    this.minimumsUnit.set(this.props.unitsSettingManager.altitudeUnits.get());

    const g1000Events = this.props.bus.getSubscriber<G1000ControlEvents>();
    g1000Events.on('show_minimums').handle((show) => {
      const option = show ? 1 : 0;
      if (option !== this.minsRef.get()) {
        this.minsRef.set(option);
      }
    });

    this.currentMinFeet.sub(v => {
      if (this.minimumsUnit.getRaw() === UnitType.FOOT) {
        this.minimumsSubject.set(Math.round(v));
      } else {
        this.minimumsSubject.set(Math.round(UnitType.METER.convertFrom(v, UnitType.FOOT)));
      }
    });

    this.dhSub.on('decision_altitude').handle((da) => {
      this.currentMinFeet.set(da);
    });
  }

  /** Method to reset all v speeds to defaults */
  private resetVSpeeds(): void {
    this.vSpeeds[0].value = Math.round(Simplane.getDesignSpeeds().Vx);
    this.vSpeedSubjects.vx.set(this.vSpeeds[0].value);
    this.vSpeeds[0].modified.set(false);
    this.g1000Pub.pub('vspeed_set', this.vSpeeds[0], true);
    this.vSpeeds[1].value = Math.round(Simplane.getDesignSpeeds().Vy);
    this.vSpeedSubjects.vy.set(this.vSpeeds[1].value);
    this.vSpeeds[1].modified.set(false);
    this.g1000Pub.pub('vspeed_set', this.vSpeeds[1], true);
    this.vSpeeds[2].value = Math.round(Simplane.getDesignSpeeds().Vr);
    this.vSpeedSubjects.vr.set(this.vSpeeds[2].value);
    this.vSpeeds[2].modified.set(false);
    this.g1000Pub.pub('vspeed_set', this.vSpeeds[2], true);
    this.vSpeeds[3].value = Math.round(Simplane.getDesignSpeeds().BestGlide);
    this.vSpeedSubjects.vg.set(this.vSpeeds[3].value);
    this.vSpeeds[3].modified.set(false);
    this.g1000Pub.pub('vspeed_set', this.vSpeeds[3], true);
    this.vSpeeds[4].value = Math.round(Simplane.getDesignSpeeds().Vapp);
    this.vSpeeds[4].modified.set(false);
  }

  /**
   * Method enable or disable all ref speeds.
   * @param enable Whether to enable or disable the ref speeds.
   */
  private enableAllRefSpeeds(enable: boolean): void {
    const value = enable ? 1 : 0;
    this.onVyRefOptionSelected(value);
    this.onVxRefOptionSelected(value);
    this.onVrRefOptionSelected(value);
    this.onGlideRefOptionSelected(value);
  }

  /**
   * Method to set vspeed asterisk visibility.
   * @param vspeed is the VSpeedType to be updated
   * @param value is the vspeed value
   */
  private updateVSpeed(vspeed: VSpeedType, value: number): void {
    const object = this.vSpeedObjectMap.get(vspeed);
    if (object !== undefined) {
      object.value = value;
      object.modified.set(true);
      this.g1000Pub.pub('vspeed_set', object, true);
    }
  }

  /**
   * Callback to handle when Timer Button is Pressed.
   */
  public onTimerButtonPressed = (): void => {
    if (this.timerComponentRef.instance.getTimerState()) {
      this.timerComponentRef.instance.stopTimer();
      this.timerButtonSubject.set('Reset?');
    } else if (this.timerComponentRef.instance.getTimerResetState()) {
      this.timerComponentRef.instance.resetTimer();
      this.timerButtonSubject.set('Start?');
    } else {
      this.timerComponentRef.instance.startTimer();
      this.timerButtonSubject.set('Stop?');
    }
  };

  // ---- TOGGLE Vg CALLBACK
  private onGlideRefOptionSelected = (index: number): void => {
    // console.log('INDEX HERE -- ', index);
    this.glideRef.set(index);
    const vSpeed = this.vSpeedObjectMap.get(VSpeedType.Vglide);
    if (vSpeed !== undefined) {
      vSpeed.value = this.vSpeedSubjects.vg.get();
      vSpeed.display = index === 1;
      this.g1000Pub.pub('vspeed_display', vSpeed, true);
    }
  };

  // ---- TOGGLE Vr CALLBACK
  private onVrRefOptionSelected = (index: number): void => {
    this.vrRef.set(index);
    const vSpeed = this.vSpeedObjectMap.get(VSpeedType.Vr);
    if (vSpeed !== undefined) {
      vSpeed.value = this.vSpeedSubjects.vr.get();
      vSpeed.display = index === 1;
      this.g1000Pub.pub('vspeed_display', vSpeed, true);
    }
  };

  // ---- TOGGLE Vx CALLBACK
  private onVxRefOptionSelected = (index: number): void => {
    this.vxRef.set(index);
    const vSpeed = this.vSpeedObjectMap.get(VSpeedType.Vx);
    if (vSpeed !== undefined) {
      vSpeed.value = this.vSpeedSubjects.vx.get();
      vSpeed.display = index === 1;
      this.g1000Pub.pub('vspeed_display', vSpeed, true);
    }
  };

  // ---- TOGGLE Vy CALLBACK
  private onVyRefOptionSelected = (index: number): void => {
    this.vyRef.set(index);
    const vSpeed = this.vSpeedObjectMap.get(VSpeedType.Vy);
    if (vSpeed !== undefined) {
      vSpeed.value = this.vSpeedSubjects.vy.get();
      vSpeed.display = index === 1;
      this.g1000Pub.pub('vspeed_display', vSpeed, true);
    }
  };

  // ---- TOGGLE MINIMUMS CALLBACK
  private onMinimumsRefOptionSelected = (index: number): void => {
    this.minsRef.set(index);
    this.g1000Pub.pub('show_minimums', index !== 0 ? true : false, true);
  };

  // ---- CHANGE MINIMUMS VALUE CALLBACK
  private updateMinimumsValue = (): void => {
    const raw = this.minimumsSubject.get();
    const converted = this.minimumsUnit.getRaw() == UnitType.METER ? UnitType.FOOT.convertFrom(raw, UnitType.METER) : raw;
    this.controlPub.pub('set_decision_altitude', converted, true, true);
  };

  // ---- UpDown Menu Item Select CALLBACK
  private onUpDownMenuSelected = (index: number): void => {
    if (index === 1) {
      this.timer.mode = TimerMode.DOWN;
    } else {
      this.timer.mode = TimerMode.UP;
    }
  };

  // ---- UpDown Menu Item List Build
  private buildUpDownMenuItems = (item: string, index: number): ContextMenuItemDefinition => {
    return { id: index.toString(), renderContent: (): VNode => <span>{item}</span>, estimatedWidth: item.length * ContextMenuDialog.CHAR_WIDTH };
  };

  // ---- updateVy Callback method
  private updateVy = (value: number): void => {
    this.updateVSpeed(VSpeedType.Vy, value);
  };

  // ---- updateVy Callback method
  private updateVx = (value: number): void => {
    this.updateVSpeed(VSpeedType.Vx, value);
  };

  // ---- updateVy Callback method
  private updateVr = (value: number): void => {
    this.updateVSpeed(VSpeedType.Vr, value);
  };

  // ---- updateVy Callback method
  private updateVglide = (value: number): void => {
    this.updateVSpeed(VSpeedType.Vglide, value);
  };

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class='popout-dialog' ref={this.viewContainerRef}>
        <div ref={this.containerRef} class="timerref-container">
          <div class="timerref-timer-title">Timer</div>
          <TimerInput ref={this.timerComponentRef} timer={this.timer} onRegister={this.register} />
          <SelectControl viewService={this.props.viewService} ref={this.upDownControlRef} onRegister={this.register} class="timerref-timer-updown" outerContainer={this.viewContainerRef} data={this.upDownItems} onItemSelected={this.onUpDownMenuSelected} buildMenuItem={this.buildUpDownMenuItems} />
          <ActionButton class="timerref-timer-button" onRegister={this.register} ref={this.buttonRef} text={this.timerButtonSubject} onExecute={this.onTimerButtonPressed} />
          <hr class="timerref-hr1" />
          <div class="timerref-glide-title">GLIDE</div>
          <div class="timerref-glide-value">
            <NumberInput onRegister={this.register} onValueChanged={this.updateVglide} dataSubject={this.vSpeedSubjects.vg} minValue={0} maxValue={999} increment={1} wrap={false} class='timerref-ref-number' />
            <span class="size14">KT<span class="timerref-asterisk">{this.glideRefChanged}</span></span>
          </div>
          <ArrowToggle class="timerref-glide-toggle" onRegister={this.register} onOptionSelected={this.onGlideRefOptionSelected} options={this.onOffToggleOptions} dataref={this.glideRef} />
          <div class="timerref-vr-title">Vr</div>
          <div class="timerref-vr-value">
            <NumberInput onRegister={this.register} onValueChanged={this.updateVr} dataSubject={this.vSpeedSubjects.vr} minValue={0} maxValue={999} increment={1} wrap={false} class='timerref-ref-number' />
            <span class="size14">KT<span class="timerref-asterisk">{this.vrRefChanged}</span></span>
          </div>
          <ArrowToggle class="timerref-vr-toggle" onRegister={this.register} onOptionSelected={this.onVrRefOptionSelected} options={this.onOffToggleOptions} dataref={this.vrRef} />
          <div class="timerref-vx-title">Vx</div>
          <div class="timerref-vx-value">
            <NumberInput onRegister={this.register} onValueChanged={this.updateVx} dataSubject={this.vSpeedSubjects.vx} minValue={0} maxValue={999} increment={1} wrap={false} class='timerref-ref-number' />
            <span class="size14">KT<span class="timerref-asterisk">{this.vxRefChanged}</span></span>
          </div>
          <ArrowToggle class="timerref-vx-toggle" onRegister={this.register} onOptionSelected={this.onVxRefOptionSelected} options={this.onOffToggleOptions} dataref={this.vxRef} />
          <div class="timerref-vy-title">Vy</div>
          <div class="timerref-vy-value">
            <NumberInput onRegister={this.register} onValueChanged={this.updateVy} dataSubject={this.vSpeedSubjects.vy} minValue={0} maxValue={999} increment={1} wrap={false} class='timerref-ref-number' />
            <span class="size14">KT<span class="timerref-asterisk">{this.vyRefChanged}</span></span>
          </div>
          <ArrowToggle class="timerref-vy-toggle" onRegister={this.register} onOptionSelected={this.onVyRefOptionSelected} options={this.onOffToggleOptions} dataref={this.vyRef} />
          <hr class="timerref-hr2" />
          <div class="timerref-mins-title">MINS</div>
          <ArrowToggle class="timerref-mins-toggle" onRegister={this.register} onOptionSelected={this.onMinimumsRefOptionSelected} options={this.minsToggleOptions} dataref={this.minsRef} />
          <div class="timerref-mins-value">
            <NumberInput onRegister={this.register} quantize={true} onValueChanged={this.updateMinimumsValue} dataSubject={this.minimumsSubject} minValue={0} maxValue={16000} increment={10} wrap={false} defaultDisplayValue={'_ _ _ _ _'} class='timerref-ref-number' />
            <span class="size12">{this.minimumsUnit}</span>
          </div>
          <div class="timerref-temp-comp-container">
            <div class="temp-comp-title">Temp At</div>
            <div class="temp-comp-dest">_ _ _ _ _ _</div>
            <div class="temp-comp-temp">_ _ _°<span class="size12">C</span></div>
            <div class="temp-comp-corrected-alt">_ _ _ _ _ _<span class="size12">FT</span></div>
            <div class="temp-comp-snowflake">
              <svg>
                <path d='M 0 0 l 10 0 l 0 10 l -10 0 z' fill="white" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
