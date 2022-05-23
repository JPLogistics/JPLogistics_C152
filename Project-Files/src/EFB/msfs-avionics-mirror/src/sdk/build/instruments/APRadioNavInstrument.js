/// <reference types="msfstypes/JS/common" />
import { NavMath } from '../geo/NavMath';
import { NavProcSimVarPublisher, NavSourceType } from './NavProcessor';
/**
 * An instrument that gathers localizer and glideslope information for use by
 * the AP systems.
 */
export class APRadioNavInstrument {
    /**
     * Creates an instance of the APRadioNavInstrument.
     * @param bus The event bus to use with this instance.
     */
    constructor(bus) {
        this.bus = bus;
        this.navRadioData = {
            0: {
                gsLocation: new LatLongAlt(0, 0),
                navLocation: new LatLongAlt(0, 0),
                glideslope: this.createEmptyGlideslope({ index: 1, type: NavSourceType.Nav }),
                localizer: this.createEmptyLocalizer({ index: 1, type: NavSourceType.Nav }),
                cdi: this.createEmptyCdi({ index: 1, type: NavSourceType.Nav }),
                obs: this.createEmptyObs({ index: 1, type: NavSourceType.Nav }),
                magVar: 0
            },
            1: {
                gsLocation: new LatLongAlt(0, 0),
                navLocation: new LatLongAlt(0, 0),
                glideslope: this.createEmptyGlideslope({ index: 1, type: NavSourceType.Nav }),
                localizer: this.createEmptyLocalizer({ index: 1, type: NavSourceType.Nav }),
                cdi: this.createEmptyCdi({ index: 1, type: NavSourceType.Nav }),
                obs: this.createEmptyObs({ index: 1, type: NavSourceType.Nav }),
                magVar: 0
            },
            2: {
                gsLocation: new LatLongAlt(0, 0),
                navLocation: new LatLongAlt(0, 0),
                glideslope: this.createEmptyGlideslope({ index: 2, type: NavSourceType.Nav }),
                localizer: this.createEmptyLocalizer({ index: 2, type: NavSourceType.Nav }),
                cdi: this.createEmptyCdi({ index: 2, type: NavSourceType.Nav }),
                obs: this.createEmptyObs({ index: 2, type: NavSourceType.Nav }),
                magVar: 0
            }
        };
        this.currentCdiIndex = 1;
        this.navProc = new NavProcSimVarPublisher(bus);
        this.publisher = bus.getPublisher();
    }
    /** @inheritdoc */
    init() {
        this.navProc.startPublish();
        const navProcSubscriber = this.bus.getSubscriber();
        navProcSubscriber.on('nav_glideslope_1').whenChanged().handle(hasGs => this.setGlideslopeValue(1, 'isValid', hasGs));
        navProcSubscriber.on('nav_gs_lla_1').handle(lla => this.setGlideslopePosition(1, lla));
        navProcSubscriber.on('nav_gs_error_1').whenChanged().handle(gsError => this.setGlideslopeValue(1, 'deviation', gsError));
        navProcSubscriber.on('nav_raw_gs_1').whenChanged().handle(rawGs => this.setGlideslopeValue(1, 'gsAngle', rawGs));
        navProcSubscriber.on('nav_localizer_1').whenChanged().handle(hasLoc => this.setLocalizerValue(1, 'isValid', hasLoc));
        navProcSubscriber.on('nav_localizer_crs_1').whenChanged().handle(locCourse => this.setLocalizerValue(1, 'course', locCourse));
        navProcSubscriber.on('nav_cdi_1').whenChanged().handle(deviation => this.setCDIValue(1, 'deviation', deviation));
        navProcSubscriber.on('nav_obs_1').whenChanged().handle(obs => this.setOBSValue(1, 'heading', obs));
        navProcSubscriber.on('nav_glideslope_2').whenChanged().handle(hasGs => this.setGlideslopeValue(2, 'isValid', hasGs));
        navProcSubscriber.on('nav_gs_lla_2').handle(lla => this.setGlideslopePosition(2, lla));
        navProcSubscriber.on('nav_gs_error_2').whenChanged().handle(gsError => this.setGlideslopeValue(2, 'deviation', gsError));
        navProcSubscriber.on('nav_raw_gs_2').whenChanged().handle(rawGs => this.setGlideslopeValue(2, 'gsAngle', rawGs));
        navProcSubscriber.on('nav_localizer_2').whenChanged().handle(hasLoc => this.setLocalizerValue(2, 'isValid', hasLoc));
        navProcSubscriber.on('nav_localizer_crs_2').whenChanged().handle(locCourse => this.setLocalizerValue(2, 'course', locCourse));
        navProcSubscriber.on('nav_cdi_2').whenChanged().handle(deviation => this.setCDIValue(2, 'deviation', deviation));
        navProcSubscriber.on('nav_obs_2').whenChanged().handle(obs => this.setOBSValue(2, 'heading', obs));
        navProcSubscriber.on('nav_lla_1').handle(lla => this.setNavPosition(1, lla));
        navProcSubscriber.on('nav_lla_2').handle(lla => this.setNavPosition(2, lla));
        navProcSubscriber.on('nav_magvar_1').whenChanged().handle(magVar => this.setMagVar(1, magVar));
        navProcSubscriber.on('nav_magvar_2').whenChanged().handle(magVar => this.setMagVar(2, magVar));
        const navEvents = this.bus.getSubscriber();
        navEvents.on('cdi_select').handle(source => {
            const oldIndex = this.currentCdiIndex;
            this.currentCdiIndex = source.type === NavSourceType.Nav ? source.index : 0;
            if (oldIndex !== this.currentCdiIndex) {
                const data = this.navRadioData[this.currentCdiIndex];
                this.publisher.pub('nav_radio_active_gs_location', data.gsLocation);
                this.publisher.pub('nav_radio_active_nav_location', data.navLocation);
                this.publisher.pub('nav_radio_active_glideslope', data.glideslope);
                this.publisher.pub('nav_radio_active_localizer', data.localizer);
                this.publisher.pub('nav_radio_active_cdi_deviation', data.cdi);
                this.publisher.pub('nav_radio_active_obs_setting', data.obs);
                this.publisher.pub('nav_radio_active_magvar', data.magVar);
            }
        });
    }
    /** @inheritdoc */
    onUpdate() {
        this.navProc.onUpdate();
    }
    /**
     * Sets a value in a nav radio glideslope.
     * @param index The index of the nav radio.
     * @param field The field to set.
     * @param value The value to set the field to.
     */
    setGlideslopeValue(index, field, value) {
        this.navRadioData[index].glideslope[field] = value;
        if (this.currentCdiIndex === index) {
            this.publisher.pub('nav_radio_active_glideslope', this.navRadioData[index].glideslope);
        }
    }
    /**
     * Sends the current glideslope's LLA position.
     * @param index The index of the nav radio.
     * @param lla The LLA to send.
     */
    setGlideslopePosition(index, lla) {
        this.navRadioData[index].gsLocation = lla;
        if (this.currentCdiIndex === index) {
            this.publisher.pub('nav_radio_active_gs_location', lla);
        }
    }
    /**
     * Sends the current nav's LLA position.
     * @param index The index of the nav radio.
     * @param lla The LLA to send.
     */
    setNavPosition(index, lla) {
        this.navRadioData[index].navLocation = lla;
        if (this.currentCdiIndex === index) {
            this.publisher.pub('nav_radio_active_nav_location', lla);
        }
    }
    /**
     * Sets a value in a nav radio localizer.
     * @param index The index of the nav radio.
     * @param field The field to set.
     * @param value The value to set the field to.
     */
    setLocalizerValue(index, field, value) {
        this.navRadioData[index].localizer[field] = value;
        if (this.currentCdiIndex === index) {
            this.publisher.pub('nav_radio_active_localizer', this.navRadioData[index].localizer);
        }
        switch (index) {
            case 1:
                this.publisher.pub('nav_radio_localizer_1', this.navRadioData[index].localizer);
                break;
            case 2:
                this.publisher.pub('nav_radio_localizer_2', this.navRadioData[index].localizer);
                break;
        }
    }
    /**
     * Sets a value in a nav radio localizer.
     * @param index The index of the nav radio.
     * @param field The field to set.
     * @param value The value to set the field to.
     */
    setCDIValue(index, field, value) {
        this.navRadioData[index].cdi[field] = value;
        if (this.currentCdiIndex === index) {
            this.publisher.pub('nav_radio_active_cdi_deviation', this.navRadioData[index].cdi);
        }
        switch (index) {
            case 1:
                this.publisher.pub('nav_radio_cdi_1', this.navRadioData[index].cdi);
                break;
            case 2:
                this.publisher.pub('nav_radio_cdi_2', this.navRadioData[index].cdi);
                break;
        }
    }
    /**
     * Sets a value in a nav radio localizer.
     * @param index The index of the nav radio.
     * @param field The field to set.
     * @param value The value to set the field to.
     */
    setOBSValue(index, field, value) {
        this.navRadioData[index].obs[field] = value;
        if (this.currentCdiIndex === index) {
            this.publisher.pub('nav_radio_active_obs_setting', this.navRadioData[index].obs);
        }
    }
    /**
     * Sets the magnetic variation of a nav radio signal source.
     * @param index The index of the nav radio.
     * @param magVar The magvar to set.
     */
    setMagVar(index, magVar) {
        magVar = NavMath.normalizeHeading(-magVar + 180) % 360 - 180;
        this.navRadioData[index].magVar = magVar;
        if (this.currentCdiIndex === index) {
            this.publisher.pub('nav_radio_active_magvar', magVar);
        }
    }
    /**
     * Creates an empty localizer data.
     * @param id The nav source ID.
     * @returns New empty localizer data.
     */
    createEmptyLocalizer(id) {
        return {
            isValid: false,
            course: 0,
            source: id
        };
    }
    /**
     * Creates an empty glideslope data.
     * @param id The nav source ID.
     * @returns New empty glideslope data.
     */
    createEmptyGlideslope(id) {
        return {
            isValid: false,
            gsAngle: 0,
            deviation: 0,
            source: id
        };
    }
    /**
     * Creates an empty CDI data.
     * @param id The nav source ID.
     * @returns New empty CDI data.
     */
    createEmptyCdi(id) {
        return {
            deviation: 0,
            source: id
        };
    }
    /**
     * Creates an empty OBS data.
     * @param id The nav source ID.
     * @returns New empty OBS data.
     */
    createEmptyObs(id) {
        return {
            heading: 0,
            source: id
        };
    }
}
