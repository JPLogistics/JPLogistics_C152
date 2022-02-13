class AS330 extends BaseInstrument {
    constructor() {
        super(...arguments);
        this.currentPage = 0;
        this.isOn = false;
        this.isInitializing = false;
        this.initStart = 0;
        this.isEditing = false;
        this.isEditingSubPage = false;
        this.editIndex = 0;
        this.lastState = 0;
        this.isVFRCode = true;
        this.codeSetTime = 0;
        this.isFlightTimeStarted = false;
    }
    get templateID() { return "AS330"; }
    connectedCallback() {
        super.connectedCallback();
        this.pageContainer = this.getChildById("PageContainer");
        this.mode = this.getChildById("mode");
        this.rSymbol = this.getChildById("r");
        this.ident = this.getChildById("ident");
        this.code = [0, 0, 0, 0];
        this.lastCode = [0, 0, 0, 0];
        this.codeElements = [];
        for (let i = 1; i <= 4; i++) {
            this.codeElements.push(this.getChildById("d" + i));
        }
        if (this.isElectricityAvailable()) {
            diffAndSetAttribute(this.pageContainer, "state", "Startup");
        }
        else {
            diffAndSetAttribute(this.pageContainer, "state", "Off");
        }
        this.pages = [
            new AS330_PressAlt("PressAlt", this),
            new AS330_FlightTime("FlightTime", this),
            new AS330_OATDALT("OATDALT", this),
            new AS330_CounterUp("CountUpTimer", this),
            new AS330_CounterDown("CountDownTimer", this)
        ];
        for (let i = 0; i < this.pages.length; i++) {
            this.pages[i].init();
        }
        this.startAltitude = SimVar.GetSimVarValue("PRESSURE ALTITUDE", "feet");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
        if (super.isElectricityAvailable()) {
            let event;
            ;
            if (_args[0].startsWith("Transponder")) {
                event = _args[0].slice("Transponder".length);
            }
            this.pages[this.currentPage].onEvent(event);
            switch (event) {
                case "OFF":
                    SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 0);
                    for (let i = 0; i < this.pages.length; i++) {
                        this.pages[i].onShutDown();
                    }
                    break;
                case "STBY":
                    SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 1);
                    break;
                case "TST":
                    SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 2);
                    break;
                case "ON":
                    SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 3);
                    break;
                case "ALT":
                    SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 4);
                    break;
                case "0":
                    this.digitEvent(0);
                    break;
                case "1":
                    this.digitEvent(1);
                    break;
                case "2":
                    this.digitEvent(2);
                    break;
                case "3":
                    this.digitEvent(3);
                    break;
                case "4":
                    this.digitEvent(4);
                    break;
                case "5":
                    this.digitEvent(5);
                    break;
                case "6":
                    this.digitEvent(6);
                    break;
                case "7":
                    this.digitEvent(7);
                    break;
                case "CLR":
                    if (this.isEditing) {
                        if (this.editIndex > 0) {
                            this.editIndex--;
                            this.code[this.editIndex] = -1;
                        }
                        else {
                            this.isEditing = false;
                        }
                        for (let i = 0; i < this.codeElements.length; i++) {
                            diffAndSetAttribute(this.codeElements[i], "state", this.isEditing && i == this.editIndex ? "Blink" : "");
                        }
                    }
                    else {
                        if (Date.now() < this.codeSetTime + 5000) {
                            this.isEditing = true;
                            this.editIndex = 3;
                            this.code[this.editIndex] = -1;
                            for (let i = 0; i < this.codeElements.length; i++) {
                                diffAndSetAttribute(this.codeElements[i], "state", this.isEditing && i == this.editIndex ? "Blink" : "");
                            }
                        }
                    }
                    break;
                case "VFR":
                    if (!this.isVFRCode) {
                        Simplane.setTransponderToRegion();
                        this.isVFRCode = true;
                    }
                    else {
                        this.code = this.lastCode;
                        this.sendNewCode();
                        this.isVFRCode = false;
                    }
                    let code = ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
                    for (let i = 0; i < this.code.length; i++) {
                        this.code[i] = parseInt(code.charAt(i));
                    }
                    this.isEditing = false;
                    for (let i = 0; i < this.codeElements.length; i++) {
                        diffAndSetAttribute(this.codeElements[i], "state", "");
                    }
                    break;
                case "FUNC":
                    this.pages[this.currentPage].onExit();
                    this.currentPage = (this.currentPage + 1) % this.pages.length;
                    break;
                case "CRSR":
                    if (this.isEditing) {
                        this.isEditing = false;
                        for (let i = 0; i < this.codeElements.length; i++) {
                            diffAndSetAttribute(this.codeElements[i], "state", "");
                        }
                    }
                    break;
            }
        }
    }
    Update() {
        super.Update();
        let timeOfDay = SimVar.GetSimVarValue("E:TIME OF DAY", "Enum");
        diffAndSetAttribute(this.pageContainer, "display", timeOfDay !== 1 ? "Night" : "Day");
        if (this.isOn) {
            if (this.isElectricityAvailable()) {
                if (this.isInitializing) {
                    if (Date.now() > this.initStart + 5000) {
                        this.isInitializing = false;
                        diffAndSetAttribute(this.pageContainer, "state", "PressAlt");
                    }
                }
                else {
                    diffAndSetAttribute(this.pageContainer, "state", this.pages[this.currentPage].pageId);
                }
                let currState = this.getCurrentState();
                if (this.lastState != currState) {
                    switch (currState) {
                        case 1:
                            diffAndSetText(this.mode, "STBY");
                            diffAndSetAttribute(this.rSymbol, "state", "Hide");
                            break;
                        case 3:
                            diffAndSetText(this.mode, "ON");
                            diffAndSetAttribute(this.rSymbol, "state", "Blink");
                            break;
                        case 4:
                            diffAndSetText(this.mode, "ALT");
                            diffAndSetAttribute(this.rSymbol, "state", "Blink");
                            break;
                    }
                }
                diffAndSetAttribute(this.ident, "state", SimVar.GetSimVarValue("TRANSPONDER IDENT:1", "bool") ? "" : "Hide");
                if (this.isEditing) {
                    for (let i = 0; i < this.codeElements.length; i++) {
                        diffAndSetText(this.codeElements[i], this.code[i] == -1 ? "-" : this.code[i] + '');
                    }
                }
                else {
                    let code = ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4);
                    for (let i = 0; i < this.codeElements.length; i++) {
                        diffAndSetText(this.codeElements[i], code.charAt(i));
                    }
                }
                this.pages[this.currentPage].update();
                if (!this.isFlightTimeStarted) {
                    let alt = SimVar.GetSimVarValue("PRESSURE ALTITUDE", "feet");
                    if (alt > (this.startAltitude + 50)) {
                        this.isFlightTimeStarted = true;
                        this.flightTimeBegin = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds");
                    }
                    else if (alt < this.startAltitude) {
                        this.startAltitude = alt;
                    }
                }
            }
            else {
                diffAndSetAttribute(this.pageContainer, "state", "Off");
                this.isOn = false;
                this.isInitializing = false;
                this.isEditing = false;
                this.isFlightTimeStarted = false;
                for (let i = 0; i < this.pages.length; i++) {
                    this.pages[i].onShutDown();
                }
            }
        }
        else {
            if (this.isElectricityAvailable()) {
                this.isOn = true;
                this.isInitializing = true;
                this.initStart = Date.now();
                diffAndSetAttribute(this.pageContainer, "state", "Startup");
                this.startAltitude = SimVar.GetSimVarValue("PRESSURE ALTITUDE", "feet");
            }
        }
    }
    getCurrentState() {
        return SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number");
    }
    digitEvent(_number) {
        if (!this.isEditingSubPage) {
            if (!this.isEditing) {
                this.lastCode = this.code;
                this.code[0] = _number;
                this.code[1] = -1;
                this.code[2] = -1;
                this.code[3] = -1;
                this.editIndex = 1;
                this.isEditing = true;
            }
            else {
                this.code[this.editIndex] = _number;
                this.editIndex++;
                if (this.editIndex == 4) {
                    this.isEditing = false;
                    this.isVFRCode = false;
                    this.codeSetTime = Date.now();
                    this.sendNewCode();
                }
            }
            for (let i = 0; i < this.codeElements.length; i++) {
                diffAndSetAttribute(this.codeElements[i], "state", this.isEditing && i == this.editIndex ? "Blink" : "");
            }
        }
    }
    sendNewCode() {
        var code = this.code[0] * 4096 + this.code[1] * 256 + this.code[2] * 16 + this.code[3];
        SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", code);
    }
    isElectricityAvailable() {
        if (SimVar.GetSimVarValue("TRANSPONDER STATE:1", "number") == 0) {
            return false;
        }
        return super.isElectricityAvailable();
    }
}
class AS330_Page {
    constructor(_id, _instrument) {
        this.pageId = _id;
        this.transponder = _instrument;
    }
    onExit() { }
    onShutDown() { }
}
class AS330_PressAlt extends AS330_Page {
    init() {
        this.valueElem = this.transponder.getChildById("PressAltValue");
    }
    update() {
        let alt = SimVar.GetSimVarValue("INDICATED ALTITUDE CALIBRATED", "feet");
        diffAndSetText(this.valueElem, (alt < 0 ? "-" : "") + ("000" + fastToFixed((Math.abs(alt) / 100), 0)).slice(alt < 0 ? -2 : -3));
    }
    onEvent(_event) {
    }
}
class AS330_FlightTime extends AS330_Page {
    init() {
        this.valueElem = this.transponder.getChildById("FlightTimeValue");
    }
    update() {
        if (this.transponder.isFlightTimeStarted) {
            let time = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds") - this.transponder.flightTimeBegin;
            let hour = Math.floor(time / 3600 % 100);
            let minutes = Math.floor(time / 60 % 60);
            let seconds = Math.floor(time % 60);
            diffAndSetText(this.valueElem, (hour < 10 ? "0" : "") + hour + (minutes < 10 ? ":0" : ":") + minutes + (seconds < 10 ? ":0" : ":") + seconds);
        }
        else {
            diffAndSetText(this.valueElem, "00:00:00");
        }
    }
    onEvent(_event) {
    }
}
class AS330_FlightId extends AS330_Page {
    init() {
        this.valueElem = this.transponder.getChildById("FlightIdValue");
    }
    update() {
        diffAndSetText(this.valueElem, SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "String"));
    }
    onEvent(_event) {
    }
}
class AS330_OATDALT extends AS330_Page {
    init() {
        this.oatValueElem = this.transponder.getChildById("OATValue");
        this.daltValueElem = this.transponder.getChildById("DALTValue");
    }
    update() {
        let oat = SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius");
        diffAndSetText(this.oatValueElem, fastToFixed(oat, 0));
        let pressAlt = SimVar.GetSimVarValue("PRESSURE ALTITUDE", "feet");
        let densityAltitude = (pressAlt * 1.2376) + (118.8 * oat) - 1782;
        diffAndSetText(this.daltValueElem, fastToFixed(densityAltitude, 0));
    }
    onEvent(_event) {
        switch (_event) {
            case "CRSR":
                break;
        }
    }
}
class AS330_CounterUp extends AS330_Page {
    constructor() {
        super(...arguments);
        this.isStarted = false;
        this.lastValue = 0;
    }
    init() {
        this.valueElem = this.transponder.getChildById("CountUpValue");
    }
    update() {
        if (this.isStarted) {
            let time = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds") - this.counterStartTime;
            let hour = Math.floor(time / 3600 % 100);
            let minutes = Math.floor(time / 60 % 60);
            let seconds = Math.floor(time % 60);
            diffAndSetText(this.valueElem, (hour < 10 ? "0" : "") + hour + (minutes < 10 ? ":0" : ":") + minutes + (seconds < 10 ? ":0" : ":") + seconds);
        }
    }
    onEvent(_event) {
        switch (_event) {
            case "STARTSTOP":
                if (!this.isStarted) {
                    this.counterStartTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds") - this.lastValue;
                }
                else {
                    this.lastValue = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds") - this.counterStartTime;
                }
                this.isStarted = !this.isStarted;
                break;
            case "CLR":
                if (!this.transponder.isEditing) {
                    this.isStarted = false;
                    this.lastValue = 0;
                    diffAndSetText(this.valueElem, "00:00:00");
                }
                break;
        }
    }
    onShutDown() {
        this.isStarted = false;
        this.lastValue = 0;
        diffAndSetText(this.valueElem, "00:00:00");
    }
}
class AS330_CounterDown extends AS330_Page {
    constructor() {
        super(...arguments);
        this.isStarted = false;
        this.lastValue = 0;
        this.startValue = 0;
        this.editNumberNeedUpdate = false;
        this.editNumbers = [0, 0, 0, 0, 0, 0];
        this.editIndex = 0;
    }
    init() {
        this.valueElem = this.transponder.getChildById("CountDownValue");
    }
    update() {
        if (this.isStarted) {
            let time = Math.max(this.startValue - SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds") + this.counterStartTime, 0);
            if (time == 0) {
                this.isStarted = false;
                this.lastValue = 0;
                let hour = Math.floor(this.startValue / 3600 % 100);
                let minutes = Math.floor(this.startValue / 60 % 60);
                let seconds = Math.floor(this.startValue % 60);
                diffAndSetText(this.valueElem, (hour < 10 ? "0" : "") + hour + (minutes < 10 ? ":0" : ":") + minutes + (seconds < 10 ? ":0" : ":") + seconds);
            }
            else {
                let hour = Math.floor(time / 3600 % 100);
                let minutes = Math.floor(time / 60 % 60);
                let seconds = Math.floor(time % 60);
                diffAndSetText(this.valueElem, (hour < 10 ? "0" : "") + hour + (minutes < 10 ? ":0" : ":") + minutes + (seconds < 10 ? ":0" : ":") + seconds);
            }
        }
        else if (this.transponder.isEditingSubPage && this.editNumberNeedUpdate) {
            let html = "";
            for (let i = 0; i < this.editNumbers.length; i++) {
                if (i == this.editIndex) {
                    html += '<span class="Blink">' + this.editNumbers[i] + '</span>';
                }
                else {
                    html += this.editNumbers[i];
                }
                if (i == 1 || i == 3) {
                    html += ":";
                }
            }
            diffAndSetHTML(this.valueElem, html);
            this.editNumberNeedUpdate = false;
            if (this.editIndex == 6) {
                this.transponder.isEditingSubPage = false;
                this.startValue = 36000 * this.editNumbers[0] + 3600 * this.editNumbers[1] + 600 * this.editNumbers[2] + 60 * this.editNumbers[3] + 10 * this.editNumbers[4] + this.editNumbers[5];
            }
            if (this.editIndex == -1) {
                this.transponder.isEditingSubPage = false;
            }
        }
    }
    onEvent(_event) {
        switch (_event) {
            case "STARTSTOP":
                if (!this.isStarted) {
                    if (this.transponder.isEditingSubPage) {
                        this.transponder.isEditingSubPage = false;
                        this.startValue = 36000 * this.editNumbers[0] + 3600 * this.editNumbers[1] + 600 * this.editNumbers[2] + 60 * this.editNumbers[3] + 10 * this.editNumbers[4] + this.editNumbers[5];
                    }
                    this.counterStartTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds") - this.lastValue;
                }
                else {
                    this.lastValue = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "Seconds") - this.counterStartTime;
                }
                this.isStarted = !this.isStarted;
                break;
            case "CLR":
                if (!this.transponder.isEditing) {
                    if (this.transponder.isEditingSubPage) {
                        this.editIndex--;
                        this.editNumbers[this.editIndex] = 0;
                        this.editNumberNeedUpdate = true;
                    }
                    else {
                        this.isStarted = false;
                        this.lastValue = 0;
                        let hour = Math.floor(this.startValue / 3600 % 100);
                        let minutes = Math.floor(this.startValue / 60 % 60);
                        let seconds = Math.floor(this.startValue % 60);
                        diffAndSetText(this.valueElem, (hour < 10 ? "0" : "") + hour + (minutes < 10 ? ":0" : ":") + minutes + (seconds < 10 ? ":0" : ":") + seconds);
                    }
                }
                break;
            case "CRSR":
                if (!this.transponder.isEditing) {
                    this.transponder.isEditingSubPage = true;
                    this.editIndex = 0;
                    this.editNumbers = [0, 0, 0, 0, 0, 0];
                    this.editNumberNeedUpdate = true;
                    this.isStarted = false;
                }
                break;
            case "0":
                this.digitEvent(0);
                break;
            case "1":
                this.digitEvent(1);
                break;
            case "2":
                this.digitEvent(2);
                break;
            case "3":
                this.digitEvent(3);
                break;
            case "4":
                this.digitEvent(4);
                break;
            case "5":
                this.digitEvent(5);
                break;
            case "6":
                this.digitEvent(6);
                break;
            case "7":
                this.digitEvent(7);
                break;
            case "8":
                this.digitEvent(8);
                break;
            case "9":
                this.digitEvent(9);
                break;
        }
    }
    digitEvent(_number) {
        if (this.transponder.isEditingSubPage && !((this.editIndex == 2 || this.editIndex == 4) && _number > 5)) {
            this.editNumbers[this.editIndex] = _number;
            this.editIndex++;
            this.editNumberNeedUpdate = true;
        }
    }
    onShutDown() {
        this.isStarted = false;
        this.lastValue = 0;
        this.startValue = 0;
        diffAndSetText(this.valueElem, "00:00:00");
    }
    onExit() {
        this.transponder.isEditingSubPage = false;
    }
}
registerInstrument("as330-element", AS330);
//# sourceMappingURL=AS330.js.map