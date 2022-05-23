/// <reference types="msfstypes/pages/vcockpit/instruments/shared/baseinstrument" />
import { Annunciation } from './Annunciaton';
/** Create a list of annunciations from the instrument XML config. */
export declare class XMLAnnunciationFactory {
    private instrument;
    /**
     * Create an XMLAnnunciationFactory.
     * @param instrument The instrument that holds this engine display.
     */
    constructor(instrument: BaseInstrument);
    /**
     * Parse an panel.xml configuration
     * @param document The configuration as an XML document.
     * @returns An array of Annunciations.
     */
    parseConfig(document: Document): Array<Annunciation>;
}
//# sourceMappingURL=XMLAnnunciationAdapter.d.ts.map