class JPLDME extends BaseInstrument {
    constructor() {
        super();
        this.initTime = 0;
        this.elapsedTime = 0;
        this.nav1Error = false;
        this.nav2Error = false;
    }
    get templateID() { return "JPLDME"; }
    connectedCallback() {
        //# General
        super.connectedCallback();
        //#Screens
        this.welcomeScreen = this.getChildById("WelcomeScreen");
        this.lowBScreen = this.getChildById("LowBScreen");
        this.normalScreen = this.getChildById("NormalScreen");
        this.welcome = this.getChildById("Welcome");
        this.welcomeLow = this.getChildById("WelcomeLow");
        this.lowBattery = this.getChildById("LowBattery");
        this.navActiveFreq = this.getChildById("NavActiveFreq");
        //# Nav 1
        this.nav1Distance = this.getChildById("Nav1Distance");
        this.nav1Time = this.getChildById("Nav1Time");
        this.nav1ErrorMsg = this.getChildById("Nav1ErrorMsg");
        //# Nav 2
        this.nav2Distance = this.getChildById("Nav2Distance");
        this.nav2Time = this.getChildById("Nav2Time");
        this.nav2ErrorMsg = this.getChildById("Nav2ErrorMsg");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    Update() {
        super.Update();
        if (this.isElectricityAvailable()) {
            if (this.initTime == 0) {
                this.initTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
            }
            this.elapsedTime = (SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") - this.initTime);
            //# Calculate Everything
            //# General

            //# Nav 1 Script
            if (this.getIsSignalOk(1)) {
                if (this.isLocalizer(1)) {
                    this.nav1Error = true;
                }
                else {
                    this.nav1Error = false;
                }
            }
            else {
                this.nav1Error = true;
            }

            //# Nav 2 Script
            /*if (this.getIsSignalOk(2)) {
                if (this.isLocalizer(2)) {
                    this.nav2Error = true;
                }
                else {
                    this.nav2Error = false;
                }
            }
            else {
                this.nav2Error = true;
            }*/

            //# General
            if (this.elapsedTime < 3) {
                diffAndSetAttribute(this.welcomeScreen, "state", "on");
                diffAndSetAttribute(this.normalScreen, "state", "off");
                diffAndSetText(this.welcome, "JPLogistics DME System");
                diffAndSetText(this.welcomeLow, "Starting...");
            }
            else {
                diffAndSetAttribute(this.welcomeScreen, "state", "off");
                if (this.lowBatteryCheck()) {
                    diffAndSetAttribute(this.normalScreen, "state", "off");
                    diffAndSetAttribute(this.lowBScreen, "state", "on");
                }
                else {
                    diffAndSetAttribute(this.lowBScreen, "state", "off");
                    diffAndSetAttribute(this.normalScreen, "state", "on");
                    diffAndSetText(this.navActiveFreq, this.getActiveNavFreq());
                    //# Nav 1 Script
                    if (this.nav1Error) {
                        diffAndSetText(this.nav1Time, "--:-- Mins");
                        diffAndSetText(this.nav1Distance, "-- NM");
                    }
                    else {
                        diffAndSetText(this.nav1Distance, this.getDMEDistance(1) + " NM");
                        //diffAndSetText(this.nav2Time, this.getDMETime(1) + " Mins");
                        diffAndSetText(this.nav1Time, "05:00 Mins");
                    }
                    //# Nav 2 Script
                    if (this.nav2Error) {
                        diffAndSetText(this.nav2Time, "--:-- Mins");
                        diffAndSetText(this.nav2Distance, "-- NM");
                    }
                    else {
                        diffAndSetText(this.nav2Distance, this.getDMEDistance(2) + " NM");
                        //diffAndSetText(this.nav2Time, this.getDMETime(2) + " Mins");
                        diffAndSetText(this.nav2Time, "05:00 Mins");
                    }
                }
            }
        }
        else {
            this.initTime = 0;
            this.elapsedTime = 0;
            this.nav1Error = false;
            this.nav2Error = false;
            //# General
            //diffAndSetText(this.welcome, "");
            //diffAndSetText(this.lowBattery, "");
        }
    }
    getDMEDistance(_num) {
        return Math.round(SimVar.GetSimVarValue("NAV DME:" + _num, "nautical mile") * 10) / 10;
    }
    lowBatteryCheck() {
        if (SimVar.GetSimVarValue("ELECTRICAL BATTERY VOLTAGE", "volt") > 21.6) {
            return false;
        }
        else {
            return true;
        }
    }
    frequency2DigitsFormat(_num) {
        var freq = Math.round(_num * 100 - 0.1) / 100;
        return fastToFixed(freq, 2);
    }
    frequency3DigitsFormat(_num) {
        var freq = Math.round(_num * 1000 - 0.1) / 1000;
        return fastToFixed(freq, 3);
    }
    getActiveNavFreq() {
        return this.frequency3DigitsFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + 1, "MHz")) + "   " + this.frequency3DigitsFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + 2, "MHz"));
    }
    getElapsedTime() {
        var seconds = Math.floor((this.elapsedTime / 1000) % 60);
        var minutes = Math.floor(this.elapsedTime / 60000);
        return (minutes > 0 ? fastToFixed(minutes, 0) : "") + " : " + (seconds < 10 ? "0" + fastToFixed(seconds, 0) : fastToFixed(seconds, 0));
    }
    getIsSignalOk() {
        return Simplane.getNavHasNav();
    }
    isLocalizer(_num) {
        return SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + _num, "Bool");
    }
    blinkGetState(_blinkPeriod, _duration) {
        return Math.round(Date.now() / _duration) % (_blinkPeriod / _duration) == 0;
    }
}
registerInstrument("jpldme-element1", JPLDME);
//# sourceMappingURL=KX155A.js.map