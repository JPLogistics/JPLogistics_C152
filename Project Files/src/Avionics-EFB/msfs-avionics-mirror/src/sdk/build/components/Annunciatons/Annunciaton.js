/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/utils/XMLLogic" />
/** The acceptable priority types for a given annunciation. */
export var AnnunciationType;
(function (AnnunciationType) {
    AnnunciationType[AnnunciationType["Warning"] = 0] = "Warning";
    AnnunciationType[AnnunciationType["Caution"] = 1] = "Caution";
    AnnunciationType[AnnunciationType["Advisory"] = 2] = "Advisory";
    AnnunciationType[AnnunciationType["SafeOp"] = 3] = "SafeOp";
})(AnnunciationType || (AnnunciationType = {}));
/** The main logic for a cabin annunciation. */
export class Annunciation {
    /**
     * Creates an instance of Annunciation.
     * @param type The type of annuniciaton this is.
     * @param text The text label to show.
     * @param condition The logic condition for setting it.
     * @param suffix Any suffix text to past to the end.
     */
    constructor(type, text, condition, suffix) {
        this.type = type;
        this.text = text;
        this.condition = condition;
        this.suffix = suffix;
    }
}
