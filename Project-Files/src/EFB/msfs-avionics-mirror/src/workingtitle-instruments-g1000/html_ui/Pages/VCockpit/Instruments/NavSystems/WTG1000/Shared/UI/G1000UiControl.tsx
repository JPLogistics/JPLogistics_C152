import { FSComponent, VNode } from 'msfssdk/components/FSComponent';
import { HardwareControlListProps, HardwareUiControl, HardwareUiControlList, HardwareUiControlProps, UiControlEventHandler, UiControlEventHandlers, UiControlPropEventHandlers } from 'msfssdk/components/controls';
import { FmsHEvent } from './FmsHEvent';
import { ScrollBar } from './ScrollBar';

import './G1000UiControlList.css';

/**
 * HardwareUiControl events for Fms interaction H events.
 */
export type FmsUiControlEvents = Record<FmsHEvent, UiControlEventHandler<G1000UiControl>>

/** Properties on the G1000UiControl component. */
export interface G1000UiControlProps extends UiControlPropEventHandlers<FmsUiControlEvents>, HardwareUiControlProps {
}

/**
 * A component that forms the base of the G1000 UI control system.
 */
export class G1000UiControl<P extends G1000UiControlProps = G1000UiControlProps>
  extends HardwareUiControl<FmsUiControlEvents, P>
  implements UiControlEventHandlers<FmsUiControlEvents> {

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_INC:
        if (this.props.innerKnobScroll) {
          return this.scroll('forward');
        }
        break;
      case FmsHEvent.UPPER_DEC:
        if (this.props.innerKnobScroll) {
          return this.scroll('backward');
        }
        break;
      case FmsHEvent.LOWER_INC:
        return this.scroll('forward');
      case FmsHEvent.LOWER_DEC:
        return this.scroll('backward');
    }

    return this.triggerEvent(evt, this);
  }

  /**
   * Handles FMS upper knob increase events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onUpperKnobInc(source: G1000UiControl): boolean {
    return this.props.onUpperKnobInc ? this.props.onUpperKnobInc(source) : false;
  }

  /**
   * Handles FMS upper knob decrease events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onUpperKnobDec(source: G1000UiControl): boolean {
    return this.props.onUpperKnobDec ? this.props.onUpperKnobDec(source) : false;
  }

  /**
   * Handles FMS lower knob increase events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onLowerKnobInc(source: G1000UiControl): boolean {
    return this.props.onLowerKnobInc ? this.props.onLowerKnobInc(source) : false;
  }

  /**
   * Handles FMS lower knob decrease events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onLowerKnobDec(source: G1000UiControl): boolean {
    return this.props.onLowerKnobDec ? this.props.onLowerKnobDec(source) : false;
  }

  /**
   * Handles FMS upper knob push events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onUpperKnobPush(source: G1000UiControl): boolean {
    return this.props.onUpperKnobPush ? this.props.onUpperKnobPush(source) : false;
  }

  /**
   * Handles MENU button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onMenu(source: G1000UiControl): boolean {
    return this.props.onMenu ? this.props.onMenu(source) : false;
  }

  /**
   * Handles ENTER button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onEnter(source: G1000UiControl): boolean {
    return this.props.onEnter ? this.props.onEnter(source) : false;
  }

  /**
   * Handles CLR button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onClr(source: G1000UiControl): boolean {
    return this.props.onClr ? this.props.onClr(source) : false;
  }

  /**
   * Handles CLR button long press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onClrLong(source: G1000UiControl): boolean {
    return this.props.onClrLong ? this.props.onClrLong(source) : false;
  }

  /**
   * Handles DRCT button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onDirectTo(source: G1000UiControl): boolean {
    return this.props.onDirectTo ? this.props.onDirectTo(source) : false;
  }

  /**
   * Handles FPL button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onFPL(source: G1000UiControl): boolean {
    return this.props.onFPL ? this.props.onFPL(source) : false;
  }

  /**
   * Handles PROC button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onProc(source: G1000UiControl): boolean {
    return this.props.onProc ? this.props.onProc(source) : false;
  }

  /**
   * Handles range joystick increase events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onRangeInc(source: G1000UiControl): boolean {
    return this.props.onRangeInc ? this.props.onRangeInc(source) : false;
  }

  /**
   * Handles range joystick decrease events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onRangeDec(source: G1000UiControl): boolean {
    return this.props.onRangeDec ? this.props.onRangeDec(source) : false;
  }

  /**
   * Handles range joystick push events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onJoystickPush(source: G1000UiControl): boolean {
    return this.props.onJoystickPush ? this.props.onJoystickPush(source) : false;
  }

  /**
   * Handles range joystick left deflection events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onJoystickLeft(source: G1000UiControl): boolean {
    return this.props.onJoystickLeft ? this.props.onJoystickLeft(source) : false;
  }

  /**
   * Handles range joystick up deflection events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onJoystickUp(source: G1000UiControl): boolean {
    return this.props.onJoystickUp ? this.props.onJoystickUp(source) : false;
  }

  /**
   * Handles range joystick right deflection events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onJoystickRight(source: G1000UiControl): boolean {
    return this.props.onJoystickRight ? this.props.onJoystickRight(source) : false;
  }

  /**
   * Handles range joystick down deflection events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onJoystickDown(source: G1000UiControl): boolean {
    return this.props.onJoystickDown ? this.props.onJoystickDown(source) : false;
  }
}

/** Properties on the GarminControlList component. */
export interface GarminControlListProps<T> extends UiControlPropEventHandlers<FmsUiControlEvents>, HardwareUiControlProps, HardwareControlListProps<T> {
}

/**
 * A component that holds lists of G1000UiControls.
 */
export class G1000ControlList<T>
  extends HardwareUiControlList<T, FmsUiControlEvents, GarminControlListProps<T>>
  implements UiControlEventHandlers<FmsUiControlEvents> {

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_INC:
        if (this.props.innerKnobScroll) {
          return this.scroll('forward');
        }
        break;
      case FmsHEvent.UPPER_DEC:
        if (this.props.innerKnobScroll) {
          return this.scroll('backward');
        }
        break;
      case FmsHEvent.LOWER_INC:
        return this.scroll('forward');
      case FmsHEvent.LOWER_DEC:
        return this.scroll('backward');
    }

    return this.triggerEvent(evt, this);
  }

  /**
   * Handles FMS upper knob increase events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onUpperKnobInc(source: G1000UiControl): boolean {
    return this.props.onUpperKnobInc ? this.props.onUpperKnobInc(source) : false;
  }

  /**
   * Handles FMS upper knob decrease events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onUpperKnobDec(source: G1000UiControl): boolean {
    return this.props.onUpperKnobDec ? this.props.onUpperKnobDec(source) : false;
  }

  /**
   * Handles FMS lower knob increase events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onLowerKnobInc(source: G1000UiControl): boolean {
    return this.props.onLowerKnobInc ? this.props.onLowerKnobInc(source) : false;
  }

  /**
   * Handles FMS lower knob decrease events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onLowerKnobDec(source: G1000UiControl): boolean {
    return this.props.onLowerKnobDec ? this.props.onLowerKnobDec(source) : false;
  }

  /**
   * Handles FMS upper knob push events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onUpperKnobPush(source: G1000UiControl): boolean {
    return this.props.onUpperKnobPush ? this.props.onUpperKnobPush(source) : false;
  }

  /**
   * Handles MENU button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onMenu(source: G1000UiControl): boolean {
    return this.props.onMenu ? this.props.onMenu(source) : false;
  }

  /**
   * Handles ENTER button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onEnter(source: G1000UiControl): boolean {
    return this.props.onEnter ? this.props.onEnter(source) : false;
  }

  /**
   * Handles CLR button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onClr(source: G1000UiControl): boolean {
    return this.props.onClr ? this.props.onClr(source) : false;
  }

  /**
   * Handles CLR button long press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onClrLong(source: G1000UiControl): boolean {
    return this.props.onClrLong ? this.props.onClrLong(source) : false;
  }

  /**
   * Handles DRCT button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onDirectTo(source: G1000UiControl): boolean {
    return this.props.onDirectTo ? this.props.onDirectTo(source) : false;
  }

  /**
   * Handles FPL button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onFPL(source: G1000UiControl): boolean {
    return this.props.onFPL ? this.props.onFPL(source) : false;
  }

  /**
   * Handles PROC button press events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onProc(source: G1000UiControl): boolean {
    return this.props.onProc ? this.props.onProc(source) : false;
  }

  /**
   * Handles range joystick increase events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onRangeInc(source: G1000UiControl): boolean {
    return this.props.onRangeInc ? this.props.onRangeInc(source) : false;
  }

  /**
   * Handles range joystick decrease events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onRangeDec(source: G1000UiControl): boolean {
    return this.props.onRangeDec ? this.props.onRangeDec(source) : false;
  }

  /**
   * Handles range joystick push events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onJoystickPush(source: G1000UiControl): boolean {
    return this.props.onJoystickPush ? this.props.onJoystickPush(source) : false;
  }

  /**
   * Handles range joystick left deflection events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onJoystickLeft(source: G1000UiControl): boolean {
    return this.props.onJoystickLeft ? this.props.onJoystickLeft(source) : false;
  }

  /**
   * Handles range joystick up deflection events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onJoystickUp(source: G1000UiControl): boolean {
    return this.props.onJoystickUp ? this.props.onJoystickUp(source) : false;
  }

  /**
   * Handles range joystick right deflection events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onJoystickRight(source: G1000UiControl): boolean {
    return this.props.onJoystickRight ? this.props.onJoystickRight(source) : false;
  }

  /**
   * Handles range joystick down deflection events.
   * @param source The source of the event.
   * @returns Whether the event was handled.
   */
  public onJoystickDown(source: G1000UiControl): boolean {
    return this.props.onJoystickDown ? this.props.onJoystickDown(source) : false;
  }

  /** @inheritdoc */
  protected renderScrollbar(): VNode {
    return (<ScrollBar />);
  }
}