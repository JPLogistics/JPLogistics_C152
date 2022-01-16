import {
  FSComponent,
  DisplayComponent,
  VNode,
  ComponentProps,
  SimVarDefinition,
} from "msfssdk";
import { initializeApp, setLogLevel } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  getDocFromCache,
} from "firebase/firestore";
import { efbSettings, efbThemeSettings } from "./components/functions/settings";
import { round } from "./components/functions/functions";
import { Headers, Error, Pages, Warning } from "./components/pages";
import "./styles/efb.css";
import "./styles/tailwind.css";
const firebaseConfig = {
  apiKey: "AIzaSyAHyxydnYVu2B3svGQMrfOtcBPAxqSjVyk",
  authDomain: "jplogistics-msfs.firebaseapp.com",
  projectId: "jplogistics-msfs",
  storageBucket: "jplogistics-msfs.appspot.com",
  messagingSenderId: "40931759206",
  appId: "1:40931759206:web:9a299fb14ca3a8df9f09a7",
  measurementId: "G-ZTTKWKX271",
};
setLogLevel("silent");

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Got here - 1");

class EFB extends BaseInstrument {
  tablet_init_complete = false;
  appCount = 7;
  appSelected = "Boot";
  appPrevious = "Boot";
  navButton1: any;
  navButton2: any;
  navButton3: any;
  navButton4: any;
  navButton5: any;
  navButton6: any;
  navButton7: any;
  settingsToggleStateSaving: any;
  settingsToggleMaintenance: any;
  settingsToggleEGT: any;
  settingsToggleAP: any;
  settingsTogglepilotViz: any;
  settingsToggleCopilotViz: any;
  stateCAD: any;
  stateCADPress: any;
  stateRFF: any;
  stateRFFPress: any;
  livery: string | undefined;

  get templateID(): string {
    console.log("Here....1.2");
    return "EFB";
  }
  get isInteractive() {
    return true;
  }

  public async connectedCallback() {
    console.log("Got here... 1.5");
    super.connectedCallback();
    var title = SimVar.GetSimVarValue("TITLE", "string");
		this.livery = title.replace(/\s+/g, '_');
    // SimVar.SetSimVarValue("L:EFB_Theme", "string", "light")
    // .then(() => efbThemeSettings.theme = SimVar.GetSimVarValue("L:EFB_Theme", "string") && console.log(efbThemeSettings.theme));;
    // ;

    FSComponent.render(<Headers />, document.getElementById("efbHeader"));
    FSComponent.render(<Pages />, document.getElementById("efbContent"));
    FSComponent.render(<Warning />, document.getElementById("efbWarning"));
    FSComponent.render(<Error />, document.getElementById("efbError"));
    console.log("Got here... 1.6");
    await this.tablet_init();
    this.navButton1 = this.getChildById("navButton1");
    this.navButton1.addEventListener("click", this.navButton1Press.bind(this));
    this.navButton2 = this.getChildById("navButton2");
    this.navButton2.addEventListener("click", this.navButton2Press.bind(this));
    this.navButton3 = this.getChildById("navButton3");
    this.navButton3.addEventListener("click", this.navButton3Press.bind(this));
    this.navButton4 = this.getChildById("navButton4");
    this.navButton4.addEventListener("click", this.navButton4Press.bind(this));
    this.navButton5 = this.getChildById("navButton5");
    this.navButton5.addEventListener("click", this.navButton5Press.bind(this));
    this.navButton6 = this.getChildById("navButton6");
    this.navButton6.addEventListener("click", this.navButton6Press.bind(this));
    this.navButton7 = this.getChildById("navButton7");
    this.navButton7.addEventListener("click", this.navButton7Press.bind(this));
    this.settingsToggleStateSaving = this.getChildById(
      "settingsToggleStateSaving"
    );
    this.settingsToggleStateSaving.addEventListener(
      "change",
      this.settingsToggleStateSavingPress.bind(this)
    );
    this.settingsToggleMaintenance = this.getChildById(
      "settingsToggleMaintenance"
    );
    this.settingsToggleMaintenance.addEventListener(
      "change",
      this.settingsToggleMaintenancePress.bind(this)
    );
    this.settingsToggleEGT = this.getChildById("settingsToggleEGT");
    this.settingsToggleEGT.addEventListener(
      "change",
      this.settingsToggleEGTPress.bind(this)
    );
    this.settingsToggleAP = this.getChildById("settingsToggleAP");
    this.settingsToggleAP.addEventListener(
      "change",
      this.settingsToggleAPPress.bind(this)
    );
    this.settingsTogglepilotViz = this.getChildById("settingsTogglepilotViz");
    this.settingsTogglepilotViz.addEventListener(
      "change",
      this.settingsTogglepilotVizPress.bind(this)
    );
    this.settingsToggleCopilotViz = this.getChildById(
      "settingsToggleCopilotViz"
    );
    this.settingsToggleCopilotViz.addEventListener(
      "change",
      this.settingsToggleCopilotVizPress.bind(this)
    );

    this.stateCAD = this.getChildById("stateCAD");
    this.stateCAD.addEventListener("mouseup", this.stateCADPress.bind(this));
    this.stateRFF = this.getChildById("stateRFF");
    this.stateRFF.addEventListener("mouseup", this.stateRFFPress.bind(this));

    // SET INFO TO IPAD
    if (SimVar.GetSimVarValue("JPL152IP_SSONOFF_" + this.livery, 'bool') == 1) {
      this.settingsToggleStateSaving.checked = true;
    } else {
      this.settingsToggleStateSaving.checked = false;
    }

    if (SimVar.GetSimVarValue("JPL152IP_ENGMAINTONOFF_" + this.livery, 'bool') == 1) {
      this.settingsToggleMaintenance.checked = true;
    } else {
      this.settingsToggleMaintenance.checked = false;
    }

    if (SimVar.GetSimVarValue("JPL152IP_CLOCKEGT_" + this.livery, 'bool') == 1) {
      this.settingsToggleEGT.checked = true;
    } else {
      this.settingsToggleEGT.checked = false;
    }

    if (SimVar.GetSimVarValue("JPL152IP_APVIZ_" + this.livery, 'bool') == 1) {
      this.settingsToggleAP.checked = true;
    } else {
      this.settingsToggleAP.checked = false;
    }

    if (SimVar.GetSimVarValue("JPL152IP_PILOTVIZ_" + this.livery, 'bool') == 1) {
      this.settingsTogglepilotViz.checked = true;
    } else {
      this.settingsTogglepilotViz.checked = false;
    }

    if (SimVar.GetSimVarValue("JPL152IP_COPILOTVIZ_" + this.livery, 'bool') == 1) {
      this.settingsToggleCopilotViz.checked = true;
    } else {
      this.settingsToggleCopilotViz.checked = false;
    }
  }
  settingsToggleStateSavingPress() {
    SimVar.SetSimVarValue(
      "L:JPL152_SSONOFF",
      "Bool",
      this.settingsToggleStateSaving.checked
    );
  }
  settingsToggleMaintenancePress() {
    SimVar.SetSimVarValue(
      "L:JPL152_MAINTENANCE_ONOFF",
      "Bool",
      this.settingsToggleMaintenance.checked
    );
  }
  settingsToggleEGTPress() {
    SimVar.SetSimVarValue(
      "L:JPL152_CLOCKEGT",
      "Bool",
      this.settingsToggleEGT.checked
    );
  }
  settingsToggleAPPress() {
    SimVar.SetSimVarValue(
      "L:JPL152_APVIZ",
      "Bool",
      this.settingsToggleAP.checked
    );
  }
  settingsTogglepilotVizPress() {
    SimVar.SetSimVarValue(
      "L:C152_PilotsState",
      "Bool",
      this.settingsTogglepilotViz.checked
    );
  }
  settingsToggleCopilotVizPress() {
    SimVar.SetSimVarValue(
      "L:C152_CoPilotsState",
      "Bool",
      this.settingsToggleCopilotViz.checked
    );
  }
  navButton1Press() {
    this.setScreen("Home");
  }
  navButton2Press() {
    this.setScreen("Maintenance");
  }
  navButton3Press() {
    this.setScreen("Map");
  }
  navButton4Press() {
    this.setScreen("Settings");
  }
  navButton5Press() {
    this.setScreen("5");
  }
  navButton6Press() {
    this.setScreen("6");
  }
  navButton7Press() {
    this.setScreen("stowed");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  Update() {
    super.Update();
    var debugVar = "";
    try {
      if (this.appSelected == "Boot") {
        debugVar = "Boot Screen";
      } else if (this.appSelected == "Home") {
        debugVar = "Home Screen";
      } else if (this.appSelected == "Maintenance") {
        debugVar = "Maintenance Screen";
        this.drawAircraftFuel("aircraft-svg");
      }
    } catch (e) {
      document.getElementById("efbError")!.innerHTML =
        "Ex." + debugVar + "<br/>" + "Ex." + e;
      document.getElementById("efbError")!.classList.remove("hidden");
    }
  }
  setScreen(page: string) {
    var x = "Start setScreen";
    try {
      this.appPrevious = this.appSelected;
      x = "Set previous";
      this.appSelected = page;
      x = "Set selected";
      console.log(this.appSelected + "Page");
      document
        .getElementById(this.appPrevious + "Page")!
        .classList.add("hidden");
      x = "Boot Page Hide?";
      document
        .getElementById(this.appSelected + "Page")!
        .classList.remove("hidden");
      x = "Show new page";
      if (this.appSelected != "Boot") {
        document.getElementById("efbHeader")!.classList.remove("hidden");
        x = "Show Header";
      } else {
        document.getElementById("efbHeader")!.classList.add("hidden");
        x = "Hide Header";
      }
    } catch (e) {
      document.getElementById("efbError")!.innerHTML =
        "Ex." + x + "<br/>" + "Ex." + e;
      document.getElementById("efbError")!.classList.remove("hidden");
    }
    // document.getElementById("efbContent")!.innerHTML = "";
    // if (this.appSelected == "Boot") {
    //   FSComponent.render(<BootPage />, document.getElementById("efbContent"));
  }
  async tablet_init() {
    console.log("Got here - Init - Start of Tablet Init");
    if (this.tablet_init_complete == false) {
      // App

      SimVar.SetSimVarValue("L:EFB_Theme", "string", "light");
      efbThemeSettings.theme = SimVar.GetSimVarValue("L:EFB_Theme", "string");

      const docRef = doc(db, "JPL-Data", "Versions");
      console.log("Got here - Init - Set Simvar & Doc");
      try {
        var docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log("Document data:", docSnap.data());
          const data = docSnap.data();
          console.log("Document data:", data["C152"]);
          console.log("Got here - Init - Fetched Data... Valid?");
          efbSettings.latestVersion = data["C152"];
          if (efbSettings.currentVersion != efbSettings.latestVersion) {
            document.getElementById("outdatedVersion")!.innerHTML =
              "UPDATE: C152 Version " +
              efbSettings.latestVersion +
              ", is available! \n Please update to ensure the best experience!";
            document.getElementById("efbWarning")!.classList.remove("hidden");
          }
        } else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
        }
      } catch (e) {
        console.log("Error getting live document:", e);
        try {
          const doc = await getDocFromCache(docRef);
          console.log("Cached document data:", doc.data());
        } catch (e) {
          console.log("Cached Error:", e);
        } finally {
          document.getElementById("test")!.innerHTML = "Failed";
        }
      }
      console.log("Got here - Init - Finally - Eveyrhing good?");
      // document.getElementById("header")!.classList.remove("hidden");
      setTimeout(() => {
        this.tablet_init_complete = true;
        this.setScreen("Home");
      }, 5000);
    }
  }
  drawAircraftFuel(id: string | String) {
    const width = 36;
    const height = 60;
    const labelHeight = 10;
    const barHeight = height - labelHeight;

    let colorLabelForeground = "fffdf4";
    let colorLabelBackground = "565656";
    let lGallons = SimVar.GetSimVarValue(
      "A:FUEL TANK LEFT MAIN QUANTITY",
      "Gallons"
    );
    let lCapacity = SimVar.GetSimVarValue(
      "A:FUEL TANK LEFT MAIN CAPACITY",
      "Gallons"
    );
    let rGallons = SimVar.GetSimVarValue(
      "A:FUEL TANK RIGHT MAIN QUANTITY",
      "Gallons"
    );
    let rCapacity = SimVar.GetSimVarValue(
      "A:FUEL TANK RIGHT MAIN CAPACITY",
      "Gallons"
    );
    const lfilledHeight = (barHeight - 4) * (lGallons / lCapacity);
    const rfilledHeight = (barHeight - 4) * (rGallons / rCapacity);
    let svg = `
        <svg width="2267.7166"
        height="1611.9048"
        viewBox="0 0 906 644">
        <g
     transform="translate(-5.140976e-8,63.244094)"
     id="g21">
    <path
       d="m 226.77166,-62.503295 2.9403,5.145549 1.47016,4.41047 h 34.5487 v 1.470157 l -33.81361,0.735078 0.73507,2.940314 h 5.14555 l 4.41046,1.470156 2.20525,2.940313 1.47014,5.145548 2.20525,25.727741 0.73507,22.052351 h 83.06386 l 114.67222,5.145549 4.41046,2.940312 2.20523,5.880627 V 63.930175 L 324.53706,82.307136 h -77.91829 l -13.23142,103.646044 58.80627,8.82094 2.94032,3.67539 1.47016,8.08586 v 8.82094 l -1.47016,6.61571 -2.94032,5.14555 -53.66072,8.08585 -9.55601,-18.37695 -0.73507,41.16438 -1.47016,0.73509 -1.47016,-0.73509 -0.73507,-41.16438 -9.55603,18.37695 -53.66071,-8.08585 -2.94031,-5.14555 -1.47016,-6.61571 v -8.82094 l 1.47016,-8.08586 2.94031,-2.94032 58.80626,-9.55601 -13.23141,-103.646044 h -77.9183 L 0.36753904,63.930175 V 23.50087 L 2.572769,17.620243 6.9832502,15.415009 121.65546,9.534382 h 83.06385 l 0.73508,-22.052351 2.20523,-25.727741 1.47016,-5.145548 2.20523,-2.940313 4.41048,-1.470156 h 5.14553 l 0.73509,-2.940314 -34.54868,-0.735078 v -1.470157 h 35.28375 l 1.47016,-4.41047 z"
       fill="#ccffff"
       stroke="#0014aa"
       stroke-width="0.735078"
       id="path19" />
    <rect
       style="fill:#0000ff;fill-opacity:0;fill-rule:evenodd;stroke:#000067;stroke-width:0.816148;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
       id="rect131"
       width="36"
       height="60"
       x="164"
       y="16" />
       <rect x="164" y="16" width="${width}" height="${labelHeight}" style="fill: #${colorLabelBackground};" />
        <rect x="164" y="${
          labelHeight + 16
        }" width="${width}" height="${barHeight}" style="fill: #1a1a1a;" />
        <rect x="166" y="${height - lfilledHeight + 14}" width="${
      width - 4
    }" height="${lfilledHeight}" style="fill: #9b2f25;" />
        <text
       xml:space="preserve"
       style="font-size:4.8px;line-height:1.25;stroke-width:0.2"
       x="173.9864"
       y="22.767141"
       id="text3783"><tspan
         sodipodi:role="line"
         id="tspan3781"
         style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:6.66667px;font-family:sans-serif;-inkscape-font-specification:'sans-serif, Normal';font-variant-ligatures:none;font-variant-caps:normal;font-variant-numeric:normal;font-variant-east-asian:normal;fill:#ffffff;stroke-width:0.2"
         x="173.9864"
         y="22.767141">LEFT</tspan></text>
        <text x="182" y="54" style="font-size:8px;line-height:1.25;stroke-width:0.2" text-anchor="middle" fill="#fffdf4">${round(
          (lGallons / lCapacity) * 100,
          0
        )}%</text>

    <rect
       style="fill:#0000ff;fill-opacity:0;fill-rule:evenodd;stroke:#000067;stroke-width:0.816148;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
       id="rect131-4"
       width="36"
       height="60"
       x="252"
       y="16" />
       <rect x="252" y="16" width="${width}" height="${labelHeight}" style="fill: #${colorLabelBackground};" />
        <rect x="252" y="${
          labelHeight + 16
        }" width="${width}" height="${barHeight}" style="fill: #1a1a1a;" />
        <rect x="254" y="${height - rfilledHeight + 14}" width="${
      width - 4
    }" height="${rfilledHeight}" style="fill: #9b2f25;" />
        <text
        xml:space="preserve"
        style="font-size:4.8px;line-height:1.25;font-family:sans-serif;-inkscape-font-specification:'sans-serif, Normal';font-variant-ligatures:none;stroke-width:0.2"
        x="259.7012"
        y="22.916245"
        id="text3783"><tspan
          sodipodi:role="line"
          id="tspan3781"
          style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:6.66667px;font-family:sans-serif;-inkscape-font-specification:'sans-serif, Normal';font-variant-ligatures:none;font-variant-caps:normal;font-variant-numeric:normal;font-variant-east-asian:normal;fill:#ffffff;stroke-width:0.2"
          x="259.7012"
          y="22.916245">RIGHT</tspan></text>

        <text x="270" y="54" style="font-size:8px;line-height:1.25;stroke-width:0.2" text-anchor="middle" fill="#fffdf4">${round(
          (rGallons / rCapacity) * 100,
          0
        )}%</text>
  </g>
       </svg>
       `;
    this.getChildById(id).innerHTML = svg;
  }
}
registerInstrument("efb-element", EFB);
