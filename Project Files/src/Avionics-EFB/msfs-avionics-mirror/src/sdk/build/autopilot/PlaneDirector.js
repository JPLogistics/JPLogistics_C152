/**
 * The state of a given plane director.
 */
export var DirectorState;
(function (DirectorState) {
    /** The plane director is not currently armed or active. */
    DirectorState["Inactive"] = "Inactive";
    /** The plane director is currently armed. */
    DirectorState["Armed"] = "Armed";
    /** The plane director is currently active. */
    DirectorState["Active"] = "Active";
})(DirectorState || (DirectorState = {}));
/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * A plane director that provides no behavior.
 */
export class EmptyDirector {
    constructor() {
        /** No-op. */
        this.onActivate = () => { };
        /** No-op */
        this.onArm = () => { };
        this.state = DirectorState.Inactive;
    }
    /** No-op. */
    activate() { }
    /** No-op. */
    deactivate() { }
    /** No-op. */
    update() { }
    /** No-op. */
    arm() { }
}
/** An instance of the empty plane director. */
EmptyDirector.instance = new EmptyDirector();
