import { FSComponent, DisplayComponent, VNode, ComputedSubject } from 'msfssdk';
import { ControlPublisher, EventBus } from 'msfssdk/data';
import { XPDRSimVars, XPDRMode } from 'msfssdk/instruments';
import { G1000ControlEvents } from '../../../Shared/G1000Events';

import './Transponder.css';

/**
 * The properties on the Attitude component.
 */
interface TransponderProps {

  /** An instance of the event bus. */
  bus: EventBus;

  /** An instance of the control publisher. */
  controlPublisher: ControlPublisher;
}

/**
 * The PFD attitude indicator.
 */
export class Transponder extends DisplayComponent<TransponderProps> {

  private xpdrCodeElement = FSComponent.createRef<HTMLElement>();
  private xpdrModeElement = FSComponent.createRef<HTMLElement>();
  private xpdrIdentElement = FSComponent.createRef<HTMLElement>();
  private codeEdit = {
    editMode: false,
    charIndex: 0,
    tempCode: ''
  }
  private readonly xpdrCodeSubject = ComputedSubject.create(0, (v): string => {
    return `${Math.round(v)}`.padStart(4, '0');
  });
  private readonly xpdrModeSubject = ComputedSubject.create(XPDRMode.OFF, (v): string => {
    switch (v) {
      case XPDRMode.OFF:
        return 'OFF';
      case XPDRMode.STBY:
        return 'STBY';
      case XPDRMode.ON:
        return 'ON';
      case XPDRMode.ALT:
        return 'ALT';
      case XPDRMode.GROUND:
        return 'GND';
    }

    return 'XXX';
  });

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    const xpdr = this.props.bus.getSubscriber<XPDRSimVars>();
    xpdr.on('xpdrCode1')
      .whenChanged().handle(this.onXpdrCodeSimUpdate.bind(this));
    xpdr.on('xpdrMode1')
      .whenChanged().handle(this.onXpdrModeUpdate.bind(this));
    xpdr.on('xpdrIdent').whenChanged().handle((isSending: boolean) => {
      this.xpdrIdentElement.instance.classList.toggle('hide-element', !isSending);
      this.xpdrModeElement.instance.classList.toggle('hide-element', isSending);
    });

    const g1000ControlEvents = this.props.bus.getSubscriber<G1000ControlEvents>();
    g1000ControlEvents.on('xpdr_code_push')
      .handle(this.updateCodeEdit.bind(this));
    g1000ControlEvents.on('xpdr_code_digit')
      .handle(this.editCode.bind(this));
  }

  /**
   * A method called when the soft menu sends a G1000 Control Event to edit the xpdr code.
   * @param edit is a bool of whether to edit the code or stop editing the code.
   */
  private updateCodeEdit(edit: boolean): void {
    if (edit && this.xpdrCodeElement.instance !== null) {
      this.codeEdit.editMode = true;
      this.codeEdit.tempCode = '   ';
      if (this.xpdrModeSubject.getRaw() === XPDRMode.STBY || this.xpdrModeSubject.getRaw() === XPDRMode.OFF) {
        this.xpdrCodeElement.instance.classList.add('highlight-white');
      } else {
        this.xpdrCodeElement.instance.classList.remove('green', 'white', 'grey');
        this.xpdrCodeElement.instance.classList.add('highlight-green');
      }
    } else if (!edit && this.xpdrCodeElement.instance !== null) {
      this.codeEdit.editMode = false;
      this.codeEdit.tempCode = '';
      this.xpdrCodeElement.instance.classList.remove('highlight-green');
      this.xpdrCodeElement.instance.classList.remove('highlight-white');
      this.onXpdrModeUpdate(this.xpdrModeSubject.getRaw());
    }
  }

  /**
   * A method called when the soft menu sends a digit from the xpdr code menu via the g1000 event bus.
   * @param value is the digit sent (0-7; -1 is a backspace).
   */
  private editCode(value: number): void {
    let updatedTempCode = this.codeEdit.tempCode;
    if (value == -1 && this.codeEdit.charIndex > 0) {
      updatedTempCode = updatedTempCode.substring(0, this.codeEdit.charIndex);
      this.codeEdit.charIndex--;
    } else if (value >= 0) {
      updatedTempCode = updatedTempCode + `${value}`;
      this.codeEdit.charIndex++;
    }

    this.codeEdit.tempCode = updatedTempCode;
    this.onXpdrCodeUpdate(parseInt(this.codeEdit.tempCode));

    if (this.codeEdit.charIndex == 4) {
      this.props.controlPublisher.publishEvent('publish_xpdr_code', parseInt(updatedTempCode));
      this.codeEdit.charIndex = 0;
      this.updateCodeEdit(false);
    }
  }

  /**
   * A method called when the navcom publisher sends a new xpdr code.
   * @param code is the new xpdr code
   */
  private onXpdrCodeSimUpdate(code: number): void {
    this.onXpdrCodeUpdate(code);
  }

  /**
   * A method called to update the displayed xpdr code.
   * @param code is the new xpdr code
   */
  private onXpdrCodeUpdate(code: number): void {
    this.xpdrCodeSubject.set(code);
  }

  /**
   * A method called when the navcom publisher sends a new xpdr code.
   * @param mode is the new xpdr code
   */
  private onXpdrModeUpdate(mode: XPDRMode): void {
    if (this.xpdrModeElement.instance !== null && this.xpdrCodeElement.instance !== null) {
      this.xpdrModeSubject.set(mode);
      this.xpdrModeElement.instance.classList.remove('green', 'white', 'grey');
      this.xpdrCodeElement.instance.classList.remove('green', 'white', 'grey');
      switch (mode) {
        case XPDRMode.OFF:
          this.xpdrModeElement.instance.classList.add('grey');
          this.xpdrCodeElement.instance.classList.add('grey');
          break;
        case XPDRMode.STBY:
          this.xpdrModeElement.instance.classList.add('white');
          this.xpdrCodeElement.instance.classList.add('white');
          break;
        case XPDRMode.ON:
        case XPDRMode.ALT:
        case XPDRMode.GROUND:
          this.xpdrModeElement.instance.classList.add('green');
          this.xpdrCodeElement.instance.classList.add('green');
          break;
      }
    }
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class="xpdr-container">
        <div class='small-text'>XPDR </div>
        <div ref={this.xpdrCodeElement} class='size20'>{this.xpdrCodeSubject}</div>
        <div ref={this.xpdrModeElement} class='size20'>&nbsp;{this.xpdrModeSubject}</div><div ref={this.xpdrIdentElement} class='size20 green hide-element'> Ident</div>
      </div>
    );
  }
}
