/// <reference types="msfstypes/pages/vcockpit/instruments/shared/utils/xmllogic" />
import { XMLFunction } from '../components/XMLGauges';
/** A type that pairs a logic element with its callback handler. */
export declare type LogicHandler<T> = {
    /** A logic element instance to evaluate. */
    logic: CompositeLogicXMLElement;
    /** A handler to call back to when there's a value change. */
    handler: (data: T) => void;
    /** A precision to use for numeric values. */
    precision?: number;
    /** A linear smoothing factor for value changes. */
    smoothFactor?: number;
};
/** The kind of data to return. */
export declare enum CompositeLogicXMLValueType {
    Any = 0,
    Number = 1,
    String = 2
}
/**
 *
 */
export declare class CompositeLogicXMLHost {
    private anyHandlers;
    private stringHandlers;
    private numberHandlers;
    private anyResultCache;
    private stringResultCache;
    private numberResultCache;
    private context;
    private isPaused;
    /**
     * Set to pause the logic update loop.
     * @param isPaused True to pause, false to resume.
     */
    setIsPaused(isPaused: boolean): void;
    /**
     * Add a new logic element to calcluate a number or a string.
     * @param logic A CompositeLogicXMLElement.
     * @param handler A callback hander to take new values of either type.
     * @returns The current value of the logic.
     */
    addLogic(logic: CompositeLogicXMLElement, handler: (data: string | number) => void): number | string;
    /**
     * Add a new logic element to calcluate a number.
     * @param logic A CompositeLogicXMLElement.
     * @param handler A callback hander to take new values as numbers.
     * @param precision An optional precision to require for updates to be sent.
     * @param smoothFactor An optional linear smoothing factor to apply to the value when updating.
     * @returns The current value of the logic.
     */
    addLogicAsNumber(logic: CompositeLogicXMLElement, handler: (data: number) => void, precision: number, smoothFactor?: number): number;
    /**
     * Add a new logic element to calcluate a string.
     * @param logic A CompositeLogicXMLElement.
     * @param handler A callback hander to take new values as strings.
     * @returns The current value of the logic.
     */
    addLogicAsString(logic: CompositeLogicXMLElement, handler: (data: string) => void): string;
    /**
     * Add a function to the logic context.
     * @param funcSpec The XMLFunction configuration.
     * @returns The function's current value.
     */
    addFunction(funcSpec: XMLFunction): number | string;
    /**
     * Update every logic element and publish updates.
     * @param deltaTime The time since the last update, in ms.
     */
    update(deltaTime: number): void;
}
//# sourceMappingURL=CompositeLogicXMLHost.d.ts.map