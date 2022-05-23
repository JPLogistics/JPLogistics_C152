import { IndexedEventType } from '../data';
/**
 * FADEC-related events.
 */
export declare type FadecEvents = {
    /** Whether FADEC is active. */
    fadec_active: boolean;
    /** The name of the currently active FADEC mode. */
    [fadec_mode: IndexedEventType<'fadec_mode'>]: string;
};
//# sourceMappingURL=FadecEvents.d.ts.map