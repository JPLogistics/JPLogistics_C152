/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/utils/XMLLogic" />
/** The kind of data to return. */
export var CompositeLogicXMLValueType;
(function (CompositeLogicXMLValueType) {
    CompositeLogicXMLValueType[CompositeLogicXMLValueType["Any"] = 0] = "Any";
    CompositeLogicXMLValueType[CompositeLogicXMLValueType["Number"] = 1] = "Number";
    CompositeLogicXMLValueType[CompositeLogicXMLValueType["String"] = 2] = "String";
})(CompositeLogicXMLValueType || (CompositeLogicXMLValueType = {}));
/**
 *
 */
export class CompositeLogicXMLHost {
    constructor() {
        this.anyHandlers = new Array();
        this.stringHandlers = new Array();
        this.numberHandlers = new Array();
        this.anyResultCache = new Array();
        this.stringResultCache = new Array();
        this.numberResultCache = new Array();
        this.context = new LogicXMLContext();
        this.isPaused = false;
    }
    /**
     * Set to pause the logic update loop.
     * @param isPaused True to pause, false to resume.
     */
    setIsPaused(isPaused) {
        this.isPaused = isPaused;
    }
    /**
     * Add a new logic element to calcluate a number or a string.
     * @param logic A CompositeLogicXMLElement.
     * @param handler A callback hander to take new values of either type.
     * @returns The current value of the logic.
     */
    addLogic(logic, handler) {
        this.anyHandlers.push({ logic: logic, handler: handler });
        return logic.getValue(this.context);
    }
    /**
     * Add a new logic element to calcluate a number.
     * @param logic A CompositeLogicXMLElement.
     * @param handler A callback hander to take new values as numbers.
     * @param precision An optional precision to require for updates to be sent.
     * @param smoothFactor An optional linear smoothing factor to apply to the value when updating.
     * @returns The current value of the logic.
     */
    addLogicAsNumber(logic, handler, precision, smoothFactor) {
        this.numberHandlers.push({ logic: logic, handler: handler, precision: precision, smoothFactor: smoothFactor });
        return logic.getValueAsNumber(this.context);
    }
    /**
     * Add a new logic element to calcluate a string.
     * @param logic A CompositeLogicXMLElement.
     * @param handler A callback hander to take new values as strings.
     * @returns The current value of the logic.
     */
    addLogicAsString(logic, handler) {
        this.stringHandlers.push({ logic: logic, handler: handler });
        return logic.getValueAsString(this.context);
    }
    /**
     * Add a function to the logic context.
     * @param funcSpec The XMLFunction configuration.
     * @returns The function's current value.
     */
    addFunction(funcSpec) {
        const func = new LogicXMLFunction();
        func.name = funcSpec.name;
        func.callback = funcSpec.logic;
        this.context.addFunction(func);
        return funcSpec.logic.getValue(this.context);
    }
    /**
     * Update every logic element and publish updates.
     * @param deltaTime The time since the last update, in ms.
     */
    update(deltaTime) {
        if (!this.isPaused) {
            for (let i = 0; i < this.anyHandlers.length; i++) {
                const newVal = this.anyHandlers[i].logic.getValue(this.context);
                if (newVal !== this.anyResultCache[i]) {
                    this.anyResultCache[i] = newVal;
                    this.anyHandlers[i].handler(newVal);
                }
            }
            for (let i = 0; i < this.stringHandlers.length; i++) {
                const newVal = this.stringHandlers[i].logic.getValueAsString(this.context);
                if (newVal !== this.stringResultCache[i]) {
                    this.stringResultCache[i] = newVal;
                    this.stringHandlers[i].handler(newVal);
                }
            }
            for (let i = 0; i < this.numberHandlers.length; i++) {
                let newVal = this.numberHandlers[i].logic.getValueAsNumber(this.context);
                let precision = this.numberHandlers[i].precision;
                if (precision !== undefined) {
                    precision = Math.pow(10, precision);
                    newVal = Math.round(newVal * precision) / precision;
                }
                if (this.numberHandlers[i].smoothFactor !== undefined && this.numberHandlers[i].smoothFactor !== 0) {
                    // A smoothFactor of 0 means no smoothing.  We don't trigger this update if the factor is
                    // undefined or 0, but typescript still thinks is could be undefined due to the array indexing.
                    // The 'or-0' here is just to get around that without having to do a temporary assignment.
                    newVal = Utils.SmoothLinear(this.numberResultCache[i], newVal, this.numberHandlers[i].smoothFactor || 0, deltaTime);
                }
                if (newVal !== this.numberResultCache[i]) {
                    this.numberResultCache[i] = newVal;
                    this.numberHandlers[i].handler(newVal);
                }
            }
            this.context.update();
        }
    }
}
