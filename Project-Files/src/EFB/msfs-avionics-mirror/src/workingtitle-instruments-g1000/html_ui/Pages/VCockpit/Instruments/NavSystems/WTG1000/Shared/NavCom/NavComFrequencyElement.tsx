/* eslint-disable max-len */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FSComponent, DisplayComponent, VNode, ComponentProps } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import {
    FrequencyBank, FrequencyChangeEvent, IdentChangeEvent, NavEvents,
    NavSourceId, NavSourceType, Radio, RadioEvents, RadioType
} from 'msfssdk/instruments';
import { AvionicsComputerSystemEvents } from '../Systems/AvionicsComputerSystem';
import { AvionicsSystemState, AvionicsSystemStateEvent } from '../Systems/G1000AvionicsSystem';

import './NavComFrequencyElement.css';

/** Props for the NavComFrequencyElement. */
interface NavComFrequencyElementProps extends ComponentProps {
    /** An instance of the event bus. */
    bus: EventBus;
    /** The position of the navcom frequency element. */
    position: 'left' | 'right';
    /** The type of radio that we represent */
    type: RadioType;
    /** The index number of the radio with this element */
    index: number;
}

/**
 * Representation of the active and standby frequencies of a nav or com radio.
 */
export class NavComFrequencyElement extends DisplayComponent<NavComFrequencyElementProps> {
    private containerRef = FSComponent.createRef<HTMLElement>();
    private selectorBorderElement = FSComponent.createRef<HTMLElement>();
    private selectorArrowElement = FSComponent.createRef<HTMLElement>();
    private activeFreq = FSComponent.createRef<HTMLElement>();
    private standbyFreq = FSComponent.createRef<HTMLElement>();
    private ident = FSComponent.createRef<HTMLElement>();

    private isFailed = false;

    /**
     * Set this frequency as the active selection visually.
     * @param isSelected Indicates if the frequency should show as selected or not.
     */
    setSelected(isSelected: boolean): void {
        if (this.selectorBorderElement.instance !== null && this.selectorArrowElement.instance !== null) {
            this.selectorBorderElement.instance.style.display = isSelected ? '' : 'none';
            this.selectorArrowElement.instance.style.visibility = isSelected ? 'visible' : 'hidden';
        }
    }

    /**
     * Stuff to do after rendering.
     */
    public onAfterRender(): void {
        const nav = this.props.bus.getSubscriber<RadioEvents>();
        nav.on('set_radio_state').handle(this.onUpdateState);
        nav.on('set_frequency').handle(this.onUpdateFrequency);
        nav.on('set_ident').handle(this.onUpdateIdent);
        nav.on('set_signal_strength').handle(this.onUpdateSignalStrength);
        if (this.props.position === 'left') {
            const navproc = this.props.bus.getSubscriber<NavEvents>();
            navproc.on('cdi_select').handle(this.onUpdateCdiSelect);
        }

        this.props.bus.getSubscriber<AvionicsComputerSystemEvents>()
            .on('avionicscomputer_state_1')
            .handle(this.onComputerStateChanged.bind(this));

        this.props.bus.getSubscriber<AvionicsComputerSystemEvents>()
            .on('avionicscomputer_state_2')
            .handle(this.onComputerStateChanged.bind(this));
    }

    /**
     * A callaback called when the system screen state changes.
     * @param state The state change event to handle.
     */
    private onComputerStateChanged(state: AvionicsSystemStateEvent): void {
        if (state.index === this.props.index) {
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
    }

    /**
     * Sets if the display should be failed or not.
     * @param isFailed True if failed, false otherwise.
     */
    private setFailed(isFailed: boolean): void {
        if (isFailed) {
            this.isFailed = true;
            this.containerRef.instance.classList.add('failed-instr');
        } else {
            this.isFailed = false;
            this.containerRef.instance.classList.remove('failed-instr');
        }
    }

    /**
     * Handle a radioo state update event.
     * @param radio The Radio that was updated.
     */
    private onUpdateState = (radio: Radio): void => {
        if (!(radio.radioType == this.props.type && radio.index == this.props.index)) {
            return;
        }
        if (this.activeFreq.instance !== null) {
            this.activeFreq.instance.textContent = radio.activeFrequency.toFixed(radio.radioType == RadioType.Nav ? 2 : 3);
        }

        if (this.standbyFreq.instance !== null) {
            this.standbyFreq.instance.textContent = radio.standbyFrequency.toFixed(radio.radioType == RadioType.Nav ? 2 : 3);
        }

        if (this.selectorBorderElement.instance !== null && this.selectorArrowElement.instance !== null) {
            this.selectorBorderElement.instance.style.display = radio.selected ? '' : 'none';
            this.selectorArrowElement.instance.style.visibility = radio.selected ? 'visible' : 'hidden';
        }
        if (this.ident.getOrDefault() !== null) {
            this.ident.instance.textContent = radio.ident;
        }
    };

    /**
     * Handle a frequency change event.
     * @param change The FrequencyChangeEvent to process.
     */
    private onUpdateFrequency = (change: FrequencyChangeEvent): void => {
        if (!(change.radio.radioType == this.props.type && change.radio.index == this.props.index)) {
            return;
        }
        switch (change.bank) {
            case FrequencyBank.Active:
                if (this.activeFreq.instance !== null) {
                    this.activeFreq.instance.textContent = change.frequency.toFixed(change.radio.radioType == RadioType.Nav ? 2 : 3);
                }
                break;
            case FrequencyBank.Standby:
                if (this.standbyFreq.instance !== null) {
                    this.standbyFreq.instance.textContent = change.frequency.toFixed(change.radio.radioType == RadioType.Nav ? 2 : 3);
                }
                break;
        }
    };

    /**
     * Handle an ident set event.
     * @param change The IdentChangeEvent to process.
     */
    private onUpdateIdent = (change: IdentChangeEvent): void => {
        if (change.index == this.props.index && this.ident.getOrDefault() !== null) {
            this.ident.instance.textContent = change.ident;
        }
    };

    /**
     * Handle a signal strength set event.
     * @param strength The new strength.
     */
    private onUpdateSignalStrength = (strength: number): void => {
        if (this.ident.getOrDefault() !== null) {
            if (strength == 0) {
                if (this.ident.instance.style.display !== 'none') {
                    this.ident.instance.style.display = 'none';
                }
            } else {
                if (this.ident.instance.style.display !== '') {
                    this.ident.instance.style.display = '';
                }
            }
        }
    };

    /**
     * A callback called when the CDI Source Changes.
     * @param source The current selected CDI Source.
     */
    private onUpdateCdiSelect = (source: NavSourceId): void => {
        if (source.type === NavSourceType.Nav && source.index == this.props.index) {
            this.activeFreq.instance.classList.add('navcom-green');
            this.ident.instance.classList.add('navcom-green');
        } else {
            this.activeFreq.instance.classList.remove('navcom-green');
            this.ident.instance.classList.remove('navcom-green');
        }
    };

    /**
     * Render NavCom Freq Element.
     * @returns Vnode containing the element.
     */
    render(): VNode {
        if (this.props.position === 'left') {
            return (
                <div class="navcom-frequencyelement-container" ref={this.containerRef}>
                    <div class="failed-box" />
                    <div class="navcom-frequencyelement-content">
                        <div ref={this.selectorBorderElement} id="navcomselect" class="navcom-selector left"></div>
                        <span class="navcom-freqstandby" ref={this.standbyFreq}></span>
                        <span ref={this.selectorArrowElement} class="navcom-arrows">
                            <svg width="22" height="16">
                                <path d="M 12 8 m 0 0.75 l -5 0 l 1 3.25 l 0 1 l -4.5 -5 l 4.5 -5 l 0 1 l -1 3.25 l 10 0 l -1 -3.25 l 0 -1 l 4.5 5 l -4.5 5 l 0 -1 l 1 -3.25 l -5 0 z" fill="cyan" />
                            </svg>
                        </span>
                        <span class="navcom-freqactive" ref={this.activeFreq}></span>
                        <div class="navcom-ident" ref={this.ident}></div>
                    </div>
                </div>
            );
        } else {
            return (
                <div class="navcom-frequencyelement-container" ref={this.containerRef}>
                    <div class="failed-box" />
                    <div class="navcom-frequencyelement-content">
                        <div ref={this.selectorBorderElement} id="navcomselect" class="navcom-selector right"></div>
                        <span class="navcom-freqactive" ref={this.activeFreq}></span>
                        <span ref={this.selectorArrowElement} class="navcom-arrows">
                            <svg width="25" height="16">
                                <path d="M 12 8 m 0 0.75 l -5 0 l 1 3.25 l 0 1 l -4.5 -5 l 4.5 -5 l 0 1 l -1 3.25 l 10 0 l -1 -3.25 l 0 -1 l 4.5 5 l -4.5 5 l 0 -1 l 1 -3.25 l -5 0 z" fill="cyan" />
                            </svg>
                        </span>
                        <span class="navcom-freqstandby" ref={this.standbyFreq}></span>
                    </div>
                </div>
            );
        }
    }
}
