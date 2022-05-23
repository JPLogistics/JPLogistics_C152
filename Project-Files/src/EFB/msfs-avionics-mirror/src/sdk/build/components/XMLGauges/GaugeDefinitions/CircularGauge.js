/**
 * The style of cursor to use on a circular gauge.
 * This is treated as though it may have multiple options in the original
 * source.  For the sake of future expansion we'll make this an enum even
 * though it currently only has one option.  Maybe it can be used for future
 * expansion.
 */
export var XMLCircularGaugeCursor;
(function (XMLCircularGaugeCursor) {
    /** Starting the enum at 1 to match its value in the stock XMLEngineDisplay.js */
    XMLCircularGaugeCursor[XMLCircularGaugeCursor["Triangle"] = 1] = "Triangle";
})(XMLCircularGaugeCursor || (XMLCircularGaugeCursor = {}));
/**
 * The possible locations for value text.
 * This is treated as though it may have multiple options in the original
 * source.  For the sake of future expansion we'll make this an enum even
 * though it currently only has one option.  Maybe it can be used for future
 * expansion.
 */
export var XMLCircularGaugeValuePos;
(function (XMLCircularGaugeValuePos) {
    /** Starting the enum at 1 to match its value in the stock XMLEngineDisplay.js */
    XMLCircularGaugeValuePos[XMLCircularGaugeValuePos["End"] = 1] = "End";
})(XMLCircularGaugeValuePos || (XMLCircularGaugeValuePos = {}));
