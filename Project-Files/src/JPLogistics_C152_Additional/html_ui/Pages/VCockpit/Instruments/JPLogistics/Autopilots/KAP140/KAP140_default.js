class KAP140 extends BaseInstrument {
    constructor() {
        super();
        this.blinkCounter = 0;
        this.RollMode = 0;
        this.PitchMode = 0;
        this.RightBlockReinitTime = 0;
        this.RightBlockCurrDisplay = 0;
        this.bAvionicsPowerOn = false;
        this.iTestingStep = -1;
        this.fCurrentStepDuration = 0.0;
        this.tTestingStepsTime = [2000, 1200, 3200, 4000, 3200];
        this.BaroMode = 0;
    }
    get templateID() { return "KAP140"; }
    connectedCallback() {
        super.connectedCallback();
        RegisterViewListener("JS_LISTENER_KEYEVENT");
        this.PTDisplay = this.getChildById("PTDisplay");
        this.UPArrow = this.getChildById("UPArrow");
        this.DownArrow = this.getChildById("DownArrow");
        this.APdisplay = this.getChildById("APDisplay");
        this.LeftDisplayTop = this.getChildById("LeftDisplayTop");
        this.LeftDisplayBot = this.getChildById("LeftDisplayBot");
        this.MidDisplayTop = this.getChildById("MidDisplayTop");
        this.MidDisplayBot = this.getChildById("MidDisplayBot");
        this.LeftARM = this.getChildById("ARMLeft");
        this.MidARM = this.getChildById("ARMMid");
        this.RightBlock = this.getChildById("RightBlock");
        this.RightDisplayTop = this.getChildById("RightDisplayTop");
        this.AlertDisplay = this.getChildById("Alert");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
        if (this.isElectricityAvailable()) {
            switch (_args[0]) {
                case "KAP140_Push_AP":
                    let apOn = SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool");
                    SimVar.SetSimVarValue("K:AP_MASTER", "number", 0);
                    if (!apOn) {
                        SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "number", 0);
                        this.RightBlockReinitTime = 3000;
                        this.RightBlockCurrDisplay = 1;
                    }
                    break;
                case "KAP140_Push_HDG":
                    if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool")) {
                        if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool")) {
                            SimVar.SetSimVarValue("K:AP_HDG_HOLD_OFF", "number", 0);
                        }
                        else {
                            SimVar.SetSimVarValue("K:AP_HDG_HOLD_ON", "number", 0);
                        }
                    }
                    break;
                case "KAP140_Push_NAV":
                    if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool")) {
                        SimVar.SetSimVarValue("K:AP_NAV1_HOLD", "number", 0);
                    }
                    break;
                case "KAP140_Push_APR":
                    if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool")) {
                        SimVar.SetSimVarValue("K:AP_APR_HOLD", "number", 0);
                    }
                    break;
                case "KAP140_Push_REV":
                    if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool")) {
                        SimVar.SetSimVarValue("K:AP_BC_HOLD", "number", 0);
                    }
                    break;
                case "KAP140_Push_ALT":
                    if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool")) {
                        if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Bool")) {
                            SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "number", 0);
                            this.RightBlockReinitTime = 3000;
                            this.RightBlockCurrDisplay = 1;
                        }
                        else {
                            SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 0);
                        }
                    }
                    break;
                case "KAP140_Push_UP":
                    if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Bool")) {
                        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet") + 20, false);
                    }
                    else {
                        if (this.RightBlockCurrDisplay != 1) {
                            this.RightBlockCurrDisplay = 1;
                        }
                        else {
                            SimVar.SetSimVarValue("K:AP_VS_VAR_INC", "number", 0);
                        }
                        this.RightBlockReinitTime = 3000;
                    }
                    break;
                case "KAP140_Push_DN":
                    if (!SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Bool")) {
                        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet") - 20, false);
                    }
                    else {
                        if (this.RightBlockCurrDisplay != 1) {
                            this.RightBlockCurrDisplay = 1;
                        }
                        else {
                            SimVar.SetSimVarValue("K:AP_VS_VAR_DEC", "number", 0);
                        }
                        this.RightBlockReinitTime = 3000;
                    }
                    break;
                case "KAP140_Push_BARO":
                    this.RightBlockReinitTime = 3000;
                    this.RightBlockCurrDisplay = 2;
                    break;
                case "KAP140_Long_Push_BARO":
                    this.RightBlockReinitTime = 3000;
                    this.RightBlockCurrDisplay = 2;
                    this.BaroMode = 1 - this.BaroMode;
                    break;
                case "KAP140_Push_ARM":
                    break;
                case "KAP140_Knob_Outer_INC":
                case "KAP140_Knob_Outer_DEC":
                case "KAP140_Knob_Inner_INC":
                case "KAP140_Knob_Inner_DEC":
                    if (this.RightBlockCurrDisplay == 1) {
                        this.RightBlockReinitTime = 0;
                        this.RightBlockCurrDisplay = 0;
                    }
                    if (this.RightBlockCurrDisplay == 2) {
                        this.RightBlockReinitTime = 3000;
                        switch (_args[0]) {
                            case "KAP140_Knob_Inner_INC":
                            case "KAP140_Knob_Outer_INC":
                                SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", 2);
                                break;
                            case "KAP140_Knob_Outer_DEC":
                            case "KAP140_Knob_Inner_DEC":
                                SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", 2);
                                break;
                        }
                    }
                    else {
                        switch (_args[0]) {
                            case "KAP140_Knob_Outer_INC":
                                SimVar.SetSimVarValue("K:AP_ALT_VAR_INC", "number", 1000);
                                break;
                            case "KAP140_Knob_Outer_DEC":
                                SimVar.SetSimVarValue("K:AP_ALT_VAR_DEC", "number", 1000);
                                break;
                            case "KAP140_Knob_Inner_INC":
                                SimVar.SetSimVarValue("K:AP_ALT_VAR_INC", "number", 100);
                                break;
                            case "KAP140_Knob_Inner_DEC":
                                SimVar.SetSimVarValue("K:AP_ALT_VAR_DEC", "number", 100);
                                break;
                        }
                    }
                    break;
            }
        }
    }
    Update() {
        super.Update();
        if (this.isElectricityAvailable()) {
            this.blinkCounter = (this.blinkCounter + this.deltaTime) % 1000000;
            if (!this.bAvionicsPowerOn) {
                this.bAvionicsPowerOn = true;
                this.iTestingStep = 0;
                this.fCurrentStepDuration = this.tTestingStepsTime[this.iTestingStep] + Math.random() * 500;
                LaunchFlowEvent("AUTOPILOT_PREFLIGHT_CHECK_START");
                SimVar.SetSimVarValue("L:AutopilotPreflightCheckCompleted", "Boolean", 0);
            }
            else {
                if (this.iTestingStep >= 0) {
                    this.fCurrentStepDuration -= this.deltaTime;
                    if (this.fCurrentStepDuration <= 0.0) {
                        this.fCurrentStepDuration = this.tTestingStepsTime[this.iTestingStep++] + Math.random() * 500;
                        if (this.iTestingStep >= this.tTestingStepsTime.length) {
                            this.iTestingStep = -1;
                            LaunchFlowEvent("AUTOPILOT_PREFLIGHT_CHECK_OVER");
                            SimVar.SetSimVarValue("L:AutopilotPreflightCheckCompleted", "Boolean", 1);
                            this.HideEveryDisplay();
                            this.RightDisplayTop.style.visibility = "visible";
                            this.LeftDisplayTop.style.visibility = "visible";
                            this.LeftDisplayBot.style.visibility = "visible";
                            this.MidDisplayTop.style.visibility = "visible";
                            this.MidDisplayBot.style.visibility = "visible";
                            this.RightDisplayTop.style.visibility = "visible";
                            this.RightDisplayTop.classList.remove("alignLeft");
                        }
                    }
                }
            }
            if (this.iTestingStep == this.tTestingStepsTime.length - 1) {
                this.ShowEveryDisplay();
                diffAndSetText(this.LeftDisplayTop, "888");
                diffAndSetText(this.LeftDisplayBot, "888");
                diffAndSetText(this.MidDisplayTop, "888");
                diffAndSetText(this.MidDisplayBot, "888");
                diffAndSetText(this.RightDisplayTop, "88.888");
                return;
            }
            else if (this.iTestingStep > -1) {
                this.HideEveryDisplay();
                this.MidDisplayTop.style.visibility = "visible";
                diffAndSetText(this.MidDisplayTop, "PFT");
                this.RightDisplayTop.style.visibility = "visible";
                diffAndSetText(this.RightDisplayTop, fastToFixed((this.iTestingStep + 1), 0));
                this.RightDisplayTop.classList.add("alignLeft");
                return;
            }
            if (this.isAutopilotEngaged()) {
                this.APdisplay.style.visibility = "visible";
            }
            else {
                this.APdisplay.style.visibility = "hidden";
            }
            diffAndSetText(this.LeftDisplayTop, this.getActiveRollMode());
            var armedRoll = this.getArmedRollMode();
            diffAndSetText(this.LeftDisplayBot, armedRoll);
            if (armedRoll) {
                this.LeftARM.style.visibility = "visible";
            }
            else {
                this.LeftARM.style.visibility = "hidden";
            }
            diffAndSetText(this.MidDisplayTop, this.getActivePitchMode());
            var armedPitch = this.getArmedPitchMode();
            diffAndSetText(this.MidDisplayBot, armedPitch);
            if (armedPitch) {
                this.MidARM.style.visibility = "visible";
            }
            else {
                this.MidARM.style.visibility = "hidden";
            }
            SimVar.SetSimVarValue("L:KAP140_BARO_Display", "Bool", this.RightBlockCurrDisplay == 2 ? 1 : 0);
            if (this.RightBlockReinitTime > 0) {
                this.RightBlockReinitTime -= this.deltaTime;
                if (this.RightBlockReinitTime <= 0) {
                    this.RightBlockReinitTime = 0;
                    this.RightBlockCurrDisplay = 0;
                }
                else if (this.RightBlockCurrDisplay == 1) {
                    diffAndSetAttribute(this.RightBlock, "state", "FPM");
                    diffAndSetText(this.RightDisplayTop, this.getVerticalSpeedSelected());
                }
                else if (this.RightBlockCurrDisplay == 2) {
                    if (this.BaroMode == 0) {
                        diffAndSetAttribute(this.RightBlock, "state", "HPA");
                        diffAndSetText(this.RightDisplayTop, this.getBaroHPa());
                    }
                    else {
                        diffAndSetAttribute(this.RightBlock, "state", "INHG");
                        diffAndSetText(this.RightDisplayTop, this.getBaroInHg());
                    }
                }
            }
            if (this.RightBlockCurrDisplay == 0) {
                diffAndSetAttribute(this.RightBlock, "state", "FT");
                diffAndSetText(this.RightDisplayTop, this.getAltitudeSelected());
            }
            var differenceToObj = this.getAltitudeDifference();
            if (differenceToObj >= 200 && differenceToObj <= 1000) {
                this.AlertDisplay.style.visibility = "visible";
            }
            else {
                this.AlertDisplay.style.visibility = "hidden";
            }
            var pitchMode = this.getActivePitchMode();
            var neededTrim = this.getNeededTrim();
            var hidden = (this.blinkGetState(600, 300) ? false : true);
            if (neededTrim < -100 && pitchMode != "") {
                this.PTDisplay.classList.toggle('hide', hidden);
                this.UPArrow.classList.toggle('hide', hidden);
                this.DownArrow.style.visibility = "hidden";
            }
            else if (neededTrim > 100 && pitchMode != "") {
                this.PTDisplay.classList.toggle('hide', hidden);
                this.UPArrow.style.visibility = "hidden";
                this.DownArrow.classList.toggle('hide', hidden);
            }
            else {
                this.PTDisplay.style.visibility = "hidden";
                this.UPArrow.style.visibility = "hidden";
                this.DownArrow.style.visibility = "hidden";
            }
        }
        else {
            if (this.bAvionicsPowerOn) {
                this.HideEveryDisplay();
                this.bAvionicsPowerOn = false;
            }
        }
    }
    HideEveryDisplay() {
        this.LeftDisplayTop.style.visibility = "hidden";
        this.LeftDisplayBot.style.visibility = "hidden";
        this.MidDisplayTop.style.visibility = "hidden";
        this.MidDisplayBot.style.visibility = "hidden";
        this.RightDisplayTop.style.visibility = "hidden";
        this.APdisplay.style.visibility = "hidden";
        this.LeftARM.style.visibility = "hidden";
        this.MidARM.style.visibility = "hidden";
        this.AlertDisplay.style.visibility = "hidden";
        this.PTDisplay.style.visibility = "hidden";
        this.UPArrow.style.visibility = "hidden";
        this.DownArrow.style.visibility = "hidden";
        diffAndSetAttribute(this.RightBlock, "state", "NONE");
    }
    ShowEveryDisplay() {
        this.LeftDisplayTop.style.visibility = "visible";
        this.LeftDisplayBot.style.visibility = "visible";
        this.MidDisplayTop.style.visibility = "visible";
        this.MidDisplayBot.style.visibility = "visible";
        this.RightDisplayTop.style.visibility = "visible";
        this.APdisplay.style.visibility = "visible";
        this.LeftARM.style.visibility = "visible";
        this.MidARM.style.visibility = "visible";
        this.AlertDisplay.style.visibility = "visible";
        this.PTDisplay.style.visibility = "visible";
        this.UPArrow.style.visibility = "visible";
        this.DownArrow.style.visibility = "visible";
        diffAndSetAttribute(this.RightBlock, "state", "ALL");
    }
    isAutopilotEngaged() {
        return SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool");
    }
    getActiveRollMode() {
        if (SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool")) {
            this.RollMode = 1;
            return "ROL";
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool")) {
            this.RollMode = 2;
            return "HDG";
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Bool")) {
            this.RollMode = 3;
            return "NAV";
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Bool")) {
            this.RollMode = 4;
            return "REV";
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Bool")) {
            this.RollMode = 5;
            return "APR";
        }
        this.RollMode = 0;
        return "";
    }
    getArmedRollMode() {
        if (!SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool") && !SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool")) {
            return "";
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Bool")) {
            return "NAV";
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Bool")) {
            return "REV";
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Bool")) {
            return "APR";
        }
        return "";
    }
    getActivePitchMode() {
        if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ACTIVE", "Boolean")) {
            this.PitchMode = 3;
            return "GS";
        }
        if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Bool")) {
            this.PitchMode = 1;
            return "VS";
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Bool")) {
            this.PitchMode = 2;
            return "ALT";
        }
        this.PitchMode = 0;
        return "";
    }
    getArmedPitchMode() {
        if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ARM", "Boolean")) {
            return "GS";
        }
        if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Bool")) {
            return "ALT";
        }
        return "";
    }
    getAltitudeSelected() {
        return (fastToFixed(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet"), 0)).replace(/\d+(?=(\d{3}))/, '$&,');
    }
    getVerticalSpeedSelected() {
        return (fastToFixed(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet/minute"), 0)).replace(/\d+(?=(\d{3}))/, '$&,');
    }
    getBaroHPa() {
        return (fastToFixed(SimVar.GetSimVarValue("KOHLSMAN SETTING MB:2", "Millibars"), 0)).replace(/\d+(?=(\d{3}))/, '$&,');
    }
    getBaroInHg() {
        return fastToFixed(SimVar.GetSimVarValue("KOHLSMAN SETTING HG:2", "inHg"), 3);
    }
    getAltitudeDifference() {
        return Math.abs(SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet") - SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet"));
    }
    getNeededTrim() {
        var refVSpeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute");
        var currVSpeed = SimVar.GetSimVarValue("VELOCITY WORLD Y", "feet per minute");
        return currVSpeed - refVSpeed;
    }
    blinkGetState(_blinkPeriod, _duration) {
        return Math.round(this.blinkCounter / _duration) % (_blinkPeriod / _duration) == 0;
    }
}
registerInstrument("kap140-element", KAP140);
//# sourceMappingURL=KAP140.js.map