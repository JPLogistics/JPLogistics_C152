/// <reference types="msfstypes/JS/simvar" />

import { EventBus, EventSubscriber, SimVarDefinition, SimVarValueType } from 'msfssdk/data';
import { SimVarPublisher } from 'msfssdk/instruments';
import { G1000ControlEvents } from './G1000Events';

/** Simvars to publish. */
export enum FuelComputerSimVars {
  Remaining = 'L:WT1000_Fuel_GalRemaining',
  Burned = 'L:WT1000_Fuel_GalBurned',
  Endurance = 'L:WT1000_Fuel_Endurance',
  Range = 'L:WT1000_Fuel_Range'
}

/** Fuel remaining adjustment parameters. */
export type FuelRemaingAdjustment = {
  /** The direction in which to make the adjustment. */
  direction: 'add' | 'remove' | 'set',
  /** The amount to adjust by. */
  amount: number
}

/** Simvars for the fuel computer to monitor. */
interface FuelSimVars {
  /** The amount of fuel remaining. */
  fuelQty: number;
  /** The flow on engine 1. */
  fuelFlow1: number;
  /** The flow on engine 2. */
  fuelFlow2: number;
}

/** A publisher to poll fuel-related simvars. */
class FuelSimVarPublisher extends SimVarPublisher<FuelSimVars> {
  private static simvars = new Map<keyof FuelSimVars, SimVarDefinition>([
    ['fuelQty', { name: 'FUEL TOTAL QUANTITY', type: SimVarValueType.GAL }],
    ['fuelFlow1', { name: 'ENG FUEL FLOW GPH:1', type: SimVarValueType.GPH }],
    ['fuelFlow2', { name: 'ENG FUEL FLOW GPH:2', type: SimVarValueType.GPH }],
  ]);

  /**
   * Create a FuelSimVarPublisher
   * @param bus The EventBus to publish to
   */
  public constructor(bus: EventBus) {
    super(FuelSimVarPublisher.simvars, bus);
  }
}

/** A simple fuel totalizer and related logic. */
class Totalizer {
  private _fuelCapacity = 0;
  private _fuelRemaining = 0;
  private _fuelBurned = 0;
  private _rawQty = 0;
  private _priorRawQty = 0;

  /**
   * Set the total fuel capacity, but only once.
   * @param capacity The total capacity.
   */
  public setCapacity(capacity: number): void {
    if (this._fuelCapacity == 0) {
      this._fuelCapacity = capacity;
    }
  }

  /**
   * Set the amount of fuel remaining.
   * @param value The amount of fuel remaining.
   */
  public set fuelRemaining(value: number) {
    this._fuelRemaining = value;
    SimVar.SetSimVarValue(FuelComputerSimVars.Remaining, 'gallons', value);
  }

  /**
   * Get the amount of fuel remaining.
   * @returns The amount of fuel remaining.
   */
  public get fuelRemaining(): number {
    return this._fuelRemaining;
  }

  /**
   * Set the amount of fuel burned.
   * @param value The amount of fuel burned.
   */
  public set fuelBurned(value: number) {
    this._fuelBurned = value;
    SimVar.SetSimVarValue(FuelComputerSimVars.Burned, 'gallons', value);
  }

  /**
   * Get the amount of fuel burned.
   * @returns The amount of fuel burned.
   */
  public get fuelBurned(): number {
    return this._fuelBurned;
  }

  /**
   * Set the raw quantity present.
   * @param value The quantity present.
   */
  public set rawQty(value: number) {
    if (value < this._priorRawQty) {
      // We would normally expect the raw quantity to decrease.   If it does,
      // assume we're seeing standard fuel burn and update our totals.  If it
      // goes _up_, we'll treat it as a refuel and not add any burn total and
      // it's up to the user to increase the fuel remaining, just like in
      // real life!
      const burned = this._priorRawQty - value;
      this.fuelBurned += burned;
      this.fuelRemaining -= burned;
    }
    this._priorRawQty = value;
  }

  /**
   * Get the current raw quantity.
   * @returns The current raw quantity.
   */
  public get rawQty(): number {
    return this._rawQty;
  }

  /**
   * Handle an adjustment to the fuel remaining value.
   * @param adjustment The adjustment to make.
   */
  public adjust(adjustment: FuelRemaingAdjustment): void {
    switch (adjustment.direction) {
      case 'add':
        this.fuelRemaining += adjustment.amount;
        break;
      case 'remove':
        this.fuelRemaining -= adjustment.amount;
        break;
      case 'set':
        this.fuelRemaining = adjustment.amount;
        break;
    }
    // Always reset the burn total when there's an adjustment.
    this.fuelBurned = 0;
  }

  /**
   * Reset the fuel totalizer.
   * @param flag If true, reset.   (We need to have real noop events.)
   */
  public reset(flag: boolean): void {
    if (flag) {
      this.fuelRemaining = this._fuelCapacity;
      this.fuelBurned = 0;
    }
  }
}

/**
 * An instrument that tracks fuel state for use by the G1000 systems page.
 */
export class FuelComputer {
  private simVarPublisher: FuelSimVarPublisher;
  private simVarSubscriber: EventSubscriber<FuelSimVars>;
  private controlSubscriber: EventSubscriber<G1000ControlEvents>;
  private totalizer: Totalizer;

  /**
   * Create a fuel computer.
   * @param bus An event bus
   */
  constructor(bus: EventBus) {
    this.simVarPublisher = new FuelSimVarPublisher(bus);
    this.simVarSubscriber = bus.getSubscriber<FuelSimVars>();
    this.controlSubscriber = bus.getSubscriber<G1000ControlEvents>();
    this.totalizer = new Totalizer();
  }

  /** Intialize the instrument. */
  public init(): void {
    this.simVarPublisher.startPublish();
    this.totalizer.setCapacity(SimVar.GetSimVarValue('FUEL TOTAL CAPACITY', 'gallons') - SimVar.GetSimVarValue('UNUSABLE FUEL TOTAL QUANTITY', 'gallons'));
    this.totalizer.fuelRemaining = SimVar.GetSimVarValue('FUEL TOTAL QUANTITY', 'gallons');
    this.simVarSubscriber.on('fuelQty').whenChangedBy(0.1).handle((qty) => { this.totalizer.rawQty = qty; });
    this.controlSubscriber.on('fuel_adjustment').handle((adjustment) => { this.totalizer.adjust(adjustment); });
    this.controlSubscriber.on('fuel_comp_reset').handle((flag) => { this.totalizer.reset(flag); });
  }

  /**
   * Perform events for the update loop.
   */
  public onUpdate(): void {
    this.simVarPublisher.onUpdate();
  }
}