import { FSComponent, DisplayComponent } from 'msfssdk';
import '../styles/efb.css';
export class HomePage extends DisplayComponent {
    render() {
        return (FSComponent.buildComponent("div", { class: 'my-component' }, "Hello World!"));
    }
}
//# sourceMappingURL=homePage.js.map