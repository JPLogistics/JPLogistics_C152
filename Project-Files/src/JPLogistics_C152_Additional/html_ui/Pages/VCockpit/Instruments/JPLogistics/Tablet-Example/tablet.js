// FlyingIron Simulations Tablet for the Spitfire
Include.addScript("/JS/dataStorage.js");

class tablet_class extends BaseInstrument {

    constructor() {
        super();
        this._isConnected = false;
    }

    get templateID() { return "tablet_script"; }
    get isInteractive() { return true; }

    connectedCallback() {
        super.connectedCallback();

        this._isConnected = true;

        this.frame = 0;
        this.frameStamp = new Date();

        // App
        this.appButton1 = this.getChildById("appButton1");
        this.appButton1.addEventListener("mouseup", this.appButton1Press.bind(this));
        this.appButton2 = this.getChildById("appButton2");
        this.appButton2.addEventListener("mouseup", this.appButton2Press.bind(this));
        this.appButton3 = this.getChildById("appButton3");
        this.appButton3.addEventListener("mouseup", this.appButton3Press.bind(this));
        this.appButton4 = this.getChildById("appButton4");
        this.appButton4.addEventListener("mouseup", this.appButton4Press.bind(this));
        this.appButton5 = this.getChildById("appButton5");
        this.appButton5.addEventListener("mouseup", this.appButton5Press.bind(this));
        this.appButton6 = this.getChildById("appButton6");
        this.appButton6.addEventListener("mouseup", this.appButton6Press.bind(this));
        this.appButton7 = this.getChildById("appButton7");
        this.appButton7.addEventListener("mouseup", this.appButton7Press.bind(this));

        // Checklists
        this.checklistButton0 = this.getChildById("checklistButton0");
        this.checklistButton0.addEventListener("mouseup", this.checklistButton0Press.bind(this));
        this.checklistButton1 = this.getChildById("checklistButton1");
        this.checklistButton1.addEventListener("mouseup", this.checklistButton1Press.bind(this));
        this.checklistButton2 = this.getChildById("checklistButton2");
        this.checklistButton2.addEventListener("mouseup", this.checklistButton2Press.bind(this));
        this.checklistButton3 = this.getChildById("checklistButton3");
        this.checklistButton3.addEventListener("mouseup", this.checklistButton3Press.bind(this));
        this.checklistButton4 = this.getChildById("checklistButton4");
        this.checklistButton4.addEventListener("mouseup", this.checklistButton4Press.bind(this));
        this.checklistButton5 = this.getChildById("checklistButton5");
        this.checklistButton5.addEventListener("mouseup", this.checklistButton5Press.bind(this));
        this.checklistButton6 = this.getChildById("checklistButton6");
        this.checklistButton6.addEventListener("mouseup", this.checklistButton6Press.bind(this));

        // Live Data
        this.GS = 0;
        this.dataSpeed = this.getChildById("dataSpeed");
        this.dataAltitude = this.getChildById("dataAltitude");
        this.dataHeading = this.getChildById("dataHeading");
        this.dataWeather = this.getChildById("dataWeather");
        this.dataEngines = this.getChildById("dataEngines");
        this.dataPropellers = this.getChildById("dataPropellers");
        this.dataPressure = this.getChildById("dataPressure");
        this.dataCfg = this.getChildById("dataCfg");
        this.dataTemperature = this.getChildById("dataTemperature");
        this.dataTanks = this.getChildById("dataTanks");
        this.dataRange = this.getChildById("dataRange");

        // Loadout
        this.loadoutButtonShort = this.getChildById("loadoutButtonShort");
        this.loadoutButtonShort.addEventListener("mouseup", this.loadoutButtonShortPress.bind(this));
        this.loadoutButtonMedium = this.getChildById("loadoutButtonMedium");
        this.loadoutButtonMedium.addEventListener("mouseup", this.loadoutButtonMediumPress.bind(this));
        this.loadoutButtonLong = this.getChildById("loadoutButtonLong");
        this.loadoutButtonLong.addEventListener("mouseup", this.loadoutButtonLongPress.bind(this));
        this.loadoutButtons = this.getChildById("loadoutButtons");

        // Auto Pilot
        this.apDivLeft = this.getChildById("apDivLeft");
        this.apDivLeft.addEventListener("mouseup", this.apDivLeftPress.bind(this));
        this.apDivRight = this.getChildById("apDivRight");
        this.apDivRight.addEventListener("mouseup", this.apDivRightPress.bind(this));
        this.apDivDown = this.getChildById("apDivDown");
        this.apDivDown.addEventListener("mouseup", this.apDivDownPress.bind(this));
        this.apDivUp = this.getChildById("apDivUp");
        this.apDivUp.addEventListener("mouseup", this.apDivUpPress.bind(this));
        this.apDivHdg = this.getChildById("apDivHdg");
        this.apDivHdg.addEventListener("mouseup", this.apDivHdgPress.bind(this));
        this.apDivAlt = this.getChildById("apDivAlt");
        this.apDivAlt.addEventListener("mouseup", this.apDivAltPress.bind(this));
        this.apDivLvl = this.getChildById("apDivLvl");
        this.apDivLvl.addEventListener("mouseup", this.apDivLvlPress.bind(this));
        this.apDivPower = this.getChildById("apDivPower");
        this.apDivPower.addEventListener("mouseup", this.apDivPowerPress.bind(this));
        this.apDivHdgAct = this.getChildById("apDivHdgAct");
        this.apDivAltAct = this.getChildById("apDivAltAct");
        this.apDivHdgTrg = this.getChildById("apDivHdgTrg");
        this.apDivAltTrg = this.getChildById("apDivAltTrg");
        this.apDivStatus = this.getChildById("apDivStatus");

        // Settings
        this.settingsToggleGunsight = this.getChildById("settingsToggleGunsight");
        this.settingsToggleGunsight.addEventListener("change", this.settingsToggleGunsightPress.bind(this));
        this.settingsToggleYoke = this.getChildById("settingsToggleYoke");
        this.settingsToggleYoke.addEventListener("change", this.settingsToggleYokePress.bind(this));
        this.settingsTogglePushback = this.getChildById("settingsTogglePushback");
        this.settingsTogglePushback.addEventListener("change", this.settingsTogglePushbackPress.bind(this));
        this.settingsToggleEngineDamage = this.getChildById("settingsToggleEngineDamage");
        this.settingsToggleEngineDamage.addEventListener("change", this.settingsToggleEngineDamagePress.bind(this));
        this.settingsToggleHypoxia = this.getChildById("settingsToggleHypoxia");
        this.settingsToggleHypoxia.addEventListener("change", this.settingsToggleHypoxiaPress.bind(this));
        this.settingsBrightnessInc = this.getChildById("settingsBrightnessInc");
        this.settingsBrightnessInc.addEventListener("mouseup", this.settingsBrightnessIncPress.bind(this));
        this.settingsBrightnessDec = this.getChildById("settingsBrightnessDec");
        this.settingsBrightnessDec.addEventListener("mouseup", this.settingsBrightnessDecPress.bind(this));
        this.settingsGroundServices = this.getChildById("settingsGroundServices");
        this.settingsRadioButtonA = this.getChildById("settingsRadioButtonA");
        this.settingsRadioButtonA.addEventListener("mouseup", this.settingsRadioButtonAPress.bind(this));
        this.settingsRadioButtonB = this.getChildById("settingsRadioButtonB");
        this.settingsRadioButtonB.addEventListener("mouseup", this.settingsRadioButtonBPress.bind(this));
        this.settingsRadioButtonC = this.getChildById("settingsRadioButtonC");
        this.settingsRadioButtonC.addEventListener("mouseup", this.settingsRadioButtonCPress.bind(this));
        this.settingsRadioButtonD = this.getChildById("settingsRadioButtonD");
        this.settingsRadioButtonD.addEventListener("mouseup", this.settingsRadioButtonDPress.bind(this));
        this.settingsRadioSelected = "";

        // Load saved settings from local storage
        let Dmg_On = GetStoredData("FIS_SPIT_Dmg_On");
        if (Dmg_On != "") {
            SimVar.SetSimVarValue("L:DMG_ON", "Bool", Dmg_On == "true");
            this.settingsToggleEngineDamage.checked = Dmg_On == "true";
        }
        let Gunsight_Vis = GetStoredData("FIS_SPIT_Gunsight_Vis");
        if (Gunsight_Vis != "") {
            SimVar.SetSimVarValue("L:Gunsight_Vis", "Bool", Gunsight_Vis == "true");
            this.settingsToggleGunsight.checked = Gunsight_Vis == "true";
        }
        let XMLVAR_YokeHidden1 = GetStoredData("FIS_SPIT_XMLVAR_YokeHidden1");
        if (XMLVAR_YokeHidden1 != "") {
            SimVar.SetSimVarValue("L:XMLVAR_YokeHidden1", "Bool", XMLVAR_YokeHidden1 == "true");
            this.settingsToggleYoke.checked = XMLVAR_YokeHidden1 == "false";
        }
        this.settingsRadioChannelA = GetStoredData("FIS_SPIT_RadioChannelA");
        if (this.settingsRadioChannelA != "") {
            this.settingsRadioButtonA.innerHTML = "A (" + this.bcd16ToMhz(this.settingsRadioChannelA) + ")";
        }
        this.settingsRadioChannelB = GetStoredData("FIS_SPIT_RadioChannelB");
        if (this.settingsRadioChannelB != "") {
            this.settingsRadioButtonB.innerHTML = "B (" + this.bcd16ToMhz(this.settingsRadioChannelB) + ")";
        }
        this.settingsRadioChannelC = GetStoredData("FIS_SPIT_RadioChannelC");
        if (this.settingsRadioChannelC != "") {
            this.settingsRadioButtonC.innerHTML = "C (" + this.bcd16ToMhz(this.settingsRadioChannelC) + ")";
        }
        this.settingsRadioChannelD = GetStoredData("FIS_SPIT_RadioChannelD");
        if (this.settingsRadioChannelD != "") {
            this.settingsRadioButtonD.innerHTML = "D (" + this.bcd16ToMhz(this.settingsRadioChannelD) + ")";
        }
    }

    appButton1Press() {
        this.activateApp(1);
    }

    appButton2Press() {
        this.activateApp(2);
    }

    appButton3Press() {
        this.activateApp(3);
    }

    appButton4Press() {
        this.activateApp(4);
    }

    appButton5Press() {
        this.activateApp(5);
    }

    appButton6Press() {
        this.activateApp(6);
    }

    appButton7Press() {
        this.activateApp(7);
    }

    checklistButton0Press() {
        this.activateChecklist(0);
    }

    checklistButton1Press() {
        this.activateChecklist(1);
    }

    checklistButton2Press() {
        this.activateChecklist(2);
    }

    checklistButton3Press() {
        this.activateChecklist(3);
    }

    checklistButton4Press() {
        this.activateChecklist(4);
    }

    checklistButton5Press() {
        this.activateChecklist(5);
    }

    checklistButton6Press() {
        this.activateChecklist(6);
    }

    loadoutButtonShortPress() {
        this.loadoutSet(0.69, 0, false);
        SimVar.SetSimVarValue("L:OXYGEN_quantity", "Number", 100);
    }

    loadoutButtonMediumPress() {
        this.loadoutSet(1, 0, false);
        SimVar.SetSimVarValue("L:OXYGEN_quantity", "Number", 100);
    }

    loadoutButtonLongPress() {
        this.loadoutSet(1, 1, true);
        SimVar.SetSimVarValue("L:OXYGEN_quantity", "Number", 100);
    }

    settingsToggleGunsightPress() {
        SimVar.SetSimVarValue("L:Gunsight_Vis", "Bool", this.settingsToggleGunsight.checked);
        SetStoredData("FIS_SPIT_Gunsight_Vis", this.settingsToggleGunsight.checked.toString());
    }

    settingsToggleYokePress() {
        SimVar.SetSimVarValue("L:XMLVAR_YokeHidden1", "Bool", !this.settingsToggleYoke.checked);
        SetStoredData("FIS_SPIT_XMLVAR_YokeHidden1", (!this.settingsToggleYoke.checked).toString());
    }

    settingsTogglePushbackPress() {
        SimVar.SetSimVarValue("K:TOGGLE_PUSHBACK", "Bool", this.settingsTogglePushback.checked);
    }

    settingsToggleEngineDamagePress() {
        SimVar.SetSimVarValue("L:DMG_ON", "Bool", this.settingsToggleEngineDamage.checked);
        SetStoredData("FIS_SPIT_Dmg_On", this.settingsToggleEngineDamage.checked.toString());
    }

    settingsToggleHypoxiaPress() {
        SimVar.SetSimVarValue("L:Hypoxia_On", "Bool", this.settingsToggleHypoxia.checked);
        SetStoredData("FIS_SPIT_Hypoxia_On", this.settingsToggleHypoxia.checked.toString());
    }

    settingsRadioButtonAPress() {
        this.settingsRadioChannelA = SimVar.GetSimVarValue("A:COM ACTIVE FREQUENCY:1", "Frequency BCD16").toString();
        SetStoredData("FIS_SPIT_RadioChannelA", this.settingsRadioChannelA);
        this.settingsRadioButtonA.innerHTML = "A (" + this.bcd16ToMhz(this.settingsRadioChannelA) + ")";
    }

    settingsRadioButtonBPress() {
        this.settingsRadioChannelB = SimVar.GetSimVarValue("A:COM ACTIVE FREQUENCY:1", "Frequency BCD16").toString();
        SetStoredData("FIS_SPIT_RadioChannelB", this.settingsRadioChannelB);
        this.settingsRadioButtonB.innerHTML = "B (" + this.bcd16ToMhz(this.settingsRadioChannelB) + ")";
    }

    settingsRadioButtonCPress() {
        this.settingsRadioChannelC = SimVar.GetSimVarValue("A:COM ACTIVE FREQUENCY:1", "Frequency BCD16").toString();
        SetStoredData("FIS_SPIT_RadioChannelC", this.settingsRadioChannelC);
        this.settingsRadioButtonC.innerHTML = "C (" + this.bcd16ToMhz(this.settingsRadioChannelC) + ")";
    }

    settingsRadioButtonDPress() {
        this.settingsRadioChannelD = SimVar.GetSimVarValue("A:COM ACTIVE FREQUENCY:1", "Frequency BCD16").toString();
        SetStoredData("FIS_SPIT_RadioChannelD", this.settingsRadioChannelD);
        this.settingsRadioButtonD.innerHTML = "D (" + this.bcd16ToMhz(this.settingsRadioChannelD) + ")";
    }

    settingsBrightnessIncPress() {
        let brightness = 1.0 - this.appBrightness.style.opacity + 0.1;
        if (brightness > 1.0) {
            brightness = 1.0;
        }
        this.appBrightness.style.opacity = 1.0 - brightness;
        SetStoredData("FIS_SPIT_Brightness", brightness.toString());
        this.drawBarMeter("settingsBrightnessSvg", brightness);
    }

    settingsBrightnessDecPress() {
        let brightness = 1.0 - this.appBrightness.style.opacity - 0.1;
        if (brightness < 0.2) {
            brightness = 0.2;
        }
        this.appBrightness.style.opacity = 1.0 - brightness;
        SetStoredData("FIS_SPIT_Brightness", brightness.toString());
        this.drawBarMeter("settingsBrightnessSvg", brightness);
    }

    apDivLeftPress() {
        if (this.apPower && this.apHdg) {
            let step = this.apGetHdgStep();
            this.apHdgTrg = (Math.ceil((this.apHdgTrg - step) / step) * step + 360) % 360;
            this.apDivHdgTrg.innerHTML = this.apHdgTrg;
            SimVar.SetSimVarValue("K:HEADING_BUG_SET", "Number", this.apHdgTrg);
            SimVar.SetSimVarValue("K:AP_HDG_HOLD_ON", "Bool", 0);
            SimVar.SetSimVarValue("K:HEADING_BUG_SET", "Number", this.apHdgTrg);
        }
    }

    apDivRightPress() {
        if (this.apPower && this.apHdg) {
            let step = this.apGetHdgStep();
            this.apHdgTrg = Math.floor((this.apHdgTrg + step) / step) * step % 360;
            this.apDivHdgTrg.innerHTML = this.apHdgTrg;
            SimVar.SetSimVarValue("K:HEADING_BUG_SET", "Number", this.apHdgTrg);
            SimVar.SetSimVarValue("K:AP_HDG_HOLD_ON", "Bool", 0);
            SimVar.SetSimVarValue("K:HEADING_BUG_SET", "Number", this.apHdgTrg);
        }
    }

    apDivDownPress() {
        if (this.apPower && this.apAlt) {
            let step = this.apGetAltStep();
            this.apAltTrg = Math.ceil((this.apAltTrg - step) / step) * step;
            if (this.apAltTrg < 0) this.apAltTrg = 0;
            this.apDivAltTrg.innerHTML = this.apAltTrg;
            SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "Number", this.apAltTrg);
            SimVar.SetSimVarValue("K:AP_ALT_HOLD_ON", "Bool", 0);
            SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "Number", this.apAltTrg);
        }
    }

    apDivUpPress() {
        if (this.apPower && this.apAlt) {
            let step = this.apGetAltStep();
            this.apAltTrg = Math.floor((this.apAltTrg + step) / step) * step;
            this.apDivAltTrg.innerHTML = this.apAltTrg;
            SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "Number", this.apAltTrg);
            SimVar.SetSimVarValue("K:AP_ALT_HOLD_ON", "Bool", 0);
            SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "Number", this.apAltTrg);
        }
    }

    apDivHdgPress() {
        this.apHdg = !this.apHdg;
        if (this.apPower && this.apHdg) {
            this.apHdgTrg = this.apHdgAct;
            this.apDivHdgTrg.innerHTML = this.apHdgTrg;
            SimVar.SetSimVarValue("K:HEADING_BUG_SET", "Number", this.apHdgTrg);
            SimVar.SetSimVarValue("K:AP_HDG_HOLD_ON", "Bool", 0);
            SimVar.SetSimVarValue("K:HEADING_BUG_SET", "Number", this.apHdgTrg);
            this.apLvl = true;
            this.apDivLvlPress();
        } else {
            this.apHdg = false;
            this.apDivHdgTrg.innerHTML = "";
            SimVar.SetSimVarValue("K:AP_HDG_HOLD_OFF", "Bool", 0);
        }
        this.apButton(this.apDivHdg, this.apHdg);
    }

    apDivAltPress() {
        this.apAlt = !this.apAlt;
        if (this.apPower && this.apAlt) {
            this.apAltTrg = this.apAltAct;
            this.apDivAltTrg.innerHTML = this.apAltTrg;
            SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "Number", this.apAltTrg);
            SimVar.SetSimVarValue("K:AP_ALT_HOLD_ON", "Bool", 0);
            SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "Number", this.apAltTrg);
        } else {
            this.apAlt = false;
            this.apDivAltTrg.innerHTML = "";
            SimVar.SetSimVarValue("K:AP_ALT_HOLD_OFF", "Bool", 0);
        }
        this.apButton(this.apDivAlt, this.apAlt);
    }

    apDivLvlPress() {
        this.apLvl = !this.apLvl;
        if (this.apPower && this.apLvl) {
            SimVar.SetSimVarValue("K:AP_WING_LEVELER_ON", "Bool", 0);
            this.apHdg = true;
            this.apDivHdgPress();
        } else {
            this.apLvl = false;
            SimVar.SetSimVarValue("K:AP_WING_LEVELER_OFF", "Bool", 0);
        }
        this.apButton(this.apDivLvl, this.apLvl);
    }

    apDivPowerPress() {
        this.apPower = !this.apPower;
        if (this.apPower) {
            SimVar.SetSimVarValue("K:AUTOPILOT_ON", "Bool", 0);
        } else {
            SimVar.SetSimVarValue("K:AUTOPILOT_OFF", "Bool", 0);
        }
        this.apHdg = true;
        this.apDivHdgPress();
        this.apAlt = true;
        this.apDivAltPress();
        this.apLvl = true;
        this.apDivLvlPress();
    }

    apButton(button, mode) {
        if (mode) {
            button.style.borderBottom = "solid #0f0 8px";
        } else {
            button.style.borderBottom = "solid #333 8px";
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    onInteractionEvent(_args) {}

    Update() {
        this.update_tablet();
    }

    tablet_init() {
        if (this.tablet_init_complete == null) {
            // App
            this.appCount = 7;
            this.appSelected = 0;
            this.appPrevious = 1;
            this.getChildById("appStartup").classList.add("hidden");
            this.activateApp(0);

            // Checklist
            this.checklistCount = 7;
            this.checklistSelected = 0;
            this.activateChecklist(0);

            // Stats
            this.stat1 = this.getChildById("stat1");
            this.arrStat1 = new Array(120);
            this.stat2 = this.getChildById("stat2");
            this.arrStat2 = new Array(120);
            this.stat3 = this.getChildById("stat3");
            this.arrStat3 = new Array(120);
            this.stat4 = this.getChildById("stat4");
            this.arrStat4 = new Array(120);
            this.stat5 = this.getChildById("stat5");
            this.arrStat5 = new Array(120);
            this.stat6 = this.getChildById("stat6");
            this.arrStat6 = new Array(120);

            // Loadout
            this.selectedL = 0;
            this.selectedR = 0;

            // Auto Pilot
            this.apVs = 2000;
            this.apHdgAct = 0;
            this.apAltAct = 0;
            this.apHdgTrg = 0;
            this.apAltTrg = 0;
            this.apHdg = false;
            this.apAlt = false;
            this.apLvl = false;
            this.apPower = false;
            this.prevApBtnTime = new Date();

            // Settings Hypoxia, default to on
            let Hypoxia_On = GetStoredData("FIS_SPIT_Hypoxia_On");
            Hypoxia_On != "" ? Hypoxia_On = Hypoxia_On == "true" : true;
            SimVar.SetSimVarValue("L:Hypoxia_On", "Bool", Hypoxia_On);
            this.settingsToggleHypoxia.checked = Hypoxia_On;

            // Settings Brightness
            this.appBrightness = this.getChildById("appBrightness");
            let brightness = GetStoredData("FIS_SPIT_Brightness");
            if (brightness != "") {
                brightness = parseFloat(brightness);
            } else {
                brightness = 1.0;
            }
            this.appBrightness.style.opacity = 1.0 - brightness;
            this.drawBarMeter("settingsBrightnessSvg", brightness);

            // Init
            this.tablet_init_complete = true;
        }
    }

    update_tablet() {
        super.Update();
        this.tablet_init();

        if (!this.isStowed) {
            switch (this.appSelected) {
                case 0: // Stowed
                    break;
                case 1: // Checklists
                    break;
                case 2: // V-Speeds
                    break;
                case 3: // Live Data
                    if (this.frame % 2 == 0) {
                        // Speed
                        let IAS = SimVar.GetSimVarValue("A:AIRSPEED INDICATED", "Knots");
                        let TAS = SimVar.GetSimVarValue("A:AIRSPEED TRUE", "Knots");
                        this.GS = SimVar.GetSimVarValue("A:GROUND VELOCITY", "Knots");
                        this.dataSpeed.innerHTML = this.round(this.knotsToMph(IAS), 0) + "<br>" + this.round(this.knotsToMph(TAS), 0) + "<br>" + this.round(this.knotsToMph(this.GS), 0);

                        // Altitude
                        let altitudeIndicated = SimVar.GetSimVarValue("A:INDICATED ALTITUDE", "Feet");
                        let altitudeRadar = SimVar.GetSimVarValue("A:PLANE ALT ABOVE GROUND", "Feet");
                        this.dataAltitude.innerHTML = this.round(altitudeIndicated, 0) + "<br>" + this.round(altitudeRadar - 4.8, 0);

                        // Heading
                        let headingMagnetic = SimVar.GetSimVarValue("A:PLANE HEADING DEGREES MAGNETIC", "Radians");
                        let headingTrue = SimVar.GetSimVarValue("A:PLANE HEADING DEGREES TRUE", "Radians");
                        let headingMagneticTrack = SimVar.GetSimVarValue("A:GPS GROUND MAGNETIC TRACK", "Radians");
                        let headingTrueTrack = SimVar.GetSimVarValue("A:GPS GROUND TRUE TRACK", "Radians");
                        this.dataHeading.innerHTML = this.round(this.radToDeg(headingMagnetic), 1) + "<br>" + this.round(this.radToDeg(headingTrue), 1) + "<br>" + this.round(this.radToDeg(headingMagneticTrack), 1) + "<br>" + this.round(this.radToDeg(headingTrueTrack), 1);

                        // Engines
                        let engineRpm = SimVar.GetSimVarValue("A:GENERAL ENG RPM:1", "Rpm");
                        let engineMp = SimVar.GetSimVarValue("A:ENG MANIFOLD PRESSURE:1", "inHG");
                        let engineBoost = SimVar.GetSimVarValue("A:ENG MANIFOLD PRESSURE:1", "Boost Psi");
                        this.dataEngines.innerHTML = this.round(engineRpm, 0) + "<br>" + this.round(engineMp, 1) + "<br>" + this.round(engineBoost, 1);

                        // Propellers
                        let propBeta = SimVar.GetSimVarValue("A:PROP BETA:1", "Radians");
                        this.dataPropellers.innerHTML = this.round(this.radToDeg(propBeta), 1);

                    } else if (this.frame % 4 == 1) {

                        // Weather
                        let weatherWindDir = SimVar.GetSimVarValue("A:AMBIENT WIND DIRECTION", "Degrees");
                        let weatherWindSpeed = SimVar.GetSimVarValue("A:AMBIENT WIND VELOCITY", "Knots");
                        let weatherTemperature = SimVar.GetSimVarValue("A:AMBIENT TEMPERATURE", "Celsius");
                        let weatherBarometer = SimVar.GetSimVarValue("A:SEA LEVEL PRESSURE", "Millibars");
                        this.dataWeather.innerHTML = this.round(weatherWindDir, 0) + "<br>" + this.round(weatherWindSpeed, 0) + "<br>" + this.round(weatherTemperature, 1) + "<br>" + this.round(this.mbarToInHg(weatherBarometer), 2);

                        // Pressure
                        let pressureOil = SimVar.GetSimVarValue("A:ENG OIL PRESSURE:1", "Pounds per square foot");
                        let pressureFuel = SimVar.GetSimVarValue("A:GENERAL ENG FUEL PRESSURE:1", "Psi");
                        this.dataPressure.innerHTML = this.round(this.psfToPsi(pressureOil), 1) + "<br>" + this.round(pressureFuel, 1);

                        // Temperature

                        // MSFS SimVars
                        // let temperatureOil = SimVar.GetSimVarValue("A:ENG OIL TEMPERATURE:1", "Rankine");
                        // let temperatureRadiator = SimVar.GetSimVarValue("A:RECIP ENG RADIATOR TEMPERATURE:1", "Celsius");
                        // this.dataTemperature.innerHTML = this.round(this.rankToCelc(temperatureOil), 1) + "<br>" + this.round(this.rankToCelc(temperatureRadiator), 1);

                        // WASM LVars
                        let temperatureOil = SimVar.GetSimVarValue("L:OIL TEMPERATURE", "Celsius");
                        let temperatureRadiator = SimVar.GetSimVarValue("L:RADIATOR TEMPERATURE", "Celsius");
                        this.dataTemperature.innerHTML = this.round(temperatureOil, 1) + "<br>" + this.round(temperatureRadiator, 1);

                        // Configuration
                        let cfgGearL = SimVar.GetSimVarValue("A:GEAR LEFT POSITION", "Percent Over 100");
                        let cfgGearR = SimVar.GetSimVarValue("A:GEAR RIGHT POSITION", "Percent Over 100");
                        let cfgFlapsL = SimVar.GetSimVarValue("A:TRAILING EDGE FLAPS LEFT ANGLE", "Radians");
                        let cfgFlapsR = SimVar.GetSimVarValue("A:TRAILING EDGE FLAPS RIGHT ANGLE", "Radians");
                        let cfgElevTrim = SimVar.GetSimVarValue("A:ELEVATOR TRIM PCT", "Percent Over 100");
                        let cfgRuddTrim = SimVar.GetSimVarValue("A:RUDDER TRIM PCT", "Percent Over 100");
                        let cfgParkingBrake = SimVar.GetSimVarValue("A:BRAKE PARKING INDICATOR", "Bool");
                        if (cfgParkingBrake == 0) {
                            cfgParkingBrake = "Off";
                        } else {
                            cfgParkingBrake = "Set";
                        }
                        let cfgDoor = SimVar.GetSimVarValue("L:AIRFRAME_DOOR", "Number");
                        if (cfgDoor > 0.99) {
                            cfgDoor = "Open";
                        } else if (cfgDoor < 0.01) {
                            cfgDoor = "Closed";
                        } else {
                            cfgDoor = "Unlocked";
                        }
                        let cfgCanopy = SimVar.GetSimVarValue("L:AIRFRAME_CanopySlider", "Number");
                        if (cfgCanopy < 0.01) {
                            cfgCanopy = "Closed";
                        } else {
                            cfgCanopy = "Open";
                        }
                        this.dataCfg.innerHTML = this.prcToGear(cfgGearL) + "<br>" + this.prcToGear(cfgGearR) + "<br>" + this.round(this.radToDeg(cfgFlapsL), 0) + "<br>" + this.round(this.radToDeg(cfgFlapsR), 0) + "<br>" + this.round(cfgElevTrim * 100, 1) + "<br>" + this.round(cfgRuddTrim * 100, 1) + "<br>" + cfgParkingBrake + "<br>" + cfgDoor + "<br>" + cfgCanopy;

                    } else if (this.frame % 4 == 3) {

                        // Tanks
                        let tankTotal = SimVar.GetSimVarValue("A:FUEL TOTAL QUANTITY", "Gallons");
                        let tankMain = SimVar.GetSimVarValue("A:FUEL TANK CENTER QUANTITY", "Gallons");
                        let tankDrop = SimVar.GetSimVarValue("A:FUEL TANK EXTERNAL1 QUANTITY", "Gallons");
                        if (SimVar.GetSimVarValue("L:extTankVis", "Bool")) {
                            tankDrop = this.round(tankDrop, 1)
                        } else {
                            tankDrop = "-";
                        }
                        this.dataTanks.innerHTML = this.round(tankTotal, 1) + "<br>" + this.round(tankMain, 1) + "<br>" + tankDrop;

                        // Range
                        let fuelFlow = SimVar.GetSimVarValue("A:ENG FUEL FLOW GPH:1", "Gallons per hour");
                        this.dataRange.innerHTML = this.round(fuelFlow, 1) + "<br>";
                        if (fuelFlow > 0 && this.GS > 50) {
                            let fuelTime = tankTotal / fuelFlow;
                            let rangeNM = fuelTime * this.GS;
                            let rangeM = this.nmToM(rangeNM);
                            let rangeKM = this.nmToKm(rangeNM);
                            let rangeTime = this.formatTime(fuelTime);
                            this.dataRange.innerHTML += this.round(rangeNM, 0) + "<br>" + this.round(rangeM, 0) + "<br>" + this.round(rangeKM, 0) + "<br>" + rangeTime;
                        } else {
                            this.dataRange.innerHTML += "-<br>-<br>-<br>-";
                        }
                    }

                    break;
                case 4: // Stats
                    // Optimized...draw only one graph per frame
                    switch (this.frame % 6) {
                        case 0:
                            this.stat1.innerHTML = this.drawStats(this.arrStat1, "Altitude (ft x 1000)", 40000, 4, 10, 0, 0);
                            break;
                        case 1:
                            this.stat2.innerHTML = this.drawStats(this.arrStat2, "Speed (IAS mph)", 500, 5, 100, 0, 0);
                            break;
                        case 2:
                            this.stat3.innerHTML = this.drawStats(this.arrStat3, "Climbrate (fpm x 1000)", 8000, 8, 1, -4, -4000);
                            break;
                        case 3:
                            this.stat4.innerHTML = this.drawStats(this.arrStat4, "G Force", 20, 4, 5, -10, -10);
                            break;
                        case 4:
                            this.stat5.innerHTML = this.drawStats(this.arrStat5, "RPM (x 1000)", 5000, 5, 1, 0, 0);
                            break;
                        case 5:
                            this.stat6.innerHTML = this.drawStats(this.arrStat6, "Boost", 32, 8, 4, -8, -8);
                            break;
                    }

                    break;
                case 5: // Loadout
                    if (this.frame % 2 == 0) {
                        // Only show loadout buttons if we've stopped on the ground
                        let isOnGround = SimVar.GetSimVarValue("A:SIM ON GROUND", "Bool");
                        let speed = SimVar.GetSimVarValue("A:GROUND VELOCITY", "Knots");
                        if (isOnGround && speed < 3) {
                            this.loadoutButtons.classList.remove("hidden");
                        } else {
                            this.loadoutButtons.classList.add("hidden");
                        }

                        if (this.frame % 6 == 0) {
                            let isNotCutoff = SimVar.GetSimVarValue("L:FUEL_Switch_Cutoff_1", "Number");
                            let selectedTank = SimVar.GetSimVarValue("A:FUEL TANK SELECTOR:1", "Enum");
                            this.drawFuelTank("loadoutTotal", "TOTAL", SimVar.GetSimVarValue("A:FUEL TOTAL QUANTITY", "Gallons"), 177, false, false);
                            this.drawFuelTank("loadoutMain", "MAIN", SimVar.GetSimVarValue("A:FUEL TANK CENTER QUANTITY", "Gallons"), 102, selectedTank == 6 && isNotCutoff, false);
                            this.drawFuelTank("loadoutDrop", "DROP", SimVar.GetSimVarValue("A:FUEL TANK EXTERNAL1 QUANTITY", "Gallons"), 75, selectedTank == 9 && isNotCutoff, false);
                            this.drawFuelTank("oxygenSupply", "OXYGEN", SimVar.GetSimVarValue("L:OXYGEN_quantity", "Number"), 100, false, false);
                        }
                    }

                    break;
                case 6: // Auto Pilot
                    this.apHdgAct = parseInt(this.round(this.radToDeg(SimVar.GetSimVarValue("A:PLANE HEADING DEGREES MAGNETIC", "Radians")), 0));
                    this.apAltAct = parseInt(this.round(SimVar.GetSimVarValue("A:INDICATED ALTITUDE", "Feet"), 0));
                    this.apDivHdgAct.innerHTML = this.apHdgAct;
                    this.apDivAltAct.innerHTML = this.apAltAct;

                    if (this.frame % 2 == 0) {
                        this.apPower = SimVar.GetSimVarValue("A:AUTOPILOT MASTER", "Bool");
                        if (this.apPower) {
                            if (this.apHdg || this.apAlt || this.apLvl) {
                                this.apDivStatus.innerHTML = "ENGAGED";
                            } else {
                                this.apDivStatus.innerHTML = "ON";
                            }
                        } else {
                            this.apDivStatus.innerHTML = "OFF";
                        }
                        this.apButton(this.apDivPower, this.apPower);
                    }

                    break;
                case 7: // Settings
                    if (this.frame % 2 == 0) {
                        // Cockpit Configuration
                        if (this.settingsToggleGunsight.checked != SimVar.GetSimVarValue("L:Gunsight_Vis", "Bool")) {
                            this.settingsToggleGunsight.checked = !this.settingsToggleGunsight.checked;
                        }
                        if (this.settingsToggleYoke.checked == SimVar.GetSimVarValue("L:XMLVAR_YokeHidden1", "Bool")) {
                            this.settingsToggleYoke.checked = !this.settingsToggleYoke.checked;
                        }

                        // Ground Services
                        let isOnGround = SimVar.GetSimVarValue("A:SIM ON GROUND", "Bool");
                        let speed = SimVar.GetSimVarValue("A:GROUND VELOCITY", "Knots");
                        if (isOnGround && speed < 3) {
                            this.settingsGroundServices.classList.remove("hidden");
                        } else {
                            this.settingsGroundServices.classList.add("hidden");
                        }
                    }

                    break;
                default:
                    break;
            }

        }

        // Has a radio button been pressed? If so, set COM1 Active using the button's preset, if available
        if (this.frame % 10 == 0) {
            if (SimVar.GetSimVarValue("L:RADIO_InputA", "Bool") && this.settingsRadioSelected != "A") {
                if (this.settingsRadioChannelA != "") {
                    SimVar.SetSimVarValue("K:COM_RADIO_SET", "Frequency BCD16", parseInt(this.settingsRadioChannelA));
                }
                this.settingsRadioSelected = "A";
            }
            if (SimVar.GetSimVarValue("L:RADIO_InputB", "Bool") && this.settingsRadioSelected != "B") {
                if (this.settingsRadioChannelB != "") {
                    SimVar.SetSimVarValue("K:COM_RADIO_SET", "Frequency BCD16", parseInt(this.settingsRadioChannelB));
                }
                this.settingsRadioSelected = "B";
            }
            if (SimVar.GetSimVarValue("L:RADIO_InputC", "Bool") && this.settingsRadioSelected != "C") {
                if (this.settingsRadioChannelC != "") {
                    SimVar.SetSimVarValue("K:COM_RADIO_SET", "Frequency BCD16", parseInt(this.settingsRadioChannelC));
                }
                this.settingsRadioSelected = "C";
            }
            if (SimVar.GetSimVarValue("L:RADIO_InputD", "Bool") && this.settingsRadioSelected != "D") {
                if (this.settingsRadioChannelD != "") {
                    SimVar.SetSimVarValue("K:COM_RADIO_SET", "Frequency BCD16", parseInt(this.settingsRadioChannelD));
                }
                this.settingsRadioSelected = "D";
            }
        }

        // To stow or not to stow
        if (this.frame % 10 == 0) {
            let showStatus = SimVar.GetSimVarValue("L:TabletAnim", "Number");
            if (this.appSelected > 0 && showStatus == 0) {
                this.appPrevious = this.appSelected;
                this.activateApp(0);
            } else if (this.appSelected == 0 && showStatus == 1) {
                this.activateApp(this.appPrevious);
            }
        }

        // External drag agent
        if (this.frame % 10 == 1) {
            // Setup
            let drag = 0.0;
            // External Drop Tank
            drag += SimVar.GetSimVarValue("L:extTankVis", "Number") * 0.250;
            // Canopy
            let dragCanopy = (SimVar.GetSimVarValue("L:AIRFRAME_CanopySlider", "Number")) * 0.040;
            drag += dragCanopy;
            // Apply
            SimVar.SetSimVarValue("A:LEADING EDGE FLAPS LEFT PERCENT", "Number", drag); // Set drag > MSFS bug: right does not do anything, all LE drag comes from "left". To be safe, add both L and R to each side in case an update fixes this without a mention in the MSFS changelog (pretty much guaranteed aye?)
            SimVar.SetSimVarValue("A:LEADING EDGE FLAPS RIGHT PERCENT", "Number", drag); // Set drag > MSFS bug: right does not do anything, all LE drag comes from "left". To be safe, add both L and R to each side in case an update fixes this without a mention in the MSFS changelog (pretty much guaranteed aye?)
        }

        // Collect stats
        if (new Date() - this.frameStamp > 5000) { // Execute this every 5 seconds
            this.frameStamp = new Date();

            this.arrStat1.shift(); // Remove first element
            this.arrStat1.push(SimVar.GetSimVarValue("A:INDICATED ALTITUDE", "Feet")); // Add new data to the end
            this.arrStat2.shift(); // Remove first element
            this.arrStat2.push(SimVar.GetSimVarValue("A:AIRSPEED INDICATED", "Mph")); // Add new data to the end
            this.arrStat3.shift(); // Remove first element
            this.arrStat3.push(SimVar.GetSimVarValue("A:VERTICAL SPEED", "Feet per minute")); // Add new data to the end
            this.arrStat4.shift(); // Remove first element
            this.arrStat4.push(SimVar.GetSimVarValue("A:G FORCE", "GForce")); // Add new data to the end
            this.arrStat5.shift(); // Remove first element
            this.arrStat5.push(SimVar.GetSimVarValue("A:GENERAL ENG RPM:1", "Rpm")); // Add new data to the end
            this.arrStat6.shift(); // Remove first element
            this.arrStat6.push(SimVar.GetSimVarValue("A:ENG MANIFOLD PRESSURE:1", "Boost Psi")); // Add new data to the end
        }

        // Frame counter
        this.frame += 1;
    }

    // Page activation methods

    activateApp(page) {
        this.appSelected = page;
        for (let i = 0; i <= this.appCount; i++) {
            this.getChildById("appPage" + i).classList.add("hidden");
            if (i > 0) { this.getChildById("appButton" + i).style.color = "" };
        }
        this.getChildById("appPage" + page).classList.remove("hidden");
        if (page > 0) { this.getChildById("appButton" + page).style.color = "#f5ab30" };
    }

    activateChecklist(page) {
        this.checklistSelected = page;
        for (let i = 0; i < this.checklistCount; i++) {
            this.getChildById("checklistPage" + i).classList.add("hidden");
            this.getChildById("checklistButton" + i).style.backgroundColor = "";
        }
        this.getChildById("checklistPage" + page).classList.remove("hidden");
        this.getChildById("checklistButton" + page).style.backgroundColor = "#9b2f25";
    }

    // Helper methods

    round(value, decimals) { return parseFloat(value).toFixed(decimals); }

    rankToCelc(rank) { return (rank - 491.67) * 5 / 9; }

    knotsToMph(knots) { return knots * 1.151; }

    nmToM(nm) { return nm * 1.151; }

    nmToKm(nm) { return nm * 1.852; }

    radToDeg(rad) { return (rad * 57.296) % 360; }

    psfToPsi(psf) { return psf * 0.0069444; }

    mbarToInHg(mbar) { return mbar / 33.864; }

    prcToGear(position) {
        if (position < 0.01) {
            return "UP";
        } else if (position > 0.99) {
            return "DOWN";
        } else {
            return "-";
        }
    }

    bcd16ToMhz(frequency) { return parseInt(frequency).toString(16) / 100 + 100; }

    formatTime(time) {
        let result = "";
        let mm = Math.floor((time % 1) * 60);
        let hh = Math.floor(time);
        if (mm < 10) {
            result = ":0" + mm;
        } else {
            result = ":" + mm;
        }
        if (hh < 10) {
            result = "0" + hh + result;
        } else {
            result = hh + result;
        }
        return result;
    }

    loadoutSet(main, drop, vis) {
        SimVar.SetSimVarValue("A:FUEL TANK CENTER LEVEL", "Percent Over 100", main);
        SimVar.SetSimVarValue("A:FUEL TANK EXTERNAL1 LEVEL", "Percent Over 100", drop);
        SimVar.SetSimVarValue("L:extTankVis", "Bool", vis);
    }

    apGetHdgStep() {
        let currApBtnTime = new Date();
        let delta = currApBtnTime - this.prevApBtnTime;
        this.prevApBtnTime = currApBtnTime;
        let step = 1;
        if (delta < 225) {
            step = 10;
        } else if (delta < 300) {
            step = 5;
        }
        return step;
    }

    apGetAltStep() {
        let currApBtnTime = new Date();
        let delta = currApBtnTime - this.prevApBtnTime;
        this.prevApBtnTime = currApBtnTime;
        let step = 100;
        if (delta < 225) {
            step = 1000;
        } else if (delta < 300) {
            step = 500;
        }
        return step;
    }

    drawFuelTank(id, label, gallons, capacity, isSelected, isCrossfeed) {
        const width = 96;
        const height = 96;
        const labelHeight = 32;
        const barHeight = height - labelHeight;
        const filledHeight = (barHeight - 8) * (gallons / capacity);
        let colorLabelForeground = "fffdf4";
        let colorLabelBackground = "565656";
        if (label == "TOTAL") {
            colorLabelForeground = "1a1a1a";
            colorLabelBackground = "fffdf4";
        } else if (isSelected) {
            colorLabelForeground = "1a1a1a";
            colorLabelBackground = "f5ab30";
        } else if (isCrossfeed) {
            colorLabelForeground = "1a1a1a";
            colorLabelBackground = "aaaaaa";
        }
        let svg = `
            <svg width="${width}" height="${height}">
                <rect x="0" y="0" width="${width}" height="${height}" style="fill: #1a1a1a;" />
                <rect x="4" y="4" width="${width - 8}" height="${labelHeight - 4}" style="fill: #${colorLabelBackground};" />
                <rect x="0" y="${labelHeight}" width="${width}" height="${barHeight}" style="fill: #1a1a1a;" />
                <rect x="4" y="${height - filledHeight - 4}" width="${width - 8}" height="${filledHeight}" style="fill: #9b2f25;" />
                <text x="50%" y="26" text-anchor="middle" fill="#${colorLabelForeground}" style="font: 24px Teko-SemiBold;">${label}</text>
                <text x="50%" y="80" text-anchor="middle" fill="#fffdf4" style="font: 48px Digital;">${this.round(gallons, 0)}</text>
            </svg>
        `
        this.getChildById(id).innerHTML = svg;
    }

    drawBarMeter(id, value) {
        const barWidth = 6;
        const barHeight = 5;
        const barSpacing = 4;
        const height = barHeight * 10;
        let svg = "";
        for (let i = 0; i < 9; i++) {
            let color = "#2a3141";
            if ((i + 2) / 10 - 0.01 >= value) color = "white";
            svg += `
                <rect
                x="${i * (barWidth + barSpacing)}" y="${height - barHeight * (i + 1) - 2}"
                width="${barWidth}" height="${barHeight * (i + 1)}"
                style="fill: ${color}; stroke: #2a3141; stroke-width: 2;"
                />
            `
        }
        this.getChildById(id).innerHTML = svg;
    }

    drawStats(arr, title, yMax, ySegments, yStep, yBaseLabel, yBaseData) {
        const width = 300;
        const height = 240;
        const heightTitle = 32;
        const widthLabel = 48;
        const paddingRight = 16;
        const paddingBottom = 24;
        const widthGraph = width - widthLabel - paddingRight;
        const heightGraph = height - heightTitle - paddingBottom;
        const colorBg = "#fffdf4";
        const color = "#1a1a1a";

        let svg = `
            <svg width="${width}" height="${height}">
                <rect x="0" y="0" width="${width}" height="${height}" style="fill: ${colorBg}; stroke: ${color}; stroke-width: 1;" />
                <rect x="${widthLabel}" y="${heightTitle}" width="${widthGraph}" height="${heightGraph}" style="fill: ${colorBg}; stroke: ${color}; stroke-width: 2;" />
                <text x="50%" y="24" text-anchor="middle" fill="${color}" style="font: 24px Teko-SemiBold;">${title}</text>
                <text x="${widthLabel + widthGraph / 2}" y="${height - 8}" text-anchor="middle" fill="${color}" style="font: 14px Teko-SemiBold;">10 minutes</text>
            `

        // Horizontal lines
        for (let i = 1; i < ySegments; i++) {
            let y = height - paddingBottom - (heightGraph / ySegments) * i;
            svg += `<line x1="${widthLabel}" y1="${y}" x2="${width - paddingRight}" y2="${y}" style="stroke: ${color}; stroke-width: 1;" />`
        }

        // Vertical lines
        for (let i = 1; i < 10; i++) {
            let x = widthLabel + Math.ceil(widthGraph / 10) * i;
            svg += `<line x1="${x}" y1="${heightTitle}" x2="${x}" y2="${height - paddingBottom}" style="stroke: ${color}; stroke-width: 1;" />`
        }

        // Labels vertical axis
        for (let i = 0; i <= ySegments; i++) {
            let y = height - paddingBottom - (heightGraph / ySegments) * i;
            svg += `<text x="${widthLabel - 6}" y="${y + 6}" text-anchor="end" fill="${color}" style="font: 18px Teko-SemiBold;">${i * yStep + yBaseLabel}</text>`
        }

        // Data plot
        const x = widthLabel;
        const y = height - paddingBottom;
        const xScale = widthGraph / arr.length;
        const yScale = heightGraph / yMax;
        svg += `<polyline points="`;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] != null) {
                // Data normalization
                let value = Math.ceil(y - (arr[i] - yBaseData) * yScale);
                if (value < heightTitle) value = heightTitle;
                if (value > y) value = y;
                // Build polyline
                svg += `${Math.ceil(x + i * xScale)},${value} `;
            }
        }
        svg += `" style="fill:none;stroke:${color};stroke-width:3" />`;

        svg += `</svg>`;

        return svg;
    }
}

registerInstrument("tablet-element", tablet_class);