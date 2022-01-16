import { FSComponent, NumberUnitSubject, UnitFamily, VNode } from 'msfssdk';
import { ActionButton } from '../../../../Shared/UI/UIControls/ActionButton';
import { ArrowToggle } from '../../../../Shared/UI/UIControls/ArrowToggle';
import { NumberInput } from '../../../../Shared/UI/UIControls/NumberInput';
import { TimeDistanceInput } from '../../../../Shared/UI/UIControls/TimeDistanceInput';
import { Hold } from '../../../../Shared/UI/Hold/Hold';

import './PFDHold.css';

/**
 * A class that displays the PFD hold dialog.
 */
export class PFDHold extends Hold {

  /**
   * Renders the PFD hold dialog.
   * @returns The rendered VNode.
   */
  public render(): VNode {
    const legName = this.createLegNameSubscribable();
    const directionString = this.createDirectionStringSubscribable();

    return (
      <div class='popout-dialog pfd-hold' ref={this.viewContainerRef}>
        <h1>Hold at</h1>
        <div class='pfd-hold-grid'>
          <div class='pfd-hold-row'>
            <div>Hold <span>{directionString}</span> of</div>
            <div>{legName}</div>
          </div>
          <div class='pfd-hold-row pfd-hold-linerow'>
            <div>Course <NumberInput class='pfd-hold-course' minValue={1} maxValue={360} wrap
              dataSubject={this.store.course} increment={1} onRegister={this.register} formatter={(v): string => `${v.toFixed(0).padStart(3, '0')}°`} /></div>
            <div><ArrowToggle class='pfd-hold-inbound' options={['Inbound', 'Outbound']} dataref={this.store.isInbound} onRegister={this.register} /></div>
          </div>
          <div class='pfd-hold-row pfd-hold-linerow'>
            <div>Leg <ArrowToggle class='pfd-hold-time' options={['Time', 'Distance']} dataref={this.store.isTime} onRegister={this.register} /></div>
            <div>
              <TimeDistanceInput
                ref={this.distanceInput}
                class='pfd-hold-distance'
                timeSubject={this.store.time as unknown as NumberUnitSubject<UnitFamily.Duration>}
                distanceSubject={this.store.distance as unknown as NumberUnitSubject<UnitFamily.Distance>} onRegister={this.register}
              />
            </div>
          </div>
          <div class='pfd-hold-row pfd-hold-linerow'>
            <div>Turns</div>
            <div><ArrowToggle class='pfd-hold-direction' options={['Left', 'Right']}
              dataref={this.store.turnDirection}
              onRegister={this.register} />
            </div>
          </div>
        </div>
        <ActionButton class='pfd-hold-load' text='Load?' onExecute={(): void => { this.controller.accept(); this.close(); }} onRegister={this.register} />
      </div>
    );
  }
}