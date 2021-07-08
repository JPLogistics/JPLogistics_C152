class JPLEFB extends BaseInstrument {
    constructor() {
        super();
        this.initTime = 0;
        this.elapsedTime = 0;
    }
    get templateID() { return "JPLEFB"; }
    connectedCallback() {
        //# General
        super.connectedCallback();
        //# Screens
        this.welcomeScreen = this.getChildById("WelcomeScreen");
        this.settingsScreen = this.getChildById("SettingsScreen");
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

            //# General
            if (this.elapsedTime < 3) {
                diffAndSetAttribute(this.welcomeScreen, "state", "on");
                diffAndSetAttribute(this.settingsScreen, "state", "off");
                diffAndSetText(this.welcome, "JPLogistics EFB System");
                this.msg = "Starting";
                for (let i = 0; i < this.elapsedTime; i++) {
                    this.msg += ".";
                }
                diffAndSetText(this.welcomeLow, this.msg);
            }
        }
    }
}
registerInstrument("jplefb-element1", EFB);