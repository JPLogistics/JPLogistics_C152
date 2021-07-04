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
            if (this.getIsSignalOk(2)) {
                if (this.isLocalizer(2)) {
                    this.nav2Error = true;
                }
                else {
                    this.nav2Error = false;
                }
            }
            else {
                this.nav2Error = true;
            }


            //# General
            if (this.elapsedTime < 10) {
                diffAndSetText(this.welcome, "JPLogistics DME System");
                diffAndSetText(this.welcomeLow, "Starting...");
                this.welcome.style.visibility = "visible";
                this.welcomeLow.style.visibility = "visible";
            }
            else {
                this.welcome.style.visibility = "hidden";
                this.welcomeLow.style.visibility = "hidden";
                if (this.lowBatteryCheck()) {
                    this.lowBattery.style.visibility = "visible";
                    this.navActiveFreq.style.visibility = "hidden";
                }
                else {
                    this.navActiveFreq.style.visibility = "visible";
                    diffAndSetText(this.navActiveFreq, this.getActiveNavFreq());
                    this.lowBattery.style.visibility = "hidden";
                    //# Nav 1 Script
                    if (this.nav1Error) {
                        this.nav1Time.style.visibility = "hidden";
                        this.nav1Distance.style.visibility = "hidden";
                        this.nav1ErrorMsg.style.visibility = "visible";
                    }
                    else {
                        this.nav1Time.style.visibility = "visible";
                        this.nav1Distance.style.visibility = "visible";
                        this.nav1ErrorMsg.style.visibility = "hidden";
                        diffAndSetText(this.nav1Distance, this.getDMEDistance(1) + " NM");
                        //diffAndSetText(this.nav1Time, this.getDMETime(1) + " Mins");
                        diffAndSetText(this.nav1Time, "05:00 Mins");
                    }
                    //# Nav 2 Script
                    if (this.nav2Error) {
                        this.nav2Time.style.visibility = "hidden";
                        this.nav2Distance.style.visibility = "hidden"
                        this.nav2ErrorMsg.style.visibility = "visible";
                    }
                    else {
                        this.nav2Time.style.visibility = "visible";
                        this.nav2Distance.style.visibility = "visible";
                        this.nav2ErrorMsg.style.visibility = "hidden";
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
        return this.frequency3DigitsFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + 1, "MHz")) + "<br />" + this.frequency3DigitsFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + 2, "MHz"));
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