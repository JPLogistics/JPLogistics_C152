// Common definitions relevant to all radio types.
/** The basic radio types. */
export var RadioType;
(function (RadioType) {
    RadioType["Com"] = "COM";
    RadioType["Nav"] = "NAV";
    RadioType["Adf"] = "ADF";
})(RadioType || (RadioType = {}));
/** The two frequency "banks", active and standby. */
export var FrequencyBank;
(function (FrequencyBank) {
    FrequencyBank[FrequencyBank["Active"] = 0] = "Active";
    FrequencyBank[FrequencyBank["Standby"] = 1] = "Standby";
})(FrequencyBank || (FrequencyBank = {}));
/** COM frequency spacing on COM radios. */
export var ComSpacing;
(function (ComSpacing) {
    /** 25Khz spacing */
    ComSpacing[ComSpacing["Spacing25Khz"] = 0] = "Spacing25Khz";
    /** 8.33Khz spacing */
    ComSpacing[ComSpacing["Spacing833Khz"] = 1] = "Spacing833Khz";
})(ComSpacing || (ComSpacing = {}));
