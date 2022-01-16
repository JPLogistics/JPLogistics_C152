import { FSComponent, DisplayComponent } from "msfssdk";
import "../../styles/efb.css";
import { efbThemeSettings } from "../functions/settings";
export class Header extends DisplayComponent {
    render() {
        return (FSComponent.buildComponent("div", { id: "header", "data-theme": efbThemeSettings.theme },
            FSComponent.buildComponent("div", { id: "navButton1" },
                FSComponent.buildComponent("svg", { xmlns: "http://www.w3.org/2000/svg", height: "192px", viewBox: "0 0 24 24", width: "192px", fill: "#ffffff" },
                    FSComponent.buildComponent("path", { d: " M0 0h24v24H0V0z", fill: "none" }),
                    FSComponent.buildComponent("path", { d: "M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" }))),
            FSComponent.buildComponent("div", { id: "appPageTitle", class: "absolute-center" }, "JPLogistics EFB V0.0.1")));
    }
}
//# sourceMappingURL=header.js.map