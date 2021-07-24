class KX155A extends BaseInstrument {
    constructor() {
        super();
        this.navMode = 0;
        this.elapsedTime = 0;
        this.blinkingElapsedTime = 0;
        this.revertElapsed = false;
        this.editElapsed = false;
        this.radioIndex = 1;
        this.chanelSelectionTimer = 0;
        this.navDirectActiveInput = false;
        this.navKnobPulled = false;
        this.selectedStorageIndex = 1;
        this.comKnobState = 0;
        this.comdirectActiveinput = false;
        this.comKnobPulled = false;
        this.comVolume = 0;
        this.lastTimeVolumeKnobUsed = 0;
    }
    get templateID() { return "KX155A"; }
    connectedCallback() {
        super.connectedCallback();
        this.comActiveFreq = this.getChildById("ComActiveFreq");
        this.comStandbyFreq = this.getChildById("ComStandbyFreq");
        this.comState = this.getChildById("ComState");
        this.channelState = this.getChildById("ChannelState");
        this.channelNumber = this.getChildById("ChannelNumber");
        this.cavActiveFreq = this.getChildById("NavActiveFreq");
        this.obs = this.getChildById("OBS");
        this.navRightDisplay = this.getChildById("NavRightDisplay");
        this.navState = this.getChildById("NavState");
        this.navBotDisplayLeft = this.getChildById("NavBotDisplayLeft");
        this.navBotDisplayMid = this.getChildById("NavBotDisplayMid");
        this.navBotDisplayRight = this.getChildById("NavBotDisplayRight");
        this.cdiCursor = this.getChildById("CDICursor");
        this.COMVolume = this.getChildById("COMVolume");
        this.barVolume = this.getChildById("BarVolume");
        var parsedUrl = new URL(this.getAttribute("Url"));
        let index = parsedUrl.searchParams.get("Index");
        if (index)
            this.radioIndex = parseInt(index);
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    Init() {
        super.Init();
        if (SimVar.GetSimVarValue("COM SPACING MODE:" + this.radioIndex, "Enum") == 0) {
            SimVar.SetSimVarValue("K:COM_" + this.radioIndex + "_SPACING_MODE_SWITCH", "number", 0);
        }
        this.comVolume = this.getComVolume();
    }
    parseXMLConfig() {
        super.parseXMLConfig();
        if (this.instrumentXmlConfig) {
            let display = this.instrumentXmlConfig.getElementsByTagName("Display");
            if (display.length > 0) {
                diffAndSetAttribute(this, "display", display[0].textContent.toLowerCase());
            }
        }
    }
    onInteractionEvent(_args) {
        if (this.isElectricityAvailable()) {
            switch (_args[0]) {
                case "RADIO" + this.radioIndex + "_NAV_Mode_Push":
                    this.navMode = (this.navMode + 1) % 5;
                    break;
                case "RADIO" + this.radioIndex + "_COM_Btn_Channel_Fast":
                    if (this.comKnobState == 0) {
                        this.comKnobState = 3;
                        this.chanelSelectionTimer = 5000;
                        this.selectedStorageIndex = 1;
                        var count = 32;
                        do {
                            this.selectedStorageIndex = (this.selectedStorageIndex % 32) + 1;
                            count--;
                        } while (SimVar.GetSimVarValue("COM" + this.radioIndex + " STORED FREQUENCY:" + this.selectedStorageIndex, "Megahertz") == 0 && count > 0);
                    }
                    else {
                        this.comKnobState = 0;
                    }
                    break;
                case "RADIO" + this.radioIndex + "_COM_Btn_Channel_Long":
                    this.selectedStorageIndex = 1;
                    this.comKnobState = 1;
                    break;
                case "RADIO" + this.radioIndex + "_COM_Knob_Small_PUSH":
                    this.comKnobPulled = !this.comKnobPulled;
                    break;
                case "RADIO" + this.radioIndex + "_COM_Knob_Small_INC":
                    switch (this.comKnobState) {
                        case 0:
                            SimVar.SetSimVarValue("K:COM" + (this.radioIndex == 1 ? "" : "2") + (this.comdirectActiveinput ? "" : "_STBY") + "_RADIO_SET_HZ", "Hz", this.activeComModify(SimVar.GetSimVarValue("COM " + (this.comdirectActiveinput ? "ACTIVE" : "STANDBY") + " FREQUENCY:" + this.radioIndex, "Hz"), this.comKnobPulled ? 8333 : 16666));
                            break;
                        case 1:
                            this.selectedStorageIndex = (this.selectedStorageIndex % 32) + 1;
                            break;
                        case 2:
                            SimVar.SetSimVarValue("K:COM" + this.radioIndex + "_STORED_FREQUENCY_INDEX_SET", "number", this.selectedStorageIndex);
                            SimVar.SetSimVarValue("K:COM" + this.radioIndex + "_STORED_FREQUENCY_SET_HZ", "Hz", this.storedComModify(SimVar.GetSimVarValue("COM" + this.radioIndex + " STORED FREQUENCY:" + this.selectedStorageIndex, "Hertz"), this.comKnobPulled ? 8333 : 16666));
                            break;
                        case 3:
                            var count = 32;
                            this.chanelSelectionTimer = 5000;
                            do {
                                this.selectedStorageIndex = (this.selectedStorageIndex % 32) + 1;
                                count--;
                            } while (SimVar.GetSimVarValue("COM" + this.radioIndex + " STORED FREQUENCY:" + this.selectedStorageIndex, "Megahertz") == 0 && count > 0);
                    }
                    break;
                case "RADIO" + this.radioIndex + "_COM_Knob_Small_DEC":
                    switch (this.comKnobState) {
                        case 0:
                            SimVar.SetSimVarValue("K:COM" + (this.radioIndex == 1 ? "" : "2") + (this.comdirectActiveinput ? "" : "_STBY") + "_RADIO_SET_HZ", "Hz", this.activeComModify(SimVar.GetSimVarValue("COM " + (this.comdirectActiveinput ? "ACTIVE" : "STANDBY") + " FREQUENCY:" + this.radioIndex, "Hz"), this.comKnobPulled ? -8333 : 16666));
                        case 1:
                            this.selectedStorageIndex = (this.selectedStorageIndex + 30) % 32 + 1;
                            break;
                        case 2:
                            SimVar.SetSimVarValue("K:COM" + this.radioIndex + "_STORED_FREQUENCY_INDEX_SET", "number", this.selectedStorageIndex);
                            SimVar.SetSimVarValue("K:COM" + this.radioIndex + "_STORED_FREQUENCY_SET_HZ", "Hz", this.storedComModify(SimVar.GetSimVarValue("COM" + this.radioIndex + " STORED FREQUENCY:" + this.selectedStorageIndex, "Hertz"), this.comKnobPulled ? -8333 : 16666));
                            break;
                        case 3:
                            var count = 32;
                            this.chanelSelectionTimer = 5000;
                            do {
                                this.selectedStorageIndex = (this.selectedStorageIndex + 30) % 32 + 1;
                                count--;
                            } while (SimVar.GetSimVarValue("COM" + this.radioIndex + " STORED FREQUENCY:" + this.selectedStorageIndex, "Megahertz") == 0 && count > 0);
                    }
                    break;
                case "RADIO" + this.radioIndex + "_COM_Knob_Large_INC":
                    switch (this.comKnobState) {
                        case 0:
                            if (this.comdirectActiveinput) {
                                SimVar.SetSimVarValue("K:COM" + (this.radioIndex == 1 ? "" : "2") + "_RADIO_SET_HZ", "Hz", this.activeComModify(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:" + this.radioIndex, "Hz"), 1000000));
                            }
                            else {
                                SimVar.SetSimVarValue("K:COM" + (this.radioIndex == 1 ? "" : "2") + "_RADIO_WHOLE_INC", "number", 0);
                                break;
                            }
                        case 2:
                            SimVar.SetSimVarValue("K:COM" + this.radioIndex + "_STORED_FREQUENCY_INDEX_SET", "number", this.selectedStorageIndex);
                            SimVar.SetSimVarValue("K:COM" + this.radioIndex + "_STORED_FREQUENCY_SET_HZ", "Hz", this.storedComModify(SimVar.GetSimVarValue("COM" + this.radioIndex + " STORED FREQUENCY:" + this.selectedStorageIndex, "Hertz"), 1000000));
                            break;
                    }
                    break;
                case "RADIO" + this.radioIndex + "_COM_Knob_Large_DEC":
                    switch (this.comKnobState) {
                        case 0:
                            if (this.comdirectActiveinput) {
                                SimVar.SetSimVarValue("K:COM" + (this.radioIndex == 1 ? "" : "2") + "_RADIO_SET_HZ", "Hz", this.activeComModify(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:" + this.radioIndex, "Hz"), -1000000));
                            }
                            else {
                                SimVar.SetSimVarValue("K:COM" + (this.radioIndex == 1 ? "" : "2") + "_RADIO_WHOLE_DEC", "number", 0);
                                break;
                            }
                        case 2:
                            SimVar.SetSimVarValue("K:COM" + this.radioIndex + "_STORED_FREQUENCY_INDEX_SET", "number", this.selectedStorageIndex);
                            SimVar.SetSimVarValue("K:COM" + this.radioIndex + "_STORED_FREQUENCY_SET_HZ", "Hz", this.storedComModify(SimVar.GetSimVarValue("COM" + this.radioIndex + " STORED FREQUENCY:" + this.selectedStorageIndex, "Hertz"), -1000000));
                            break;
                    }
                    break;
                case "RADIO" + this.radioIndex + "_COM_Swap_Fast":
                    if (this.comdirectActiveinput) {
                        this.comdirectActiveinput = false;
                    }
                    else {
                        switch (this.comKnobState) {
                            case 0:
                                SimVar.SetSimVarValue("K:COM" + (this.radioIndex == 1 ? "_STBY" : "2") + "_RADIO_SWAP", "number", 0);
                                break;
                            case 1:
                                this.comKnobState = 2;
                                break;
                        }
                    }
                    break;
                case "RADIO" + this.radioIndex + "_COM_Swap_Long":
                    this.comdirectActiveinput = !this.comdirectActiveinput;
                    break;
                case "RADIO" + this.radioIndex + "_NAV_Swap_Fast":
                    if (this.navMode == 4 && this.editElapsed) {
                        this.editElapsed = false;
                        this.revertElapsed = true;
                    }
                    else {
                        SimVar.SetSimVarValue("K:NAV" + this.radioIndex + "_RADIO_SWAP", "number", 0);
                    }
                    break;
                case "RADIO" + this.radioIndex + "_NAV_Swap_Long":
                    switch (this.navMode) {
                        case 0:
                            this.navDirectActiveInput = !this.navDirectActiveInput;
                        case 4:
                            this.elapsedTime = 0;
                            this.editElapsed = true;
                    }
                    break;
                case "RADIO" + this.radioIndex + "_NAV_Knob_Small_INC":
                    if (this.navMode == 1 && this.navKnobPulled) {
                        SimVar.SetSimVarValue("K:VOR" + this.radioIndex + "_OBI_INC", "number", 0);
                    }
                    else if (this.navMode == 4 && this.editElapsed) {
                        if (this.navKnobPulled) {
                            this.elapsedTime += 1000;
                            if (this.elapsedTime % 10000 == 0) {
                                this.elapsedTime -= 10000;
                            }
                        }
                        else {
                            this.elapsedTime += 10000;
                            if ((this.elapsedTime - (this.elapsedTime % 10000)) % 60000 == 0) {
                                this.elapsedTime -= 60000;
                            }
                        }
                    }
                    else {
                        SimVar.SetSimVarValue("K:NAV" + this.radioIndex + (this.navMode != 0 || this.navDirectActiveInput ? "_RADIO" : "_STBY") + "_SET_HZ", "Hz", this.navModify(SimVar.GetSimVarValue("NAV " + (this.navMode != 0 || this.navDirectActiveInput ? "ACTIVE" : "STANDBY") + " FREQUENCY:" + this.radioIndex, "Hz"), 50000));
                    }
                    break;
                case "RADIO" + this.radioIndex + "_NAV_Knob_Small_DEC":
                    if (this.navMode == 1 && this.navKnobPulled) {
                        SimVar.SetSimVarValue("K:VOR" + this.radioIndex + "_OBI_DEC", "number", 0);
                        SimVar.SetSimVarValue("K:VOR" + this.radioIndex + "_OBI_DEC", "number", 0);
                    }
                    else if (this.navMode == 4 && this.editElapsed) {
                        if (this.navKnobPulled) {
                            this.elapsedTime -= 1000;
                            if (this.elapsedTime % 10000 == 9000 || this.elapsedTime < 0) {
                                this.elapsedTime += 10000;
                            }
                        }
                        else {
                            this.elapsedTime -= 10000;
                            if ((this.elapsedTime - (this.elapsedTime % 10000)) % 60000 == 50000 || this.elapsedTime < 0) {
                                this.elapsedTime += 60000;
                            }
                        }
                    }
                    else {
                        SimVar.SetSimVarValue("K:NAV" + this.radioIndex + (this.navMode != 0 || this.navDirectActiveInput ? "_RADIO" : "_STBY") + "_SET_HZ", "Hz", this.navModify(SimVar.GetSimVarValue("NAV " + (this.navMode != 0 || this.navDirectActiveInput ? "ACTIVE" : "STANDBY") + " FREQUENCY:" + this.radioIndex, "Hz"), -50000));
                    }
                    break;
                case "RADIO" + this.radioIndex + "_NAV_Knob_Large_INC":
                    if (this.navMode == 4 && this.editElapsed) {
                        this.elapsedTime += 60000;
                        if (this.elapsedTime > 5999000) {
                            this.elapsedTime -= 6000000;
                        }
                    }
                    else {
                        SimVar.SetSimVarValue("K:NAV" + this.radioIndex + (this.navMode != 0 || this.navDirectActiveInput ? "_RADIO" : "_STBY") + "_SET_HZ", "Hz", this.navModify(SimVar.GetSimVarValue("NAV " + (this.navMode != 0 || this.navDirectActiveInput ? "ACTIVE" : "STANDBY") + " FREQUENCY:" + this.radioIndex, "Hz"), 1000000));
                    }
                    break;
                case "RADIO" + this.radioIndex + "_NAV_Knob_Large_DEC":
                    if (this.navMode == 4 && this.editElapsed) {
                        this.elapsedTime -= 60000;
                        if (this.elapsedTime < 0) {
                            this.elapsedTime += 6000000;
                        }
                    }
                    else {
                        SimVar.SetSimVarValue("K:NAV" + this.radioIndex + (this.navMode != 0 || this.navDirectActiveInput ? "_RADIO" : "_STBY") + "_SET_HZ", "Hz", this.navModify(SimVar.GetSimVarValue("NAV " + (this.navMode != 0 || this.navDirectActiveInput ? "ACTIVE" : "STANDBY") + " FREQUENCY:" + this.radioIndex, "Hz"), -1000000));
                    }
                    break;
                case "RADIO" + this.radioIndex + "_NAV_Knob_Small_PUSH":
                    this.navKnobPulled = !this.navKnobPulled;
                    break;
            }
        }
    }
    Update() {
        super.Update();
        let timeOfDay = SimVar.GetSimVarValue("E:TIME OF DAY", "Enum");
        this.setAttribute("brightness", timeOfDay == 3 ? "night" : "day");
        diffAndSetAttribute(this, "brightness", timeOfDay == 3 ? "night" : "day");
        if (this.isElectricityAvailable()) {
            if (this.blinkingElapsedTime > 0) {
                this.blinkingElapsedTime -= this.deltaTime;
            }
            if (!this.editElapsed) {
                if (this.revertElapsed) {
                    this.elapsedTime -= this.deltaTime;
                    if (this.elapsedTime <= 0) {
                        this.elapsedTime = 0;
                        this.revertElapsed = false;
                        this.blinkingElapsedTime = 15000;
                    }
                }
                else {
                    this.elapsedTime += this.deltaTime;
                }
            }
            if (this.comKnobState == 3) {
                this.chanelSelectionTimer -= this.deltaTime;
                if (this.chanelSelectionTimer <= 0) {
                    this.chanelSelectionTimer = 0;
                    var freq = SimVar.GetSimVarValue("COM" + this.radioIndex + " STORED FREQUENCY HZ:" + this.selectedStorageIndex, "Hz");
                    if (freq != 0) {
                        SimVar.SetSimVarValue("K:COM" + (this.radioIndex == 1 ? "" : this.radioIndex) + "_STBY_RADIO_SET_HZ", "Hz", freq);
                    }
                    this.comKnobState = 0;
                }
            }
            diffAndSetText(this.comActiveFreq, this.getActiveComFreq());
            if (this.comKnobState == 0) {
                if (this.comdirectActiveinput) {
                    diffAndSetText(this.comStandbyFreq, "");
                }
                else {
                    diffAndSetText(this.comStandbyFreq, this.getStandbyComFreq());
                }
                diffAndSetText(this.channelNumber, "");
                diffAndSetAttribute(this.channelState, "state", "");
                diffAndSetAttribute(this.comStandbyFreq, "state", "Blink");
            }
            else {
                diffAndSetText(this.comStandbyFreq, this.getStoredFrequency(this.selectedStorageIndex));
                diffAndSetText(this.channelNumber, this.selectedStorageIndex + '');
                if (this.comKnobState == 3) {
                    diffAndSetAttribute(this.channelState, "state", "CH");
                }
                else {
                    diffAndSetAttribute(this.channelState, "state", "PG");
                }
                if (this.comKnobState == 1) {
                    diffAndSetAttribute(this.channelNumber, "state", (this.blinkGetState(400, 200) ? "Blink" : "Off"));
                }
                else {
                    diffAndSetAttribute(this.channelNumber, "state", "Blink");
                }
                if (this.comKnobState == 2) {
                    diffAndSetAttribute(this.comStandbyFreq, "state", (this.blinkGetState(400, 200) ? "Blink" : "Off"));
                }
                else {
                    diffAndSetAttribute(this.comStandbyFreq, "state", "Blink");
                }
            }
            diffAndSetAttribute(this.comState, "state", this.getTransmitingState());
            if (this.getComVolume() != this.comVolume) {
                this.comVolume = this.getComVolume();
                this.COMVolume.setAttribute("combar", "visible");
                this.lastTimeVolumeKnobUsed = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
                this.barVolume.setAttribute("width", fastToFixed(this.comVolume * 100 / 4, 0));
                this.COMVolume.children[0].setAttribute("x", "0");
            }
            if (SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds") - this.lastTimeVolumeKnobUsed > 1.5) {
                this.COMVolume.setAttribute("combar", "hidden");
            }
            diffAndSetText(this.cavActiveFreq, this.getActiveNavFreq());
            switch (this.navMode) {
                case 0:
                    diffAndSetAttribute(this.navState, "state", "none");
                    if (this.navDirectActiveInput) {
                        diffAndSetText(this.navRightDisplay, "");
                    }
                    else {
                        diffAndSetText(this.navRightDisplay, this.getStandbyNavFreq());
                    }
                    this.obs.style.visibility = "hidden";
                    diffAndSetText(this.navBotDisplayLeft, "");
                    diffAndSetText(this.navBotDisplayMid, "");
                    diffAndSetText(this.navBotDisplayRight, "");
                    this.cdiCursor.style.visibility = "hidden";
                    break;
                case 1:
                    diffAndSetAttribute(this.navState, "state", "none");
                    diffAndSetText(this.navRightDisplay, this.getObs());
                    if (this.navKnobPulled) {
                        this.obs.style.visibility = (this.blinkGetState(400, 200)) ? "visible" : "hidden";
                    }
                    else {
                        this.obs.style.visibility = "hidden";
                    }
                    if (this.getIsSignalOk()) {
                        if (this.isLocalizer()) {
                            diffAndSetText(this.navRightDisplay, "LOC");
                            this.obs.style.visibility = "hidden";
                            diffAndSetText(this.navBotDisplayMid, "><");
                        }
                        else {
                            if (this.getNavDir() == 1) {
                                diffAndSetText(this.navBotDisplayMid, "^");
                            }
                            else {
                                diffAndSetText(this.navBotDisplayMid, "v");
                            }
                        }
                        diffAndSetText(this.navBotDisplayLeft, "- --  --  --  --");
                        diffAndSetAttribute(this.cdiCursor, "style", "left:" + (this.getCDIPos() * 50 / 127 + 50) + "%");
                    }
                    else {
                        diffAndSetText(this.navBotDisplayLeft, "FLAG");
                        this.cdiCursor.style.visibility = "hidden";
                        diffAndSetText(this.navBotDisplayMid, "");
                    }
                    diffAndSetText(this.navBotDisplayRight, " --  --  --  --  -");
                    break;
                case 2:
                    diffAndSetAttribute(this.navState, "state", "TO");
                    if (this.getIsSignalOk()) {
                        diffAndSetText(this.navRightDisplay, this.getBearing());
                    }
                    else {
                        diffAndSetText(this.navRightDisplay, "---");
                    }
                    this.obs.style.visibility = "hidden";
                    diffAndSetText(this.navBotDisplayLeft, "");
                    diffAndSetText(this.navBotDisplayMid, "");
                    diffAndSetText(this.navBotDisplayRight, "");
                    this.cdiCursor.style.visibility = "hidden";
                    break;
                case 3:
                    diffAndSetAttribute(this.navState, "state", "FR");
                    if (this.getIsSignalOk()) {
                        diffAndSetText(this.navRightDisplay, this.getRadial());
                    }
                    else {
                        diffAndSetText(this.navRightDisplay, "---");
                    }
                    diffAndSetText(this.navRightDisplay, this.getRadial());
                    this.obs.style.visibility = "hidden";
                    diffAndSetText(this.navBotDisplayLeft, "");
                    diffAndSetText(this.navBotDisplayMid, "");
                    diffAndSetText(this.navBotDisplayRight, "");
                    this.cdiCursor.style.visibility = "hidden";
                    break;
                case 4:
                    this.obs.style.visibility = "hidden";
                    if (this.editElapsed && this.blinkGetState(600, 300)) {
                        diffAndSetAttribute(this.navState, "state", "None");
                    }
                    else {
                        diffAndSetAttribute(this.navState, "state", "ET");
                    }
                    if (this.blinkingElapsedTime > 0 && this.blinkGetState(1000, 500)) {
                        diffAndSetText(this.navRightDisplay, "");
                    }
                    else {
                        diffAndSetText(this.navRightDisplay, this.getElapsedTime());
                    }
                    diffAndSetText(this.navBotDisplayLeft, "");
                    diffAndSetText(this.navBotDisplayMid, "");
                    diffAndSetText(this.navBotDisplayRight, "");
                    this.cdiCursor.style.visibility = "hidden";
                    break;
            }
        }
        else {
            this.elapsedTime = 0;
            this.revertElapsed = false;
            this.blinkingElapsedTime = 0;
            diffAndSetText(this.comActiveFreq, "");
            diffAndSetText(this.comStandbyFreq, "");
            diffAndSetAttribute(this.comState, "state", "none");
            diffAndSetAttribute(this.channelState, "state", "none");
            diffAndSetText(this.channelNumber, "");
            diffAndSetText(this.cavActiveFreq, "");
            this.obs.style.visibility = "hidden";
            diffAndSetText(this.navRightDisplay, "");
            diffAndSetAttribute(this.navState, "state", "none");
            diffAndSetText(this.navBotDisplayLeft, "");
            diffAndSetText(this.navBotDisplayMid, "");
            diffAndSetText(this.navBotDisplayRight, "");
            this.cdiCursor.style.visibility = "hidden";
        }
    }
    getActiveComFreq() {
        return this.frequency3DigitsFormat(SimVar.GetSimVarValue("COM ACTIVE FREQUENCY:" + this.radioIndex, "MHz"));
    }
    getStandbyComFreq() {
        return this.frequency3DigitsFormat(SimVar.GetSimVarValue("COM STANDBY FREQUENCY:" + this.radioIndex, "MHz"));
    }
    getComVolume() {
        return SimVar.GetSimVarValue("COM VOLUME:" + this.radioIndex, "number");
    }
    getTransmitingState() {
        if (SimVar.GetSimVarValue("SPEAKER ACTIVE:" + this.radioIndex, "Bool")) {
            if (SimVar.GetSimVarValue("PILOT TRANSMITTING:" + this.radioIndex, "Bool") || SimVar.GetSimVarValue("COPILOT TRANSMITTING:" + this.radioIndex, "Bool")) {
                return "both";
            }
            else {
                return "R";
            }
        }
        else {
            if (SimVar.GetSimVarValue("PILOT TRANSMITTING:" + this.radioIndex, "Bool") || SimVar.GetSimVarValue("COPILOT TRANSMITTING:" + this.radioIndex, "Bool")) {
                return "T";
            }
            else {
                return "none";
            }
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
        return this.frequency2DigitsFormat(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:" + this.radioIndex, "MHz"));
    }
    getStandbyNavFreq() {
        return this.frequency2DigitsFormat(SimVar.GetSimVarValue("NAV STANDBY FREQUENCY:" + this.radioIndex, "MHz"));
    }
    getCDIPos() {
        return SimVar.GetSimVarValue("NAV CDI:" + this.radioIndex, "number");
    }
    getElapsedTime() {
        var seconds = Math.floor((this.elapsedTime / 1000) % 60);
        var minutes = Math.floor(this.elapsedTime / 60000);
        return (minutes > 0 ? fastToFixed(minutes, 0) : "") + " : " + (seconds < 10 ? "0" + fastToFixed(seconds, 0) : fastToFixed(seconds, 0));
    }
    getIsSignalOk() {
        return Simplane.getNavHasNav(this.radioIndex);
    }
    getNavDir() {
        return SimVar.GetSimVarValue("NAV TOFROM:" + this.radioIndex, "Enum");
    }
    getObs() {
        return SimVar.GetSimVarValue("NAV OBS:" + this.radioIndex, "degrees");
    }
    isLocalizer() {
        return SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + this.radioIndex, "Bool");
    }
    getBearing() {
        var bearing = (SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC:" + this.radioIndex, "degrees") + SimVar.GetSimVarValue("NAV RELATIVE BEARING TO STATION:" + this.radioIndex, "degrees") % 360);
        if (bearing < 0) {
            bearing += 360;
        }
        return fastToFixed(bearing, 0);
    }
    getRadial() {
        return fastToFixed(SimVar.GetSimVarValue("NAV RADIAL:" + this.radioIndex, "degrees"), 0);
    }
    navModify(_baseFreq, _toAdd) {
        if (_baseFreq + _toAdd >= 117950000) {
            return 108000000;
        }
        else if (_baseFreq + _toAdd < 108000000) {
            return 117950000;
        }
        else {
            return _baseFreq + _toAdd;
        }
    }
    activeComModify(_baseFreq, _toAdd) {
        if (_baseFreq + _toAdd >= 137000000) {
            return 118000000;
        }
        else if (_baseFreq + _toAdd < 118000000) {
            return 137000000 + _toAdd;
        }
        else {
            return _baseFreq + _toAdd;
        }
    }
    storedComModify(_baseFreq, _toAdd) {
        if (_baseFreq == 0) {
            return (_toAdd < 0 ? 137000000 + _toAdd : 118000000);
        }
        else {
            if (_baseFreq + _toAdd >= 137000000 || _baseFreq + _toAdd < 118000000) {
                return 0;
            }
            else {
                return _baseFreq + _toAdd;
            }
        }
    }
    getStoredFrequency(_index) {
        var freq = SimVar.GetSimVarValue("COM" + this.radioIndex + " STORED FREQUENCY:" + this.selectedStorageIndex, "Megahertz");
        if (freq == 0) {
            return "---";
        }
        else {
            return this.frequency2DigitsFormat(freq);
        }
    }
    blinkGetState(_blinkPeriod, _duration) {
        return Math.round(Date.now() / _duration) % (_blinkPeriod / _duration) == 0;
    }
}
registerInstrument("kx155a-element", KX155A);
//# sourceMappingURL=KX155A.js.map