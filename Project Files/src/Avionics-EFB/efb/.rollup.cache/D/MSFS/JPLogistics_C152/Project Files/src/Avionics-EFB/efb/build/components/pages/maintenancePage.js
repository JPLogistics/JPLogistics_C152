import { FSComponent, DisplayComponent } from "msfssdk";
import "../../styles/efb.css";
import { efbThemeSettings } from "../functions/settings";
export class MaintenancePage extends DisplayComponent {
    render() {
        return (FSComponent.buildComponent("div", { id: "content", "data-theme": efbThemeSettings.theme },
            FSComponent.buildComponent("div", { class: "absolute-center" }, "Testing"),
            FSComponent.buildComponent("div", { class: "svg-center", id: "aircraft-svg" })));
    }
}
//# sourceMappingURL=maintenancePage.js.map