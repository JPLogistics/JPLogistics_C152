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
            if (this.elapsedTime < 3) {
                diffAndSetAttribute(this.welcomeScreen, "state", "on");
                diffAndSetAttribute(this.normalScreen, "state", "off");
                diffAndSetText(this.welcome, "JPLogistics DME System");
                this._msg = "Starting";
                for (let i = 0; i < this.elapsedTime; i++){
                    this._msg += ".";
                }
                diffAndSetText(this.welcomeLow, this._msg);
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
                    if (this.getNavAlive(1)){
                        if (this.getIsSignalOk(1)) {
                            diffAndSetText(this.nav1Distance, this.getDMEDistance(1) + " NM");
                            diffAndSetText(this.nav1Time, this.getDMETime(1) + " Mins");
                        }
                        else {
                            diffAndSetText(this.nav1Time, "--:-- Mins");
                            diffAndSetText(this.nav1Distance, "-- NM");
                        }
                    }
                    else {
                        diffAndSetText(this.nav1Time, "--:-- Mins");
                        diffAndSetText(this.nav1Distance, "-- NM");
                    }
                    //# Nav 2 Script
                    if (this.getNavAlive(2)){
                        if (this.getIsSignalOk(1)) {
                            diffAndSetText(this.nav2Distance, this.getDMEDistance(2) + " NM");
                            diffAndSetText(this.nav2Time, this.getDMETime(2) + " Mins");
                        }
                        else {
                            diffAndSetText(this.nav2Time, "--:-- Mins");
                            diffAndSetText(this.nav2Distance, "-- NM");
                        }
                    }
                    else {
                        diffAndSetText(this.nav2Time, "--:-- Mins");
                        diffAndSetText(this.nav2Distance, "-- NM");
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
        return Math.round(SimVar.GetSimVarValue("NAV DME:" + _num, "Nautical miles") * 10) / 10;
    }
    getDMETime(_num) {
        this.time = (this.getDMEDistance(_num) / SimVar.GetSimVarValue("NAV DMESPEED:" + _num, "Knots")) * 60;
        this.minutes = Math.floor(this.time);
        this.seconds = Math.round((this.time - this.minutes) * 60);
        if (this.seconds < 10) { this.seconds = "0" + this.seconds; }
        if (this.minutes > 99) { this.minutes = 99; this.seconds = 59; }
        return (this.minutes + ":" + this.seconds);
    }
    getNavAlive(_num) {
        return SimVar.GetSimVarValue("CIRCUIT ON:" + _num, "bool");
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
        this.nav1freq = "---.---";
        this.nav2freq = "---.---";
        if (this.getNavAlive(1)){
            this.nav1freq = this.frequency3DigitsFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + 1, "MHz"));
        }
        if (this.getNavAlive(2)){
            this.nav2freq = this.frequency3DigitsFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + 2, "MHz"));
        }
        return  (this.nav1freq + "   " + this.nav2freq);
    }
    getElapsedTime() {
        var seconds = Math.floor((this.elapsedTime / 1000) % 60);
        var minutes = Math.floor(this.elapsedTime / 60000);
        return (minutes > 0 ? fastToFixed(minutes, 0) : "") + " : " + (seconds < 10 ? "0" + fastToFixed(seconds, 0) : fastToFixed(seconds, 0));
    }
    getIsSignalOk(_num) {
        return Simplane.getNavHasNav(_num);
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
