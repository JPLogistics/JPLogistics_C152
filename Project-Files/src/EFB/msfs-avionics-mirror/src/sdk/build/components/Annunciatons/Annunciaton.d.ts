/// <reference types="msfstypes/pages/vcockpit/instruments/shared/utils/xmllogic" />
/** The acceptable priority types for a given annunciation. */
export declare enum AnnunciationType {
    Warning = 0,
    Caution = 1,
    Advisory = 2,
    SafeOp = 3
}
/** The main logic for a cabin annunciation. */
export declare class Annunciation {
    /** The priority type of the annunciation. */
    readonly type: AnnunciationType;
    /** The text to show when we are displayed. */
    readonly text: string;
    /** An XML logic element that will show when we are active. */
    readonly condition: CompositeLogicXMLElement;
    /** An optional text suffix to put on the alert text. */
    readonly suffix: string | undefined;
    /**
     * Creates an instance of Annunciation.
     * @param type The type of annuniciaton this is.
     * @param text The text label to show.
     * @param condition The logic condition for setting it.
     * @param suffix Any suffix text to past to the end.
     */
    constructor(type: AnnunciationType, text: string, condition: CompositeLogicXMLElement, suffix: string | undefined);
}
//# sourceMappingURL=Annunciaton.d.ts.map