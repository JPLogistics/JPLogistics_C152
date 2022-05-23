/// <reference types="msfstypes/pages/vcockpit/instruments/shared/utils/xmllogic" />
/// <reference types="msfstypes/pages/vcockpit/instruments/shared/baseinstrument" />
import { EventBus } from '../../data';
import * as d from './GaugeDefinitions';
import { XMLTextElementProps } from './TextElement';
/**
 * The type of gauges available, as defined in XMLEngineDisplay.js.
 */
export declare enum XMLGaugeType {
    Circular = "Circular",
    Horizontal = "Horizontal",
    DoubleHorizontal = "DoubleHorizontal",
    Vertical = "Vertical",
    DoubleVertical = "DoubleVertical",
    Text = "Text",
    ColumnGroup = "ColumnGroup",
    Column = "Column",
    Cylinder = "Cylinder",
    TwinCylinder = "TwinCylinder"
}
/**
 * The specification for a single gauge configuration.
 */
export declare type XMLGaugeSpec = {
    /** The type of gauge this is. */
    gaugeType: XMLGaugeType;
    /** The correct configuration interface for this gauge type. */
    configuration: d.XMLGaugeProps | d.GaugeColumnProps | d.GaugeColumnGroupProps | XMLTextElementProps;
};
/**
 * The data for a function.
 */
export declare type XMLFunction = {
    /** The function's name. */
    name: string;
    /** The XML logic the function runs. */
    logic: CompositeLogicXMLElement;
};
/**
 * A full set of gauges.
 */
export declare type XMLExtendedGaugeConfig = {
    /** Whether this should override the temporary enhanced default configs. */
    override: boolean;
    /** Any configured functions. */
    functions: Map<string, XMLFunction>;
    /** The engine page. */
    enginePage: Array<XMLGaugeSpec>;
    /** The lean page, if it exists. */
    leanPage?: Array<XMLGaugeSpec>;
    /** The system page, if it exists. */
    systemPage?: Array<XMLGaugeSpec>;
};
/**
 * Parse an XMLEngineDisplay configuration into an array of gauge specs.
 */
export declare class XMLGaugeConfigFactory {
    private instrument;
    private bus;
    /**
     * Create an XMLGaugeConfigFactory.
     * @param instrument The instrument that holds this engine display.
     * @param bus An event bus for gauges that need it.
     */
    constructor(instrument: BaseInstrument, bus: EventBus);
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
    parseConfig(document: Document): XMLExtendedGaugeConfig;
    /**
     * Parse an engine display setup.
     * @param config An instrument XML config document.
     * @returns An array of the gauges defined in the configuration.
     */
    private _parseConfig;
    /**
     * Construct a single column of text for a text element.  This can be any
     * one of Left, Right, or Center.
     * @param columnDef The XML definition for the given column.
     * @returns an XMLTextColumn configuration.
     */
    private makeTextColumn;
    /**
     * Make a function.
     * @param functionDef The XML definition for the function.
     * @returns an XMLFunction type or undefined if there's an error
     */
    private makeFunction;
    /**
     * Create a base XMLGaugeProps definition.  This will be combined with the
     * props for a speciific gauge type to fully define the config interface.
     * @param gauge The gauge definition
     * @returns A set of XMLGaugeProps
     */
    private parseGaugeDefinition;
    /**
     * Create a circular gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    private createCircularGauge;
    /**
     * Create a horizontal gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    private createHorizontalGauge;
    /**
     * Create a double horizontal gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    private createDoubleHorizontalGauge;
    /**
     * Create a single vertical gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    private createVerticalGauge;
    /**
     * Create a double vertical gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    private createDoubleVerticalGauge;
    /**
     * Create a cylinder gauge.
     * @param gaugeDef An XML element defining the gauge.
     * @returns The props for this gauge.
     */
    private createCylinderGauge;
    /**
     * Create a column group.
     * @param gaugeDef AN XML element defining the group.
     * @returns The props for the group with all contained columns.
     */
    private createColumnGroup;
    /**
     * Create a column of gauges.
     * @param gaugeDef An XML element defining the column.
     * @returns The props of the column with all contained gauges.
     */
    private createColumn;
    /**
     * Check the value of a setting and, if it's defined, assign it to the
     * property of an object with optional type conversion.
     * @param obj The object to manipulate.
     * @param elem The element to get the value from.
     * @param prop The name of the property to set.
     * @param tag The tag name to retrieve.
     * @param converter A type conversion used if the value is defined.
     */
    private static getAndAssign;
    /**
     * Create a basic XML style from a gauge definition.
     * @param styleDoc A style definition block
     * @returns An XMLGaugeStyle
     */
    private static parseStyleDefinition;
    /**
     * Get the SmoothFactor value from a gauge definition if present.
     * @param element The HTML element to search for the parameter.
     * @returns The smoothing factor as a number, or undefined if not found.
     */
    private parseSmoothFactor;
    /**
     * Create an array of color zones if a definition exists.
     * @param zones An array of color zone definitions.
     * @returns An array of XMLGaugeColorZones
     */
    private makeColorZones;
    /**
     * Create an array of color lines if a definition exists.
     * @param lines An array of color line definitions.
     * @returns An array of XMLGaugeColorLines
     */
    private makeColorLines;
    /**
     * Create an array of reference bugs if a definition exists.
     * @param bugs An array of reference bug definitions.
     * @returns An array of XMLGaugeReferenceBugs
     */
    private makeReferenceBugs;
}
//# sourceMappingURL=XMLGaugeAdapter.d.ts.map