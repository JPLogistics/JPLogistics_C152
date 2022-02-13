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
        // this.tTestingStepsTime = [2000, 1200, 3200, 4000, 3200];
		this.tTestingStepsTime = [500, 300, 800, 1000, 800];
        this.BaroMode = 0;
        // Whether altitude preselect has been armed.
        this.AltitudeArmed = false;
        this.AltitudeChangingTo = -1;
        this.AltitudeChanging = false;
        // The value of the altitude alerter. Note that the display on the KAP140 is an altitude alert display, not an altitude selection display. It just so happens that on some models/installations you can have it hold at the altitude shown in the display. When altitude preselect has been armed, the value shown in the display will be copied as the altitude selection.
        this.AltitudeAlerterAltitude = 0;
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
    forceVSCapture() {
        // When autopilot is enabled, capture that vertical speed and allow the plane to travel that direction forever.
        var fpm = SimVar.GetSimVarValue("VERTICAL SPEED", "feet per second") * 60;
        fpm = this.getValidatedVS(fpm);
        // 64k feet ought to be enough for everybody
        // More seriously, the max height in the sim is 275k and the min height is ???. The autopilot can't be set to ranges outside of U16, apparently:
        // https://forum.simflight.com/topic/70702-help-with-altitude-hold/?do=findComment&comment=437414
        // Basically, just work around the fact that you can't actually set a pure vertical speed mode. Instead, we use a workaround of setting a height that is obviously too high or too low.
        //SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "number", 60000 * (fpm > 0 ? 1 : 0));
        // MC use a more reasonable value
        SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "number", this.getReasonableAltitudeValue() * (fpm > 0 ? 1 : 0));
        SimVar.SetSimVarValue("K:AP_VS_VAR_SET_ENGLISH", "number", fpm);
        SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "number", 0);
        this.AltitudeArmed = false;
    }
    getValidatedVS(currVSpeed) {
        // what happens in real AP when vs is outside of limits?
        // VS limits could be dependant on aircraft type:
        if (currVSpeed < -1500.0) {
            currVSpeed = -1500;
        }
        if (currVSpeed > 700.0) {
            currVSpeed = 700;
        }
        return currVSpeed; 
    }    
    getReasonableAltitudeValue() {
        return SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet") + 1000;
    }
    onInteractionEvent(_args) {
        if (this.isElectricityAvailable()) {
            switch (_args[0]) {
                case "KAP140_Push_AP":
                    let apOn = SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool");
                    SimVar.SetSimVarValue("K:AP_MASTER", "number", 0);
                    if (!apOn) {
                        this.forceVSCapture();
                        this.RightBlockReinitTime = 3000;
                        this.RightBlockCurrDisplay = 1;
                    } else {
                        this.AltitudeArmed = false;
                    }
                    break;
                case "KAP140_Push_HDG":
                    //if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool")) { // MC pressing HDG actually engages autopilot and puts it in HDG mode
                        if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool")) {
                            SimVar.SetSimVarValue("K:AP_HDG_HOLD_OFF", "number", 0);
                        }
                        else {
							if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool") == 0) {
								SimVar.SetSimVarValue("K:AP_MASTER", "number", 0);
							}
                            SimVar.SetSimVarValue("K:AP_HDG_HOLD_ON", "number", 0);
                        }
                    // } // MC 
                    break;
                case "KAP140_Push_NAV":
                    if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool")) {
                        SimVar.SetSimVarValue("K:AP_NAV1_HOLD", "number", 0);
                    }
                    break;
                case "KAP140_Push_APR":
                    // TODO disable altitude arm when this happens.                
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
                            var fpm = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet/minute");
                            //SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "number", 60000 * (fpm > 0 ? 1 : 0));
                            // MC use a more reasonable value
                            SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "number", this.getReasonableAltitudeValue() * (fpm > 0 ? 1 : 0));               
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
                    if (this.AltitudeChanging || !SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Bool")) {
                        // MC Coherent.call seems to occaionally command massive vertical speed increases leading to stall
                        // replaced with hackish logic with the idea that some functionality is better than none
                        // (even if it does not match real KAP140)
                        //Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet") + 20, false);
                        // MC since we can't increase altitude by 20 ft, instead increasing by 100
                        // if button is pressed again while previously commanded climb is still ongoing,
                        // add another 100 ft to requested altitude
                        if(this.AltitudeChanging){
                            this.AltitudeChangingTo = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet") + 100;
                            if(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet/minute") <= 0 &&  this.AltitudeChangingTo >= SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet")) {
                                this.AltitudeChanging = false;
                                SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 0);
                                break;
                            }                              
                        }
                        else{
                            this.AltitudeChangingTo = SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet") + 100;
                            SimVar.SetSimVarValue("K:AP_VS_VAR_SET_ENGLISH", "number", 500);
                            SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "number", 0);
                            this.RightBlockReinitTime = 3000;
                            this.RightBlockCurrDisplay = 1;
                            this.AltitudeChanging = true;
                        }
                        SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "number", this.AltitudeChangingTo);
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
                    if (this.AltitudeChanging || !SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Bool")) {
                        // MC Coherent.call seems to occaionally command massive vertical speed increases leading to stall
                        // replaced with hackish logic with the idea that some functionality is better than none
                        // (even if it does not match real KAP140)                        
                        //Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet") - 20, false);
                        // MC since we can't increase altitude by 20 ft, instead increasing by 100
                        // if button is pressed again while previously commanded climb is still ongoing,
                        // add another 100 ft to requested altitude
                        if(this.AltitudeChanging){
                            this.AltitudeChangingTo = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet") - 100;
                            if(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet/minute") >= 0 &&  this.AltitudeChangingTo <= SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet")) {
                                this.AltitudeChanging = false;
                                SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 0);
                                break;
                            }                             
                        }
                        else{
                            this.AltitudeChangingTo = SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet") % 100 > 50 ? SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet") - (SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet") % 100):  SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet") - (SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet") % 100) - 100;
                            SimVar.SetSimVarValue("K:AP_VS_VAR_SET_ENGLISH", "number", -500);
                            SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "number", 0);
                            this.RightBlockReinitTime = 3000;
                            this.RightBlockCurrDisplay = 1;
                            this.AltitudeChanging = true;
                        }
                        SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "number", (this.AltitudeChangingTo > 0 ? this.AltitudeChangingTo : 100) );
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
                    if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool")) {
                        if (!this.AltitudeArmed) {
                            var fpm = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet/minute");
                            // 2 is the autopilots altitude indicator.
                            var altitudeDifference = this.AltitudeAlerterAltitude - SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet");
                            // If it is less than zero, we can't arm because the fpm will not take us towards the desired altitude.
                            // If it is zero, then either we are already at the correct altitude anyway, or the fpm will not change altitude.
                            if (altitudeDifference * fpm < 0) {
                                break;
                            }
                            SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "number", this.AltitudeAlerterAltitude);
                            SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "number", 0);
                            this.RightBlockReinitTime = 3000;
                            this.RightBlockCurrDisplay = 1;
                            this.AltitudeArmed = true;
                        }
                        else {
                            SimVar.SetSimVarValue("K:AP_ALT_HOLD", "number", 0);
                            this.AltitudeArmed = false;
                        }
                    }
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
                                // SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", 2);
                                break;
                            case "KAP140_Knob_Outer_DEC":
                            case "KAP140_Knob_Inner_DEC":
                                // SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", 2);
                                break;
                        }
                    }
                    else {
                        switch (_args[0]) {
                            case "KAP140_Knob_Outer_INC":
                                this.AltitudeAlerterAltitude += 1000;
                                //SimVar.SetSimVarValue("K:AP_ALT_VAR_INC", "number", 1000);
                                break;
                            case "KAP140_Knob_Outer_DEC":
                                this.AltitudeAlerterAltitude -= 1000;
                                //SimVar.SetSimVarValue("K:AP_ALT_VAR_DEC", "number", 1000);
                                break;
                            case "KAP140_Knob_Inner_INC":
                                this.AltitudeAlerterAltitude += 100;
                                //SimVar.SetSimVarValue("K:AP_ALT_VAR_INC", "number", 100);
                                break;
                            case "KAP140_Knob_Inner_DEC":
                                this.AltitudeAlerterAltitude -= 100;
                                //SimVar.SetSimVarValue("K:AP_ALT_VAR_DEC", "number", 100);
                                break;
                        }
                        if (this.AltitudeAlerterAltitude < 0) {
                            this.AltitudeAlerterAltitude = 0;
                        }
                        // In the manual: "When the autopilot is engaged, ALT arming is automatic upon altitude alerter altitude selection via the rotary knobs."
                        var armedAltitude = false;
                        if (this.isAutopilotEngaged() && !this.AltitudeArmed) {
                            this.AltitudeArmed = true;
                            armedAltitude = true;
                        }
                        var fpm = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet/minute");
                        // If altitude is armed, then adjust the autopilot altitude lock var.
                        if (this.AltitudeArmed) {
                            SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "number", this.AltitudeAlerterAltitude);
                            SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "number", fpm); // MC: replace 0 with fpm?
                        }
                        // If we ourselves armed altitude, then additionally set the fpm to 0 and put ourselves in VS mode.
                        // TODO do not reset FPM.
                        if (armedAltitude) {
                            //SimVar.SetSimVarValue("K:AP_VS_VAR_SET_ENGLISH", "number", 0);
                            //SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "number", 0); // MC: replace 0 with fpm?
                            //SimVar.SetSimVarValue("K:AP_VS_VAR_SET_ENGLISH", "number", fpm);
                            SimVar.SetSimVarValue("K:AP_PANEL_VS_ON", "number", fpm); // MC: replace 0 with fpm?
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
                this.LeftDisplayTop.textContent = "888";
                this.LeftDisplayBot.textContent = "888";
                this.MidDisplayTop.textContent = "888";
                this.MidDisplayBot.textContent = "888";
                this.RightDisplayTop.textContent = "88.888";
                return;
            }
            else if (this.iTestingStep > -1) {
                this.HideEveryDisplay();
                this.MidDisplayTop.style.visibility = "visible";
                this.MidDisplayTop.textContent = "PFT";
                this.RightDisplayTop.style.visibility = "visible";
                this.RightDisplayTop.textContent = fastToFixed((this.iTestingStep + 1), 0);
                this.RightDisplayTop.classList.add("alignLeft");
                return;
            }
            if (this.isAutopilotEngaged()) {
                this.APdisplay.style.visibility = "visible";
            }
            else { // check location of this  else block
                this.APdisplay.style.visibility = "hidden";
            }
            if (this.isAutopilotEngaged() && (this.PitchMode == 0 || !this.getActivePitchMode())) {
                // This can only happen if the user didn't use the AP button on the gauge to active autopilot. So just hack around it
                this.forceVSCapture();
                this.RightBlockReinitTime = 3000;
                this.RightBlockCurrDisplay = 1;
            }
            // MC set alt to someting reasonable
            if(this.isAutopilotEngaged() && !this.AltitudeArmed && this.PitchMode == 1 && !this.AltitudeChanging ){
                var fpm = SimVar.GetSimVarValue("VERTICAL SPEED", "feet per second") * 60;
                SimVar.SetSimVarValue("K:AP_ALT_VAR_SET_ENGLISH", "number",this.getReasonableAltitudeValue() * (fpm > 0 ? 1 : 0));
            } 
            if (!this.isAutopilotEngaged()) {
                // Another random hack. Don't know how to listen for events so just randomly extinguish the annunciator here.
                this.AtltitudeArmed = false;
                this.AltitudeChanging = false; //MC
            }
            this.LeftDisplayTop.textContent = this.getActiveRollMode();
            var armedRoll = this.getArmedRollMode();
            this.LeftDisplayBot.textContent = armedRoll;
            if (armedRoll) {
                this.LeftARM.style.visibility = "visible";
            }
            else {
                this.LeftARM.style.visibility = "hidden";
            }
            this.MidDisplayTop.textContent = this.getActivePitchMode();
            //var armedPitch = this.getArmedPitchMode();
            //this.MidDisplayBot.textContent = armedPitch;
            // If the altitude arm annunciator was lit previously but we have now captured that altitude, extinguish the annunciator.
            // Note: behavior may not match real device. The real device can annunciate ALT/ALTARM in the middle display without changing the altitude. Why? Nobody knows...
            if (this.AltitudeArmed) {
                if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Bool")) {
                    this.AltitudeArmed = false;
                }
            }
            //MC same for chaning altitude situation
            if (this.AltitudeChanging) {
                if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Bool")) {
                    this.AltitudeChanging = false;
                }
            }
            var armedPitch = this.AltitudeArmed;
            if (armedPitch) {
                this.MidDisplayBot.textContent = "ALT";
                this.MidARM.style.visibility = "visible";
            }
            else {
                this.MidDisplayBot.textContent = "";
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
                    this.RightBlock.setAttribute("state", "FPM");
                    this.RightDisplayTop.textContent = this.getVerticalSpeedSelected();
                }
                else if (this.RightBlockCurrDisplay == 2) {
                    if (this.BaroMode == 0) {
                        this.RightBlock.setAttribute("state", "HPA");
                        this.RightDisplayTop.textContent = this.getBaroHPa();
                    }
                    else {
                        this.RightBlock.setAttribute("state", "INHG");
                        this.RightDisplayTop.textContent = this.getBaroInHg();
                    }
                }
            }
            if (this.RightBlockCurrDisplay == 0) {
                this.RightBlock.setAttribute("state", "FT");
                this.RightDisplayTop.textContent = this.getAltitudeSelected();
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
            // MC I have no idea why this is here. IF FALSE? Is that some JS idiom?
            if (false) {
                this.LeftDisplayTop.textContent = ("" + SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool")) + " " + SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool");
                this.LeftDisplayBot.textContent =  ("" + SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Bool")) + " " + SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Bool");
            }
            //this.MidDisplayBot.textContent = fastToFixed(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet"), 0);
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
        this.RightBlock.setAttribute("state", "NONE");
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
        this.RightBlock.setAttribute("state", "ALL");
    }
    isAutopilotEngaged() {
        return SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool");
    }
    getActiveRollMode() {
        // These first two will become false once the localizer or radial is captured, so put them first.        
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
        // In approach mode, the last mode we were in is still enabled until we have captured the localizer. So we know we can put APR.
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Bool") && (SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool") || SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool"))) {
            return "APR";
        }
        // If we are here, that means we already captured the localizer. But if we haven't acquired it yet, annunciate GS.
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Bool") && (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Bool") || SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Bool"))) {
            // Not a roll mode but according to the manual it is annunciated in that spot :-/
            return "GS";
        }
        // Experimentally, I never saw this combination of variables, but this is how it's coded in the G1000 display. So...who knows if it works.
        if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean") && (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool") || SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool"))) {
            return "NAV";
        }
        // Didn't try this but I assume it is the same.
        if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Boolean") && (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool") || SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool"))) {
            return "REV";
        }
        // TODO Backcourse.
        // Some remnants of logic for correct annunciation are below, but unforunately, they can't work with the sim as-is.
        if (!SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool") && !SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool")) {
            return "";
        }
        // Unreachable. Without access to the autopilot logic, there is no information that can be used to display these correctly. Namely, there is no way to know whether the intended course has been intercepted. The alternative would be something like "check the deviation" which sounds like a disaster.
        else if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Bool")) {
            return "NAV";
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Bool")) {
            return "REV";
        }
        return "";
    }
    getActivePitchMode() {
        if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Bool")) {
            this.PitchMode = 1;
            return "VS";
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Bool")) {
            this.PitchMode = 2;
            return "ALT";
        }
        else if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE HOLD", "Bool")) {
            this.PitchMode = 3;
            return "GS";
        }
        this.PitchMode = 0;
        return "";
    }
    getArmedPitchMode() { // this dos not matter that it is changed - never gets called 
        if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Bool")) {
            return "ALT";
        }
        return "";
    }
    getAltitudeSelected() {
        return fastToFixed(this.AltitudeAlerterAltitude, 0).replace(/\d+(?=(\d{3}))/, '$&,');
        //return (fastToFixed(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet"), 0)).replace(/\d+(?=(\d{3}))/, '$&,');
    }
    getVerticalSpeedSelected() {
        return (fastToFixed(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet/minute"), 0)).replace(/\d+(?=(\d{3}))/, '$&,');
    }
    getBaroHPa() {
        return (fastToFixed(SimVar.GetSimVarValue("KOHLSMAN SETTING MB:1", "Millibars"), 0)).replace(/\d+(?=(\d{3}))/, '$&,');
    }
    getBaroInHg() {
        return fastToFixed(SimVar.GetSimVarValue("KOHLSMAN SETTING HG:1", "inHg"), 2);
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