/**
 * A model for maps. Specific functionality is added by adding one or more modules to the model. Each module added to
 * the model is assigned a name which is used to retrieve it from the model.
 */
export declare class MapModel<M> {
    private readonly modules;
    /**
     * Gets a module from this model.
     * @param name The name of the module.
     * @returns A module.
     */
    getModule<K extends keyof M>(name: K): M[K];
    /**
     * Adds a module to this model.
     * @param name The name of the module to add.
     * @param module The module to add.
     */
    addModule<K extends keyof M>(name: K, module: M[K]): void;
}
//# sourceMappingURL=MapModel.d.ts.map