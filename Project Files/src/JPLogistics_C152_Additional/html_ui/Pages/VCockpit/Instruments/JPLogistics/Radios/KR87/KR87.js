class KR87 extends BaseInstrument {
    constructor() {
        super();
        this.AntMode = false;
        this.BfoMode = false;
        this.RightDisplayMode = 0;
        this.chronoStarted = false;
        this.chronoValue = 0;
		// mod for intercept
        this.handleKeyIntercepted = (key) => {
            switch (key) {
            case 'ADF1_RADIO_SWAP':
                this.onADFswap(1);
                break;
            }
        };
    }
    get templateID() {
        return "KR87";
    }
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
		this.Ident = this.getChildById("Ident");
		// mod for intercept
        this.keyListener = RegisterViewListener('JS_LISTENER_KEYEVENT', () => {
            this.setupKeyIntercepts();
            Coherent.on('keyIntercepted', this.handleKeyIntercepted);
        });
    } // END CONNECTED CALLBACK
	
	// mod for intercept
    setupKeyIntercepts() {
        Coherent.call('INTERCEPT_KEY_EVENT', 'ADF1_RADIO_SWAP', 0);
    }
	// mod for intercept
    onADFswap(index) {
		clearInterval(this.timer);
		SimVar.SetSimVarValue("K:ADF_COMPLETE_SET", "number", Number(this.adfActive2));
		SimVar.SetSimVarValue("K:ADF2_COMPLETE_SET", "number", Number(this.adfActive1));
		this.timer = window.setInterval(adfCount, 2200);
		function adfCount() {
			if (SimVar.GetSimVarValue("ADF SIGNAL:1", "number") == 0 && SimVar.GetSimVarValue("CIRCUIT ON:37", "bool") == 1) {
				SimVar.SetSimVarValue("K:ADF1_RADIO_TENTHS_INC", "number", 0);
			}
		}
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
        if (this.isElectricityAvailable()) {
            if (_args[0] == "adf_AntAdf") {
                this.AntMode = !this.AntMode;
            } else if (_args[0] == "adf_bfo") {
                this.BfoMode = !this.BfoMode;
            } else if (_args[0] == "adf_frqTransfert") {
                if (this.RightDisplayMode != 0) {
                    this.RightDisplayMode = 0;
                } else {
					clearInterval(this.timer);
					SimVar.SetSimVarValue("K:ADF_COMPLETE_SET", "number", Number(this.adfActive2));
					SimVar.SetSimVarValue("K:ADF2_COMPLETE_SET", "number", Number(this.adfActive1));
					this.timer = window.setInterval(adfCount, 2200);
					function adfCount() {
						if (SimVar.GetSimVarValue("ADF SIGNAL:1", "number") == 0 && SimVar.GetSimVarValue("CIRCUIT ON:37", "bool") == 1) {
							SimVar.SetSimVarValue("K:ADF1_RADIO_TENTHS_INC", "number", 0);
						}
					}
                }
            } else if (_args[0] == "adf_FltEt") {
                if (this.RightDisplayMode == 1) {
                    this.RightDisplayMode = 2;
                } else {
                    this.RightDisplayMode = 1;
                }
            } else if (_args[0] == "adf_SetRst") {
                if (this.RightDisplayMode == 2) {
                    if (this.chronoStarted) {
                        this.chronoStarted = false;
                    } else if (this.chronoValue > 0) {
                        this.chronoValue = 0;
                    } else {
                        this.chronoStarted = true;
                    }
                }
            }
        }
    }
    Update() {
        super.Update();
        if (this.isElectricityAvailable()) {

			SimVar.SetSimVarValue("L:ADF1_TEMP", "KHz", Math.floor(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz")));
			SimVar.SetSimVarValue("L:ADF2_TEMP", "KHz", Math.floor(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:2", "KHz")));
			this.adfActive1 = SimVar.GetSimVarValue("L:ADF1_TEMP", "Frequency ADF BCD32");
			this.adfActive2 = SimVar.GetSimVarValue("L:ADF2_TEMP", "Frequency ADF BCD32");

            if (this.chronoStarted) {
                this.chronoValue += this.deltaTime / 1000;
            }
            if (this.AntMode == false) {
                this.ADFAnnunciator.textContent = "ADF";
                this.ANTAnnunciator.textContent = "";
				SimVar.SetSimVarValue("L:XMLVAR_ADF_MODE_SEL", "number", 2);
            } else {
                this.ADFAnnunciator.textContent = "";
                this.ANTAnnunciator.textContent = "ANT";
				SimVar.SetSimVarValue("L:XMLVAR_ADF_MODE_SEL", "number", 3);
            }
            this.InUseFrequency.textContent = this.getActiveFrequency();
			this.Ident.textContent = this.getIdent();
            if (this.BfoMode == true) {
                this.BfoModeAnnunciator.textContent = "BFO";
            } else {
                this.BfoModeAnnunciator.textContent = "";
            }
            if (this.RightDisplayMode == 0) {
                this.RightDisplay.textContent = this.getStbyFrequency();
                this.StbyFreqAnnunciator.textContent = "FRQ";
                this.FltAnnunciator.textContent = "";
                this.EtAnnunciator.textContent = "";
            } else if (this.RightDisplayMode == 1) {
                this.RightDisplay.textContent = this.getFlightTime();
                this.StbyFreqAnnunciator.textContent = "";
                this.FltAnnunciator.textContent = "FLT";
                this.EtAnnunciator.textContent = "";
            } else if (this.RightDisplayMode == 2) {
                this.RightDisplay.textContent = this.getChronoTime();
                this.StbyFreqAnnunciator.textContent = "";
                this.FltAnnunciator.textContent = "";
                this.EtAnnunciator.textContent = "ET";
            }
        } else {
            this.ADFAnnunciator.textContent = "";
            this.ANTAnnunciator.textContent = "";
            this.InUseFrequency.textContent = "";
            this.BfoModeAnnunciator.textContent = "";
            this.RightDisplay.textContent = "";
            this.StbyFreqAnnunciator.textContent = "";
            this.FltAnnunciator.textContent = "";
            this.EtAnnunciator.textContent = "";
        }
    }
	/*
    frequency1DigitsFormat(_num) {
        var freq = Math.round(_num * 100 - 0.1) / 100;
        return fastToFixed(freq, 1);
    }
    frequency0DigitsFormat(_num) {
        var freq = Math.trunc(_num * 100 - 0.1) / 100;
        return fastToFixed(freq, 0);
    }
	*/
	getIdent() {
		var value = SimVar.GetSimVarValue("ADF IDENT:1", "string");
		if (SimVar.GetSimVarValue("ADF SIGNAL:1", "number") > 1) {
			if (value) {
				return value + '';
			}
		}
        return "";
	}
	// return Math.floor(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz"));
    getActiveFrequency() {
        var value = SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz");
        if (value) {
            return Math.floor(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz"));
        }
        return "";
    }
    getStbyFrequency() {
        var value = SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:2", "KHz");
        if (value) {
            return Math.floor(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:2", "KHz"));
        }
        return "";
    }
    getFlightTime() {
        var value = SimVar.GetGameVarValue("FLIGHT DURATION", "seconds");
        if (value) {
            var time = Utils.SecondsToDisplayTime(value, true, false, false);
            return time.toString();
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
        } else {
            if (hours < 10)
                time += "0";
            time += hours;
            time += ":";
            if (minutes < 10)
                time += "0";
            time += minutes;
        }
        return time.toString();
    }
}
registerInstrument("kr87-element", KR87);
//# sourceMappingURL=KR87.js.map
