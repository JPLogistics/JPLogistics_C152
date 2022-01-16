/**
 * A model for maps. Specific functionality is added by adding one or more modules to the model. Each module added to
 * the model is assigned a name which is used to retrieve it from the model.
 */
export class MapModel {
    constructor() {
        this.modules = new Map();
    }
    /**
     * Gets a module from this model.
     * @param name The name of the module.
     * @returns A module.
     */
    getModule(name) {
        return this.modules.get(name);
    }
    /**
     * Adds a module to this model.
     * @param name The name of the module to add.
     * @param module The module to add.
     */
    addModule(name, module) {
        if (this.modules.has(name)) {
            return;
        }
        this.modules.set(name, module);
    }
}
