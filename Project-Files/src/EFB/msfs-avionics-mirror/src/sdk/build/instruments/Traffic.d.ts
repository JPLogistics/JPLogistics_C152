import { EventBus } from '../data/EventBus';
import { GeoPoint, GeoPointReadOnly } from '../geo/GeoPoint';
import { NumberUnit, NumberUnitReadOnly, UnitFamily } from '../math/NumberUnit';
import { Instrument } from './Backplane';
/**
 * Traffic events.
 */
export interface TrafficEvents {
    /** A traffic contact was added. The value is the uid of the new contact. */
    traffic_contact_added: number;
    /** A traffic contact was updated. The value is the uid of the updated contact. */
    traffic_contact_updated: number;
    /** A traffic contact was removed. The value is the uid of the removed contact. */
    traffic_contact_removed: number;
}
/**
 * A traffic contact.
 */
export interface TrafficContact {
    /** A unique ID number assigned to this contact. */
    readonly uid: number;
    /** The last time of contact, in sim time, as a UNIX millisecond timestamp. */
    readonly lastContactTime: number;
    /** The position of this contact at time of last contact. */
    readonly lastPosition: GeoPointReadOnly;
    /** The altitude of this contact at time of last contact. */
    readonly lastAltitude: NumberUnitReadOnly<UnitFamily.Distance>;
    /** The heading of this contact at time of last contact. */
    readonly lastHeading: number;
    /** The most recent calculated ground speed of this contact. Equal to NaN if not yet been calculated. */
    readonly groundSpeed: NumberUnitReadOnly<UnitFamily.Speed>;
    /** The most recent calculated ground track of this contact. Equal to NaN if not yet been calculated. */
    readonly groundTrack: number;
    /** The most recent calculaed vertical speed of this contact. Equal to NaN if not yet been calculated. */
    readonly verticalSpeed: NumberUnitReadOnly<UnitFamily.Speed>;
    /**
     * Calculates the predicted position and altitude of this contact at a specified time based on the most recent
     * available data and stores the results in the supplied objects. If insufficient data are available to calculate
     * the prediction, the results will be equal to NaN.
     * @param simTime The sim time for which to calculate the prediction, as a UNIX millisecond timestamp.
     * @param positionOut A GeoPoint object to which to write the predicted position.
     * @param altitudeOut A NumberUnit object to which to write the predicted altitude.
     */
    predict(simTime: number, positionOut: GeoPoint, altitudeOut: NumberUnit<UnitFamily.Distance>): void;
}
/**
 * Initialization options for TrafficInstrument.
 */
export declare type TrafficInstrumentOptions = {
    /** The maximum update frequency (Hz) in real time. */
    realTimeUpdateFreq: number;
    /** The maximum update frequency (Hz) in sim time. */
    simTimeUpdateFreq: number;
    /**
     * The maximum amount of sim time elapsed, in milliseconds, since last contact allowed before a contact is
     * deprecated.
     */
    contactDeprecateTime: number;
};
/**
 * Tracks aircraft traffic. Maintains a list of contacts, periodically updates their position, altitude, and reported
 * heading, and uses these data to compute ground speed, ground track, and vertical speed.
 */
export declare class TrafficInstrument implements Instrument {
    private readonly bus;
    private readonly options;
    private readonly tracked;
    private lastUpdateRealTime;
    private lastUpdateSimTime;
    private isBusy;
    /**
     * Constructor.
     * @param bus The event bus.
     * @param options Options with which to initialize this instrument.
     */
    constructor(bus: EventBus, options: TrafficInstrumentOptions);
    /**
     * Retrieves a traffic contact by its assigned ID number.
     * @param uid an ID number.
     * @returns the traffic contact with the assigned ID number, or undefined if no such contact exists.
     */
    getContact(uid: number): TrafficContact | undefined;
    /**
     * Iterates through all tracked traffic contacts with a visitor function.
     * @param visitor A visitor function.
     */
    forEachContact(visitor: (contact: TrafficContact) => void): void;
    /**
     * Initializes this instrument. Once initialized, this instrument will automatically track and update traffic
     * contacts.
     */
    init(): void;
    /**
     * Updates this instrument's list of contacts.
     * @param data An array of the most recent traffic data entries.
     * @param simTime The sim time at which the traffic data was generated.
     */
    private updateContacts;
    /**
     * Creates a contact.
     * @param entry The traffic data entry from which to create the new contact.
     * @param simTime The sim time at which the traffic data entry was generated.
     */
    private createContact;
    /**
     * Updates a contact.
     * @param contact The contact to update.
     * @param entry The current traffic data entry for the contact.
     * @param simTime The sim time at which the traffic data entry was generated.
     */
    private updateContact;
    /**
     * Removes all contacts whose time since last contact exceeds the deprecation threshold.
     * @param simTime The current sim time.
     */
    private deprecateContacts;
    /**
     * A callback which is called when the sim time changes.
     * @param simTime The current sim time.
     */
    private onSimTimeChanged;
    /**
     * This method does nothing.
     */
    onUpdate(): void;
}
//# sourceMappingURL=Traffic.d.ts.map