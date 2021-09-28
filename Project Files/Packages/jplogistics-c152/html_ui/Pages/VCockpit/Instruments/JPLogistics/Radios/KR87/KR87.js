class KR87 extends BaseInstrument {
    constructor() {
        super();
        this.AntMode = false;
        this.BfoMode = false;
        this.RightDisplayMode = 0;
        this.chronoStarted = false;
        this.chronoValue = 0;
    }
    get templateID() { return "KR87"; }
    connectedCallback() {
        super.connectedCallback();
        this.ANTAnnunciator = this.getChildById("ANTModeAnnunc");
        this.ADFAnnunciator = this.getChildById("ADFModeAnnunc");
        this.InUseFrequency = this.getChildById("InUseFrequency");
        this.BfoModeAnnunciator = this.getChildById("BFOModeAnnunc");
        this.StbyFreqAnnunciator = this.getChildById("StbyFrequencyModeAnnunc");
        this.FltAnnunciator = this.getChildById("FLTModeAnnunc");
        this.EtAnnunciator = this.getChildById("ETModeAnnunc");
        this.RightDisplay = this.getChildById("RightDisplay");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
        if (this.isElectricityAvailable()) {
            if (_args[0] == "adf_AntAdf") {
                this.AntMode = !this.AntMode;
            }
            else if (_args[0] == "adf_bfo") {
                this.BfoMode = !this.BfoMode;
            }
            else if (_args[0] == "adf_frqTransfert") {
                if (this.RightDisplayMode != 0) {
                    this.RightDisplayMode = 0;
                }
                else {
                    SimVar.SetSimVarValue("K:ADF1_RADIO_SWAP", "Boolean", 0);
                }
            }
            else if (_args[0] == "adf_FltEt") {
                if (this.RightDisplayMode == 1) {
                    this.RightDisplayMode = 2;
                }
                else {
                    this.RightDisplayMode = 1;
                }
            }
            else if (_args[0] == "adf_SetRst") {
                if (this.RightDisplayMode == 2) {
                    if (this.chronoStarted) {
                        this.chronoStarted = false;
                    }
                    else if (this.chronoValue > 0) {
                        this.chronoValue = 0;
                    }
                    else {
                        this.chronoStarted = true;
                    }
                }
            }
        }
    }
    Update() {
        super.Update();
        if (this.isElectricityAvailable()) {
            if (this.chronoStarted) {
                this.chronoValue += this.deltaTime / 1000;
            }
            if (this.AntMode == false) {
                diffAndSetText(this.ADFAnnunciator, "ADF");
                diffAndSetText(this.ANTAnnunciator, "");
            }
            else {
                diffAndSetText(this.ADFAnnunciator, "");
                diffAndSetText(this.ANTAnnunciator, "ANT");
            }
            diffAndSetText(this.InUseFrequency, this.getActiveFrequency());
            if (this.BfoMode == true) {
                diffAndSetText(this.BfoModeAnnunciator, "BFO");
            }
            else {
                diffAndSetText(this.BfoModeAnnunciator, "");
            }
            if (this.RightDisplayMode == 0) {
                diffAndSetText(this.RightDisplay, this.getStbyFrequency());
                diffAndSetText(this.StbyFreqAnnunciator, "FRQ");
                diffAndSetText(this.FltAnnunciator, "");
                diffAndSetText(this.EtAnnunciator, "");
            }
            else if (this.RightDisplayMode == 1) {
                diffAndSetText(this.RightDisplay, this.getFlightTime());
                diffAndSetText(this.StbyFreqAnnunciator, "");
                diffAndSetText(this.FltAnnunciator, "FLT");
                diffAndSetText(this.EtAnnunciator, "");
            }
            else if (this.RightDisplayMode == 2) {
                diffAndSetText(this.RightDisplay, this.getChronoTime());
                diffAndSetText(this.StbyFreqAnnunciator, "");
                diffAndSetText(this.FltAnnunciator, "");
                diffAndSetText(this.EtAnnunciator, "ET");
            }
        }
        else {
            diffAndSetText(this.ADFAnnunciator, "");
            diffAndSetText(this.ANTAnnunciator, "");
            diffAndSetText(this.InUseFrequency, "");
            diffAndSetText(this.BfoModeAnnunciator, "");
            diffAndSetText(this.RightDisplay, "");
            diffAndSetText(this.StbyFreqAnnunciator, "");
            diffAndSetText(this.FltAnnunciator, "");
            diffAndSetText(this.EtAnnunciator, "");
        }
    }	
    frequency1DigitsFormat(_num) {
        var freq = Math.round(_num * 100 - 0.1) / 100;
        return fastToFixed(freq, 1);
    }	
    getActiveFrequency() {
        var value = SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz");
        if (value) {
            return this.frequency1DigitsFormat(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz"));
        }
        return "";
    }
    getStbyFrequency() {
        var value = SimVar.GetSimVarValue("ADF STANDBY FREQUENCY:1", "KHz");
        if (value) {
            return this.frequency1DigitsFormat(SimVar.GetSimVarValue("ADF STANDBY FREQUENCY:1", "KHz"));
        }
        return "";
    }
    getFlightTime() {
        var value = SimVar.GetGameVarValue("FLIGHT DURATION", "seconds");
        if (value) {
            var time = Utils.SecondsToDisplayTime(value, true, false, false);
            return time + '';
        }
        return "";
    }
    getChronoTime() {
        var totalSeconds = this.chronoValue;
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
        var seconds = Math.floor(totalSeconds - (minutes * 60) - (hours * 3600));
        var time = "";
        if (hours == 0) {
            if (minutes < 10)
                time += "0";
            time += minutes;
            time += ":";
            if (seconds < 10)
                time += "0";
            time += seconds;
        }
        else {
            if (hours < 10)
                time += "0";
            time += hours;
            time += ":";
            if (minutes < 10)
                time += "0";
            time += minutes;
        }
        return time + '';
    }
}
registerInstrument("kr87-element", KR87);
//# sourceMappingURL=KR87.js.map