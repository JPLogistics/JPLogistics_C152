/// <reference types="msfstypes/pages/vcockpit/instruments/shared/baseinstrument" />
import { Warning } from './Warning';
/** Create a list of system warnings. */
export declare class XMLWarningFactory {
    private instrument;
    /**
     * Create an XMLWarningFactory.
     * @param instrument The instrument that the warnings run in.
     */
    constructor(instrument: BaseInstrument);
    /**
     * Parse a panel.xml configuration to create a list of warnings.  The warning
     * priority is defined by their order in panel.xml, with higher priority
     * warnings coming sooner in the file.
     * @param document The configuration as an XML document.
     * @returns An array of Warnings
     */
    parseConfig(document: Document): Array<Warning>;
}
//# sourceMappingURL=XMLWarningAdapter.d.ts.map