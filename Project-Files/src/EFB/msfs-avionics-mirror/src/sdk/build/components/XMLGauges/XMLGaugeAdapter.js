/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/utils/XMLLogic" />
/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/BaseInstrument" />
import * as d from './GaugeDefinitions';
/**
 * The type of gauges available, as defined in XMLEngineDisplay.js.
 */
export var XMLGaugeType;
(function (XMLGaugeType) {
    XMLGaugeType["Circular"] = "Circular";
    XMLGaugeType["Horizontal"] = "Horizontal";
    XMLGaugeType["DoubleHorizontal"] = "DoubleHorizontal";
    XMLGaugeType["Vertical"] = "Vertical";
    XMLGaugeType["DoubleVertical"] = "DoubleVertical";
    XMLGaugeType["Text"] = "Text";
    XMLGaugeType["ColumnGroup"] = "ColumnGroup";
    XMLGaugeType["Column"] = "Column";
    XMLGaugeType["Cylinder"] = "Cylinder";
    XMLGaugeType["TwinCylinder"] = "TwinCylinder";
})(XMLGaugeType || (XMLGaugeType = {}));
/**
 * Parse an XMLEngineDisplay configuration into an array of gauge specs.
 */
export class XMLGaugeConfigFactory {
    /**
     * Create an XMLGaugeConfigFactory.
     * @param instrument The instrument that holds this engine display.
     * @param bus An event bus for gauges that need it.
     */
    constructor(instrument, bus) {
        this.instrument = instrument;
        this.bus = bus;
    }
    /**
     * Convenience method to take a full XML instrument config and parse out the display config
     * section. This will check first to see if we are using an enhanced, multi-page config by
     * looking for an EnginePage tag in the EngineDisplay element.   If it finds it, it will
     * assume we have an advanced config, and return the content along with that of LeanPage
     * and SystemPag, if present.  If no EnginePage exists, we assume we're dealing with a
     * legacy configuration and just return the content of EngineDisplay itself as our engine
     * page with everything else undefined.
     * @param document The XML configuation document.
     * @returns An XMLEnhancedGaugeConfig with the full gauge configuration.
     */
    parseConfig(document) {
        var _a;
        const gaugeSpecs = new Array();
        const functions = new Map();
        const displayConfig = document.getElementsByTagName('EngineDisplay');
        if (displayConfig.length == 0) {
            return { override: false, functions: functions, enginePage: gaugeSpecs };
        }
        else {
            for (const func of document.getElementsByTagName('Function')) {
                const funcSpec = this.makeFunction(func);
                if (funcSpec !== undefined) {
                    functions.set(funcSpec.name, funcSpec);
                }
            }
            const override = ((_a = displayConfig[0].getAttribute('override')) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'true';
            const enginePages = displayConfig[0].getElementsByTagName('EnginePage');
            if (enginePages.length == 0) {
                return { override: override, functions: functions, enginePage: this._parseConfig(displayConfig[0]) };
            }
            const leanPages = displayConfig[0].getElementsByTagName('LeanPage');
            const systemPages = displayConfig[0].getElementsByTagName('SystemPage');
            return {
                override: override,
                functions: functions,
                enginePage: this._parseConfig(enginePages[0]),
                leanPage: leanPages.length > 0 ? this._parseConfig(leanPages[0]) : undefined,
                systemPage: systemPages.length > 0 ? this._parseConfig(systemPages[0]) : undefined
            };
        }
    }
    /**
     * Parse an engine display setup.
     * @param config An instrument XML config document.
     * @returns An array of the gauges defined in the configuration.
     */
    _parseConfig(config) {
        var _a;
        const gaugeSpecs = new Array();
        if (config.children.length == 0) {
            return gaugeSpecs;
        }
        for (const gauge of config.children) {
            switch (gauge.tagName) {
                case 'Gauge':
                    switch ((_a = gauge.getElementsByTagName('Type')[0]) === null || _a === void 0 ? void 0 : _a.textContent) {
                        case 'Circular':
                            gaugeSpecs.push({
                                gaugeType: XMLGaugeType.Circular,
                                configuration: this.createCircularGauge(gauge)
                            });
                            break;
                        case 'Horizontal':
                            gaugeSpecs.push({
                                gaugeType: XMLGaugeType.Horizontal,
                                configuration: this.createHorizontalGauge(gauge)
                            });
                            break;
                        case 'DoubleHorizontal':
                            gaugeSpecs.push({
                                gaugeType: XMLGaugeType.DoubleHorizontal,
                                configuration: this.createDoubleHorizontalGauge(gauge)
                            });
                            break;
                        case 'Vertical':
                            gaugeSpecs.push({
                                gaugeType: XMLGaugeType.Vertical,
                                configuration: this.createVerticalGauge(gauge)
                            });
                            break;
                        case 'DoubleVertical':
                            gaugeSpecs.push({
                                gaugeType: XMLGaugeType.DoubleVertical,
                                configuration: this.createDoubleVerticalGauge(gauge)
                            });
                            break;
                        case 'Cylinder':
                            gaugeSpecs.push({
                                gaugeType: XMLGaugeType.Cylinder,
                                configuration: this.createCylinderGauge(gauge)
                            });
                            break;
                        case 'TwinCylinder':
                            gaugeSpecs.push({
                                gaugeType: XMLGaugeType.TwinCylinder,
                                configuration: this.createCylinderGauge(gauge)
                            });
                            break;
                    }
                    break;
                case 'Text':
                    {
                        const textProps = {};
                        const className = gauge.getAttribute('id');
                        if (className !== null) {
                            textProps.class = className;
                        }
                        const leftElem = gauge.getElementsByTagName('Left');
                        if (leftElem.length > 0) {
                            textProps.left = this.makeTextColumn(leftElem[0]);
                        }
                        const centerElem = gauge.getElementsByTagName('Center');
                        if (centerElem.length > 0) {
                            textProps.center = this.makeTextColumn(centerElem[0]);
                        }
                        const rightElem = gauge.getElementsByTagName('Right');
                        if (rightElem.length > 0) {
                            textProps.right = this.makeTextColumn(rightElem[0]);
                        }
                        const style = XMLGaugeConfigFactory.parseStyleDefinition(gauge.getElementsByTagName('Style'));
                        if (style !== undefined) {
                            textProps.style = style;
                        }
                        gaugeSpecs.push({
                            gaugeType: XMLGaugeType.Text,
                            configuration: textProps
                        });
                    }
                    break;
                case 'ColumnGroup':
                    gaugeSpecs.push({
                        gaugeType: XMLGaugeType.ColumnGroup,
                        configuration: this.createColumnGroup(gauge)
                    });
                    break;
                case 'Column':
                    gaugeSpecs.push({
                        gaugeType: XMLGaugeType.Column,
                        configuration: this.createColumn(gauge)
                    });
                    break;
            }
        }
        return gaugeSpecs;
    }
    /**
     * Construct a single column of text for a text element.  This can be any
     * one of Left, Right, or Center.
     * @param columnDef The XML definition for the given column.
     * @returns an XMLTextColumn configuration.
     */
    makeTextColumn(columnDef) {
        const contentElem = columnDef.getElementsByTagName('Content');
        const config = {
            content: new CompositeLogicXMLElement(this.instrument, contentElem.length > 0 ? contentElem[0] : columnDef)
        };
        const colorElem = columnDef.getElementsByTagName('Color');
        if (colorElem.length > 0) {
            config.color = new CompositeLogicXMLElement(this.instrument, colorElem[0]);
        }
        const className = columnDef.getAttribute('id');
        if (className !== null) {
            config.class = className;
        }
        const fontSize = columnDef.getAttribute('fontsize');
        if (fontSize !== null) {
            config.fontSize = fontSize;
        }
        return config;
    }
    /**
     * Make a function.
     * @param functionDef The XML definition for the function.
     * @returns an XMLFunction type or undefined if there's an error
     */
    makeFunction(functionDef) {
        const name = functionDef.getAttribute('Name');
        if (!name || functionDef.children.length == 0) {
            return undefined;
        }
        return {
            name: name,
            logic: new CompositeLogicXMLElement(this.instrument, functionDef)
        };
    }
    /**
     * Create a base XMLGaugeProps definition.  This will be combined with the
     * props for a speciific gauge type to fully define the config interface.
     * @param gauge The gauge definition
     * @returns A set of XMLGaugeProps
     */
    parseGaugeDefinition(gauge) {
        var _a;
        // TODO Maybe make this use getAndAssign, too?
        const props = {};
        /**
         * A closure to make our variable assignments easier.
         * @param prop The property we want to assign.
         * @param tag The HTML tag to get the value from.
         * @param converter A converter function.
         */
        const assign = (prop, tag, converter = (v) => { return v; }) => {
            XMLGaugeConfigFactory.getAndAssign(props, gauge, prop, tag, converter);
        };
        const colorZones = this.makeColorZones(gauge.getElementsByTagName('ColorZone'));
        if (colorZones !== undefined) {
            props.colorZones = colorZones;
        }
        const colorLines = this.makeColorLines(gauge.getElementsByTagName('ColorLine'));
        if (colorLines !== undefined) {
            props.colorLines = colorLines;
        }
        const referenceBugs = this.makeReferenceBugs(gauge.getElementsByTagName('ReferenceBug'));
        if (referenceBugs !== undefined) {
            props.referenceBugs = referenceBugs;
        }
        const createLogicElement = (el) => {
            if (el !== undefined) {
                return new CompositeLogicXMLElement(this.instrument, el);
            }
            return undefined;
        };
        props.minimum = createLogicElement(gauge.getElementsByTagName('Minimum')[0]);
        props.maximum = createLogicElement(gauge.getElementsByTagName('Maximum')[0]);
        props.value1 = createLogicElement(gauge.getElementsByTagName('Value')[0]);
        props.value2 = createLogicElement(gauge.getElementsByTagName('Value2')[0]);
        assign('title', 'Title', (v) => { return v ? v : ''; });
        assign('unit', 'Unit', (v) => { return v ? v : ''; });
        assign('graduationLength', 'GraduationLength', parseFloat);
        props.graduationHasText = ((_a = gauge.getElementsByTagName('GraduationLength')[0]) === null || _a === void 0 ? void 0 : _a.getAttribute('text')) == 'True';
        assign('beginText', 'BeginText');
        assign('endText', 'EndText');
        assign('cursorText1', 'CursorText', (v) => { return v ? v : ''; });
        assign('cursorText2', 'CursorText2', (v) => { return v ? v : ''; });
        assign('id', 'ID');
        props.redBlink = createLogicElement(gauge.getElementsByTagName('RedBlink')[0]);
        return props;
    }
    // The logic for creating these gauges is a little intricate and repeats a number of times.
    // To avoid having redundant comments, here's the general plan for what's happening.
    //
    // First, we create an instance of the gauge's style interface in several steps. These
    // take advantage of the fact that almost all of the props on on the interfaces are optional
    // to allow us to compose the gauge-specific interface in pieces.
    //
    // 1) The gauge-specific create function passes the Style element to the generic
    //    parseStyleDefinition function, which returns an interface that has all of the
    //    universal style properties.
    // 2) The function then creates its own gauge-specific style interface using parsing logic
    //    unique to the gauge.
    // 3) The values of the generic interface are then assigned to the object-specific one so
    //    that we have one interface with all the styling information needed.
    //
    // Next, we repeat the same process with the rest of the gauge definitions.   At this point,
    // the primary way in which the shapes of the interfaces differ is in what their style
    // definitions look like, so the second phase is just another assignment compositing the
    // custom-derived style and the remainder of the generic definiton as retrieved from the
    // parseGaugeDefinition method.
    //
    // We play a bit fast and loose with properties here and don't really do any confirmation
    // that the gauge definitions we get are valid.  The user could, for example, provide a
    // <Value2> property to a gauge that only has one value and that would be populated in the
    // configuration.   It would be harmless, because it would be ignored by the gauge code,
    // but it's still kind of gross.
    //
    // This models how the standard XMLEngineDisplay.js works.  In the future we might want to
    // tighten this up with better type checking and error throwing, in which case we can expand
    // these functions to use a bit more logic in this second phase when they're composing
    // the final configuration instance.
    //
    // Ok, on with the show.
    /**
     * Create a circular gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    createCircularGauge(gaugeDef) {
        const styleElem = gaugeDef.getElementsByTagName('Style');
        const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
        let style = {};
        const innerElem = styleElem[0];
        if (innerElem !== undefined) {
            /**
             * A closure to make our variable assignments easier.
             * @param prop The property we want to assign.
             * @param tag The HTML tag to get the value from.
             * @param converter A converter function.
             */
            const assign = (prop, tag, converter = (v) => { return v; }) => {
                XMLGaugeConfigFactory.getAndAssign(style, innerElem, prop, tag, converter);
            };
            assign('forceTextColor', 'ForceTextColor');
            assign('textIncrement', 'TextIncrement', parseFloat);
            assign('beginAngle', 'BeginAngle', parseFloat);
            assign('endAngle', 'EndAngle', parseFloat);
            assign('cursorType', 'CursorType', (v) => { return v == 'Triangle' ? d.XMLCircularGaugeCursor.Triangle : undefined; });
            assign('valuePos', 'ValuePos', (v) => { return v == 'End' ? d.XMLCircularGaugeValuePos.End : undefined; });
            assign('valuePrecision', 'ValuePrecision', parseInt);
        }
        style = Object.assign(style, genericStyle);
        return Object.assign({ style: style }, this.parseGaugeDefinition(gaugeDef));
    }
    /**
     * Create a horizontal gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    createHorizontalGauge(gaugeDef) {
        const styleElem = gaugeDef.getElementsByTagName('Style');
        const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
        let style = {};
        const innerElem = styleElem[0];
        if (innerElem !== undefined) {
            /**
             * A closure to make our variable assignments easier.
             * @param prop The property we want to assign.
             * @param tag The HTML tag to get the value from.
             * @param converter A converter function.
             */
            const assign = (prop, tag, converter = (v) => { return v; }) => {
                XMLGaugeConfigFactory.getAndAssign(style, innerElem, prop, tag, converter);
            };
            assign('valuePos', 'ValuePos', (v) => {
                switch (v) {
                    case 'Right':
                        return d.XMLHorizontalGaugeValuePos.Right;
                    case 'End':
                        return d.XMLHorizontalGaugeValuePos.End;
                    default:
                        return undefined;
                }
            });
            assign('textIncrement', 'TextIncrement', parseFloat);
            assign('cursorColor', 'CursorColor');
            assign('width', 'Width', parseFloat);
            assign('reverseY', 'ReverseY', (v) => { return v == 'True'; });
            assign('valuePrecision', 'ValuePrecision', parseInt);
        }
        style = Object.assign(style, genericStyle);
        return Object.assign({ style: style }, this.parseGaugeDefinition(gaugeDef));
    }
    /**
     * Create a double horizontal gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    createDoubleHorizontalGauge(gaugeDef) {
        const styleElem = gaugeDef.getElementsByTagName('Style');
        const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
        let style = {};
        if (styleElem[0] !== undefined) {
            XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'textIncrement', 'TextIncrement', parseFloat);
            XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'valuePrecision', 'ValuePrecision', parseInt);
            XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'valuePos', 'ValuePos', (v) => {
                return v == 'Right' ? d.XMLDoubleHorizontalGaugeValuePos.Right : undefined;
            });
            XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'pointerStyle', 'PointerStyle', (v) => {
                return v == 'Arrow' ? 'arrow' : 'standard';
            });
        }
        style = Object.assign(style, genericStyle);
        return Object.assign({ style: style }, this.parseGaugeDefinition(gaugeDef));
    }
    /**
     * Create a single vertical gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    createVerticalGauge(gaugeDef) {
        const styleElem = gaugeDef.getElementsByTagName('Style');
        const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
        let style = {};
        if (styleElem[0] !== undefined) {
            XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'textIncrement', 'TextIncrement', parseFloat);
        }
        style = Object.assign(style, genericStyle);
        return Object.assign({ style: style }, this.parseGaugeDefinition(gaugeDef));
    }
    /**
     * Create a double vertical gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    createDoubleVerticalGauge(gaugeDef) {
        const styleElem = gaugeDef.getElementsByTagName('Style');
        const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
        let style = {};
        if (styleElem[0] !== undefined) {
            XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'textIncrement', 'TextIncrement', parseFloat);
            XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'height', 'Height', parseFloat);
        }
        style = Object.assign(style, genericStyle);
        return Object.assign({ style: style }, this.parseGaugeDefinition(gaugeDef));
    }
    /**
     * Create a cylinder gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    createCylinderGauge(gaugeDef) {
        const styleElem = gaugeDef.getElementsByTagName('Style');
        const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
        const columnElems = gaugeDef.getElementsByTagName('Columns');
        const rowElems = gaugeDef.getElementsByTagName('Rows');
        const config = this.parseGaugeDefinition(gaugeDef);
        config.bus = this.bus;
        let style = {};
        if (styleElem[0] !== undefined) {
            XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'textIncrement', 'TextIncrement', parseFloat);
            XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'redline', 'ShowRedline', (text) => { return text == 'True'; });
            XMLGaugeConfigFactory.getAndAssign(style, styleElem[0], 'peakTemps', 'ShowPeak', (text) => { return text == 'True'; });
        }
        style = Object.assign(style, genericStyle);
        config.style = style;
        if (columnElems.length > 0) {
            config.numColumns = new CompositeLogicXMLElement(this.instrument, columnElems[0]);
        }
        if (rowElems.length > 0) {
            config.numRows = new CompositeLogicXMLElement(this.instrument, rowElems[0]);
        }
        XMLGaugeConfigFactory.getAndAssign(config, gaugeDef, 'tempOrder', 'TempOrder', (text) => {
            const tempOrder = new Array();
            for (const item of text.split(',')) {
                tempOrder.push(parseInt(item));
            }
            return tempOrder;
        });
        return config;
    }
    /**
     * Create a column group.
     * @param gaugeDef AN XML element defining the group.
     * @returns The props for the group with all contained columns.
     */
    createColumnGroup(gaugeDef) {
        const columns = new Array();
        const children = gaugeDef.children;
        for (const child of children) {
            if (child.tagName == 'Column') {
                columns.push(this.createColumn(child));
            }
        }
        const group = {
            bus: this.bus,
            columns: columns
        };
        XMLGaugeConfigFactory.getAndAssign(group, gaugeDef, 'id', 'id');
        return group;
    }
    /**
     * Create a column of gauges.
     * @param gaugeDef An XML element defining the column.
     * @returns The props of the column with all contained gauges.
     */
    createColumn(gaugeDef) {
        const column = { gauges: this._parseConfig(gaugeDef) };
        XMLGaugeConfigFactory.getAndAssign(column, gaugeDef, 'id', 'id');
        XMLGaugeConfigFactory.getAndAssign(column, gaugeDef, 'width', 'width', parseFloat);
        return column;
    }
    // Utility functions.
    /**
     * Check the value of a setting and, if it's defined, assign it to the
     * property of an object with optional type conversion.
     * @param obj The object to manipulate.
     * @param elem The element to get the value from.
     * @param prop The name of the property to set.
     * @param tag The tag name to retrieve.
     * @param converter A type conversion used if the value is defined.
     */
    static getAndAssign(obj, elem, prop, tag, converter = (val) => { return val; }) {
        var _a;
        const value = (_a = elem.getElementsByTagName(tag)[0]) === null || _a === void 0 ? void 0 : _a.textContent;
        if (value === null || value === undefined) {
            return;
        }
        const newVal = converter(value);
        if (newVal !== undefined) {
            obj[prop] = newVal;
        }
    }
    /**
     * Create a basic XML style from a gauge definition.
     * @param styleDoc A style definition block
     * @returns An XMLGaugeStyle
     */
    static parseStyleDefinition(styleDoc) {
        var _a;
        const style = {};
        if (styleDoc.length > 0) {
            XMLGaugeConfigFactory.getAndAssign(style, styleDoc[0], 'sizePercent', 'SizePercent', parseFloat);
            const marginsElem = styleDoc[0].getElementsByTagName('Margins');
            if (marginsElem.length > 0 && ((_a = marginsElem[0]) === null || _a === void 0 ? void 0 : _a.textContent) !== null) {
                XMLGaugeConfigFactory.getAndAssign(style, marginsElem[0], 'marginLeft', 'Left', parseFloat);
                XMLGaugeConfigFactory.getAndAssign(style, marginsElem[0], 'marginRight', 'Right', parseFloat);
                XMLGaugeConfigFactory.getAndAssign(style, marginsElem[0], 'marginTop', 'Top', parseFloat);
                XMLGaugeConfigFactory.getAndAssign(style, marginsElem[0], 'marginBottom', 'Bottom', parseFloat);
            }
        }
        return style;
    }
    /**
     * Get the SmoothFactor value from a gauge definition if present.
     * @param element The HTML element to search for the parameter.
     * @returns The smoothing factor as a number, or undefined if not found.
     */
    parseSmoothFactor(element) {
        var _a;
        const smoothElem = element.getElementsByTagName('SmoothFactor');
        if (smoothElem.length > 0 && ((_a = smoothElem[0]) === null || _a === void 0 ? void 0 : _a.textContent) !== null) {
            return smoothElem.length > 0 ? parseFloat(smoothElem[0].textContent) : undefined;
        }
    }
    /**
     * Create an array of color zones if a definition exists.
     * @param zones An array of color zone definitions.
     * @returns An array of XMLGaugeColorZones
     */
    makeColorZones(zones) {
        var _a, _b;
        const zoneArray = new Array();
        for (let i = 0; i < zones.length; i++) {
            let color = 'white';
            const colorElem = zones[i].getElementsByTagName('Color');
            if (colorElem.length > 0) {
                color = ((_a = colorElem[0]) === null || _a === void 0 ? void 0 : _a.textContent) ? (_b = colorElem[0]) === null || _b === void 0 ? void 0 : _b.textContent : 'white';
            }
            zoneArray.push({
                color: color,
                begin: new CompositeLogicXMLElement(this.instrument, zones[i].getElementsByTagName('Begin')[0]),
                end: new CompositeLogicXMLElement(this.instrument, zones[i].getElementsByTagName('End')[0]),
                smoothFactor: this.parseSmoothFactor(zones[i])
            });
        }
        return zoneArray.length > 0 ? zoneArray : undefined;
    }
    /**
     * Create an array of color lines if a definition exists.
     * @param lines An array of color line definitions.
     * @returns An array of XMLGaugeColorLines
     */
    makeColorLines(lines) {
        var _a, _b;
        const lineArray = new Array();
        for (let i = 0; i < lines.length; i++) {
            let color = 'white';
            const colorElem = lines[i].getElementsByTagName('Color');
            if (colorElem.length > 0) {
                color = ((_a = colorElem[0]) === null || _a === void 0 ? void 0 : _a.textContent) ? (_b = colorElem[0]) === null || _b === void 0 ? void 0 : _b.textContent : 'white';
            }
            lineArray.push({
                color: color,
                position: new CompositeLogicXMLElement(this.instrument, lines[i].getElementsByTagName('Position')[0]),
                smoothFactor: this.parseSmoothFactor(lines[i])
            });
        }
        return lineArray.length > 0 ? lineArray : undefined;
    }
    /**
     * Create an array of reference bugs if a definition exists.
     * @param bugs An array of reference bug definitions.
     * @returns An array of XMLGaugeReferenceBugs
     */
    makeReferenceBugs(bugs) {
        const bugArray = new Array();
        for (let i = 0; i < bugs.length; i++) {
            const styleElem = bugs[i].getElementsByTagName('Style');
            const genericStyle = XMLGaugeConfigFactory.parseStyleDefinition(styleElem);
            let bugStyle = {};
            const innerElem = styleElem[0];
            if (innerElem !== undefined) {
                XMLGaugeConfigFactory.getAndAssign(bugStyle, innerElem, 'color', 'Color');
            }
            bugStyle = Object.assign(bugStyle, genericStyle);
            bugArray.push({
                position: new CompositeLogicXMLElement(this.instrument, bugs[i].getElementsByTagName('Position')[0]),
                displayLogic: new CompositeLogicXMLElement(this.instrument, bugs[i].getElementsByTagName('DisplayLogic')[0]),
                style: bugStyle,
                smoothFactor: this.parseSmoothFactor(bugs[i])
            });
        }
        return bugArray;
    }
}
