/**
 * Types of subscribable array change event.
 */
var SubscribableArrayEventType;
(function (SubscribableArrayEventType) {
    /** An element was added. */
    SubscribableArrayEventType["Added"] = "Added";
    /** An element was removed. */
    SubscribableArrayEventType["Removed"] = "Removed";
    /** The array was cleared. */
    SubscribableArrayEventType["Cleared"] = "Cleared";
})(SubscribableArrayEventType || (SubscribableArrayEventType = {}));
/**
 * An abstract implementation of a subscribable which allows adding, removing, and notifying subscribers.
 */
class AbstractSubscribable {
    constructor() {
        this.subs = [];
    }
    /** @inheritdoc */
    sub(fn, initialNotify) {
        this.subs.push(fn);
        if (initialNotify) {
            fn(this.get());
        }
    }
    /** @inheritdoc */
    unsub(fn) {
        const index = this.subs.indexOf(fn);
        if (index >= 0) {
            this.subs.splice(index, 1);
        }
    }
    /**
     * Notifies subscribers that this subscribable's value has changed.
     */
    notify() {
        const subLen = this.subs.length;
        for (let i = 0; i < subLen; i++) {
            try {
                this.subs[i](this.get());
            }
            catch (error) {
                console.error(`AbstractSubscribable: error in handler: ${error}`);
                if (error instanceof Error) {
                    console.error(error.stack);
                }
            }
        }
    }
}
/**
 * Checks if two values are equal using the strict equality operator.
 * @param a The first value.
 * @param b The second value.
 * @returns whether a and b are equal.
 */
AbstractSubscribable.DEFAULT_EQUALITY_FUNC = (a, b) => a === b;

/**
 * A subscribable subject whose value can be freely manipulated.
 */
class Subject extends AbstractSubscribable {
    /**
     * Constructs an observable Subject.
     * @param value The initial value.
     * @param equalityFunc The function to use to check for equality.
     * @param mutateFunc The function to use to mutate the subject's value.
     */
    constructor(value, equalityFunc, mutateFunc) {
        super();
        this.value = value;
        this.equalityFunc = equalityFunc;
        this.mutateFunc = mutateFunc;
    }
    /**
     * Creates and returns a new Subject.
     * @param v The initial value of the subject.
     * @param equalityFunc The function to use to check for equality between subject values. Defaults to the strict
     * equality comparison (`===`).
     * @param mutateFunc The function to use to change the subject's value. If not defined, new values will replace
     * old values by variable assignment.
     * @returns A Subject instance.
     */
    static create(v, equalityFunc, mutateFunc) {
        return new Subject(v, equalityFunc !== null && equalityFunc !== void 0 ? equalityFunc : Subject.DEFAULT_EQUALITY_FUNC, mutateFunc);
    }
    /**
     * Sets the value of this subject and notifies subscribers if the value changed.
     * @param value The new value.
     */
    set(value) {
        if (!this.equalityFunc(value, this.value)) {
            if (this.mutateFunc) {
                this.mutateFunc(this.value, value);
            }
            else {
                this.value = value;
            }
            this.notify();
        }
    }
    /**
     * Applies a partial set of properties to this subject's value and notifies subscribers if the value changed as a
     * result.
     * @param value The properties to apply.
     */
    apply(value) {
        let changed = false;
        for (const prop in value) {
            changed = value[prop] !== this.value[prop];
            if (changed) {
                break;
            }
        }
        Object.assign(this.value, value);
        changed && this.notify();
    }
    /** @inheritdoc */
    notify() {
        super.notify();
    }
    /**
     * Gets the value of this subject.
     * @returns The value of this subject.
     */
    get() {
        return this.value;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    map(fn, equalityFunc, mutateFunc, initialVal) {
        const mapFunc = (inputs, previousVal) => fn(inputs[0], previousVal);
        return mutateFunc
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ? MappedSubject.create(mapFunc, equalityFunc, mutateFunc, initialVal, this)
            : MappedSubject.create(mapFunc, equalityFunc !== null && equalityFunc !== void 0 ? equalityFunc : AbstractSubscribable.DEFAULT_EQUALITY_FUNC, this);
    }
}
/**
 * A subscribable subject that is a mapped stream from one or more input subscribables.
 */
class MappedSubject extends AbstractSubscribable {
    /**
     * Creates a new MappedSubject.
     * @param mapFunc The function which maps this subject's inputs to a value.
     * @param equalityFunc The function which this subject uses to check for equality between values.
     * @param mutateFunc The function which this subject uses to change its value.
     * @param initialVal The initial value of this subject.
     * @param inputs The subscribables which provide the inputs to this subject.
     */
    constructor(mapFunc, equalityFunc, mutateFunc, initialVal, ...inputs) {
        super();
        this.mapFunc = mapFunc;
        this.equalityFunc = equalityFunc;
        this.inputs = inputs;
        this.inputValues = inputs.map(input => input.get());
        if (initialVal && mutateFunc) {
            this.value = initialVal;
            mutateFunc(this.value, this.mapFunc(this.inputValues));
            this.mutateFunc = (newVal) => { mutateFunc(this.value, newVal); };
        }
        else {
            this.value = this.mapFunc(this.inputValues);
            this.mutateFunc = (newVal) => { this.value = newVal; };
        }
        this.inputHandlers = this.inputs.map((input, index) => this.updateValue.bind(this, index));
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].sub(this.inputHandlers[i]);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static create(mapFunc, ...args) {
        let equalityFunc, mutateFunc, initialVal;
        if (typeof args[0] === 'function') {
            equalityFunc = args.shift();
        }
        else {
            equalityFunc = MappedSubject.DEFAULT_EQUALITY_FUNC;
        }
        if (typeof args[0] === 'function') {
            mutateFunc = args.shift();
            initialVal = args.shift();
        }
        return new MappedSubject(mapFunc, equalityFunc, mutateFunc, initialVal, ...args);
    }
    /**
     * Updates an input value, then re-maps this subject's value, and notifies subscribers if this results in a change to
     * the mapped value according to this subject's equality function.
     * @param index The index of the input value to update.
     */
    updateValue(index) {
        this.inputValues[index] = this.inputs[index].get();
        const value = this.mapFunc(this.inputValues, this.value);
        if (!this.equalityFunc(this.value, value)) {
            this.mutateFunc(value);
            this.notify();
        }
    }
    /**
     * Gets the current value of the subject.
     * @returns The current value.
     */
    get() {
        return this.value;
    }
    /**
     * Destroys the subscription to the parent subscribable.
     */
    destroy() {
        for (let i = 0; i < this.inputs.length; i++) {
            this.inputs[i].unsub(this.inputHandlers[i]);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    map(fn, equalityFunc, mutateFunc, initialVal) {
        const mapFunc = (inputs, previousVal) => fn(inputs[0], previousVal);
        return new MappedSubject(mapFunc, equalityFunc !== null && equalityFunc !== void 0 ? equalityFunc : MappedSubject.DEFAULT_EQUALITY_FUNC, mutateFunc, initialVal, this);
    }
}

/**
 * A class for subjects that return a computed value.
 * @class ComputedSubject
 * @template I The type of the input value.
 * @template T The type of the computed output value.
 */
class ComputedSubject {
    /**
     * Creates an instance of ComputedSubject.
     * @param value The initial value.
     * @param computeFn The computation function.
     */
    constructor(value, computeFn) {
        this.computeFn = computeFn;
        this._subs = [];
        this._value = value;
        this._computedValue = computeFn(value);
    }
    /**
     * Creates and returns a new ComputedSubject.
     * @param v The initial value of the Subject.
     * @param fn A function which transforms raw values to computed values.
     * @returns A ComputedSubject instance.
     */
    static create(v, fn) {
        return new ComputedSubject(v, fn);
    }
    /**
     * Sets the new value and notifies the subscribers when value changed.
     * @param value The new value.
     */
    set(value) {
        this._value = value;
        const compValue = this.computeFn(value);
        if (compValue !== this._computedValue) {
            this._computedValue = compValue;
            const subLen = this._subs.length;
            for (let i = 0; i < subLen; i++) {
                this._subs[i](this._computedValue, this._value);
            }
        }
    }
    /**
     * Gets the computed value of the Subject.
     * @returns The computed value.
     */
    get() {
        return this._computedValue;
    }
    /**
     * Gets the raw value of the Subject.
     * @returns The raw value.
     */
    getRaw() {
        return this._value;
    }
    /**
     * Subscribes to the subject with a callback function. The function will be called whenever the computed value of
     * this Subject changes.
     * @param fn A callback function.
     * @param initialNotify Whether to immediately notify the callback function with the current compured and raw values
     * of this Subject after it is subscribed. False by default.
     */
    sub(fn, initialNotify) {
        this._subs.push(fn);
        if (initialNotify) {
            fn(this._computedValue, this._value);
        }
    }
    /**
     * Unsubscribes a callback function from this Subject.
     * @param fn The callback function to unsubscribe.
     */
    unsub(fn) {
        const index = this._subs.indexOf(fn);
        if (index >= 0) {
            this._subs.splice(index, 1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    map(fn, equalityFunc, mutateFunc, initialVal) {
        const mapFunc = (inputs, previousVal) => fn(inputs[0], previousVal);
        return mutateFunc
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ? MappedSubject.create(mapFunc, equalityFunc, mutateFunc, initialVal, this)
            : MappedSubject.create(mapFunc, equalityFunc !== null && equalityFunc !== void 0 ? equalityFunc : AbstractSubscribable.DEFAULT_EQUALITY_FUNC, this);
    }
}

/* eslint-disable no-inner-declarations */
/** A releative render position. */
var RenderPosition;
(function (RenderPosition) {
    RenderPosition[RenderPosition["Before"] = 0] = "Before";
    RenderPosition[RenderPosition["After"] = 1] = "After";
    RenderPosition[RenderPosition["In"] = 2] = "In";
})(RenderPosition || (RenderPosition = {}));
/**
 * A display component in the component framework.
 * @typedef P The type of properties for this component.
 * @typedef C The type of context that this component might have.
 */
class DisplayComponent {
    /**
     * Creates an instance of a DisplayComponent.
     * @param props The propertis of the component.
     */
    constructor(props) {
        /** The context on this component, if any. */
        this.context = undefined;
        /** The type of context for this component, if any. */
        this.contextType = undefined;
        this.props = props;
    }
    /**
     * A callback that is called before the component is rendered.
     */
    onBeforeRender() { return; }
    /**
     * A callback that is called after the component is rendered.
     * @param node The component's VNode.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAfterRender(node) { return; }
    /**
     * Destroys this component.
     */
    destroy() { return; }
    /**
     * Gets a context data subscription from the context collection.
     * @param context The context to get the subscription for.
     * @returns The requested context.
     * @throws An error if no data for the specified context type could be found.
     */
    getContext(context) {
        if (this.context !== undefined && this.contextType !== undefined) {
            const index = this.contextType.indexOf(context);
            return this.context[index];
        }
        throw new Error('Could not find the provided context type.');
    }
}
/**
 * A reference to a component or element node.
 */
class NodeReference {
    constructor() {
        /** The internal reference instance. */
        this._instance = null;
    }
    /**
     * The instance of the element or component.
     * @returns The instance of the element or component.
     */
    get instance() {
        if (this._instance !== null) {
            return this._instance;
        }
        throw new Error('Instance was null.');
    }
    /**
     * Sets the value of the instance.
     */
    set instance(val) {
        this._instance = val;
    }
    /**
     * Gets the instance, or null if the instance is not populated.
     * @returns The component or element instance.
     */
    getOrDefault() {
        return this._instance;
    }
}
/**
 * Provides a context of data that can be passed down to child components via a provider.
 */
class Context {
    /**
     * Creates an instance of a Context.
     * @param defaultValue The default value of this context.
     */
    constructor(defaultValue) {
        this.defaultValue = defaultValue;
        /**
         * The provider component that can be set to a specific context value.
         * @param props The props of the provider component.
         * @returns A new context provider.
         */
        this.Provider = (props) => new ContextProvider(props, this);
    }
}
/**
 * A provider component that can be set to a specific context value.
 */
class ContextProvider extends DisplayComponent {
    /**
     * Creates an instance of a ContextProvider.
     * @param props The props on the component.
     * @param parent The parent context instance for this provider.
     */
    constructor(props, parent) {
        super(props);
        this.parent = parent;
    }
    /** @inheritdoc */
    render() {
        var _a;
        const children = (_a = this.props.children) !== null && _a !== void 0 ? _a : [];
        return FSComponent.buildComponent(FSComponent.Fragment, this.props, ...children);
    }
}
/**
 * The FS component namespace.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
var FSComponent;
(function (FSComponent) {
    /**
     * Valid SVG element tags.
     */
    const svgTags = {
        'circle': true,
        'clipPath': true,
        'color-profile': true,
        'cursor': true,
        'defs': true,
        'desc': true,
        'ellipse': true,
        'g': true,
        'image': true,
        'line': true,
        'linearGradient': true,
        'marker': true,
        'mask': true,
        'path': true,
        'pattern': true,
        'polygon': true,
        'polyline': true,
        'radialGradient': true,
        'rect': true,
        'stop': true,
        'svg': true,
        'text': true
    };
    /**
     * A fragment of existing elements with no specific root.
     * @param props The fragment properties.
     * @returns The fragment children.
     */
    function Fragment(props) {
        return props.children;
    }
    FSComponent.Fragment = Fragment;
    /**
     * Builds a JSX based FSComponent.
     * @param type The DOM element tag that will be built.
     * @param props The properties to apply to the DOM element.
     * @param children Any children of this DOM element.
     * @returns The JSX VNode for the component or element.
     */
    // eslint-disable-next-line no-inner-declarations
    function buildComponent(type, props, ...children) {
        let vnode = null;
        if (typeof type === 'string') {
            let element;
            if (svgTags[type] !== undefined) {
                element = document.createElementNS('http://www.w3.org/2000/svg', type);
            }
            else {
                element = document.createElement(type);
            }
            if (props !== null) {
                for (const key in props) {
                    if (key === 'ref' && props.ref !== undefined) {
                        props.ref.instance = element;
                    }
                    else {
                        const prop = props[key];
                        if (prop instanceof Subject || prop instanceof MappedSubject || prop instanceof ComputedSubject) {
                            element.setAttribute(key, prop.get());
                            prop.sub((v) => {
                                element.setAttribute(key, v);
                            });
                        }
                        else {
                            element.setAttribute(key, prop);
                        }
                    }
                }
            }
            vnode = {
                instance: element,
                props: props,
                children: null
            };
            vnode.children = createChildNodes(vnode, children);
        }
        else if (typeof type === 'function') {
            if (children !== null && props === null) {
                props = {
                    children: children
                };
            }
            else if (props !== null) {
                props.children = children;
            }
            if (typeof type === 'function' && type.name === 'Fragment') {
                let childNodes = type(props);
                //Handle the case where the single fragment children is an array of nodes passsed down from above
                if (childNodes !== null && childNodes.length > 0 && Array.isArray(childNodes[0])) {
                    childNodes = childNodes[0];
                }
                vnode = {
                    instance: null,
                    props,
                    children: childNodes
                };
            }
            else {
                let instance;
                try {
                    instance = type(props);
                }
                catch (_a) {
                    instance = new type(props);
                }
                if (props !== null && props.ref !== null && props.ref !== undefined) {
                    props.ref.instance = instance;
                }
                if (instance.contextType !== undefined) {
                    instance.context = instance.contextType.map(c => Subject.create(c.defaultValue));
                }
                vnode = {
                    instance,
                    props,
                    children: [instance.render()]
                };
            }
        }
        return vnode;
    }
    FSComponent.buildComponent = buildComponent;
    /**
     * Creates the collection of child VNodes.
     * @param parent The parent VNode.
     * @param children The JSX children to convert to nodes.
     * @returns A collection of child VNodes.
     */
    function createChildNodes(parent, children) {
        let vnodes = null;
        if (children !== null && children !== undefined && children.length > 0) {
            vnodes = [];
            for (const child of children) {
                if (child !== null) {
                    if (child instanceof Subject || child instanceof MappedSubject || child instanceof ComputedSubject) {
                        const subjectValue = child.get().toString();
                        const node = {
                            instance: subjectValue === '' ? ' ' : subjectValue,
                            children: null,
                            props: null,
                            root: undefined,
                        };
                        child.sub((v) => {
                            if (node.root !== undefined) {
                                // TODO workaround. gotta find a solution for the text node vanishing when text is empty
                                node.root.nodeValue = v === '' ? ' ' : v.toString();
                            }
                        });
                        vnodes.push(node);
                    }
                    else if (child instanceof Array) {
                        const arrayNodes = createChildNodes(parent, child);
                        if (arrayNodes !== null) {
                            vnodes.push(...arrayNodes);
                        }
                    }
                    else if (typeof child === 'string' || typeof child === 'number') {
                        vnodes.push(createStaticContentNode(child));
                    }
                    else if (typeof child === 'object') {
                        vnodes.push(child);
                    }
                }
            }
        }
        return vnodes;
    }
    FSComponent.createChildNodes = createChildNodes;
    /**
     * Creates a static content VNode.
     * @param content The content to create a node for.
     * @returns A static content VNode.
     */
    function createStaticContentNode(content) {
        return {
            instance: content,
            children: null,
            props: null
        };
    }
    FSComponent.createStaticContentNode = createStaticContentNode;
    /**
     * Renders a VNode to a DOM element.
     * @param node The node to render.
     * @param element The DOM element to render to.
     * @param position The RenderPosition to put the item in.
     */
    function render(node, element, position = RenderPosition.In) {
        if (node.children && node.children.length > 0 && element !== null) {
            const componentInstance = node.instance;
            if (componentInstance !== null && componentInstance.onBeforeRender !== undefined) {
                componentInstance.onBeforeRender();
            }
            if (node.instance instanceof HTMLElement || node.instance instanceof SVGElement) {
                insertNode(node, position, element);
            }
            else {
                for (const child of node.children) {
                    insertNode(child, position, element);
                }
            }
            const instance = node.instance;
            if (instance instanceof ContextProvider) {
                visitNodes(node, (n) => {
                    const nodeInstance = n.instance;
                    if (nodeInstance !== null && nodeInstance.contextType !== undefined) {
                        const contextSlot = nodeInstance.contextType.indexOf(instance.parent);
                        if (contextSlot >= 0) {
                            if (nodeInstance.context === undefined) {
                                nodeInstance.context = [];
                            }
                            nodeInstance.context[contextSlot].set(instance.props.value);
                        }
                        if (nodeInstance instanceof ContextProvider && nodeInstance !== instance && nodeInstance.parent === instance.parent) {
                            return true;
                        }
                    }
                    return false;
                });
            }
            if (componentInstance !== null && componentInstance.onAfterRender !== undefined) {
                componentInstance.onAfterRender(node);
            }
        }
    }
    FSComponent.render = render;
    /**
     * Inserts a node into the DOM.
     * @param node The node to insert.
     * @param position The position to insert the node in.
     * @param element The element to insert relative to.
     */
    function insertNode(node, position, element) {
        var _a, _b, _c, _d, _e, _f;
        if (node.instance instanceof HTMLElement || node.instance instanceof SVGElement) {
            switch (position) {
                case RenderPosition.In:
                    element.appendChild(node.instance);
                    node.root = (_a = element.lastChild) !== null && _a !== void 0 ? _a : undefined;
                    break;
                case RenderPosition.Before:
                    element.insertAdjacentElement('beforebegin', node.instance);
                    node.root = (_b = element.previousSibling) !== null && _b !== void 0 ? _b : undefined;
                    break;
                case RenderPosition.After:
                    element.insertAdjacentElement('afterend', node.instance);
                    node.root = (_c = element.nextSibling) !== null && _c !== void 0 ? _c : undefined;
                    break;
            }
            if (node.children !== null) {
                for (const child of node.children) {
                    insertNode(child, RenderPosition.In, node.instance);
                }
            }
        }
        else if (typeof node.instance === 'string') {
            switch (position) {
                case RenderPosition.In:
                    element.insertAdjacentHTML('beforeend', node.instance);
                    node.root = (_d = element.lastChild) !== null && _d !== void 0 ? _d : undefined;
                    break;
                case RenderPosition.Before:
                    element.insertAdjacentHTML('beforebegin', node.instance);
                    node.root = (_e = element.previousSibling) !== null && _e !== void 0 ? _e : undefined;
                    break;
                case RenderPosition.After:
                    element.insertAdjacentHTML('afterend', node.instance);
                    node.root = (_f = element.nextSibling) !== null && _f !== void 0 ? _f : undefined;
                    break;
            }
        }
        else if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                render(node[i], element);
            }
        }
        else {
            render(node, element);
        }
    }
    /**
     * Render a node before a DOM element.
     * @param node The node to render.
     * @param element The element to render boeore.
     */
    function renderBefore(node, element) {
        render(node, element, RenderPosition.Before);
    }
    FSComponent.renderBefore = renderBefore;
    /**
     * Render a node after a DOM element.
     * @param node The node to render.
     * @param element The element to render after.
     */
    function renderAfter(node, element) {
        render(node, element, RenderPosition.After);
    }
    FSComponent.renderAfter = renderAfter;
    /**
     * Remove a previously rendered element.  Currently, this is just a simple
     * wrapper so that all of our high-level "component maniuplation" state is kept
     * in the FSComponent API, but it's not doing anything other than a simple
     * remove() on the element.   This can probably be enhanced.
     * @param element The element to remove.
     */
    function remove(element) {
        if (element !== null) {
            element.remove();
        }
    }
    FSComponent.remove = remove;
    /**
     * Creates a component or element node reference.
     * @returns A new component or element node reference.
     */
    function createRef() {
        return new NodeReference();
    }
    FSComponent.createRef = createRef;
    /**
     * Creates a new context to hold data for passing to child components.
     * @param defaultValue The default value of this context.
     * @returns A new context.
     */
    function createContext(defaultValue) {
        return new Context(defaultValue);
    }
    FSComponent.createContext = createContext;
    /**
     * Visits VNodes with a supplied visitor function within the given children tree.
     * @param node The node to visit.
     * @param visitor The visitor function to inspect VNodes with. Return true if the search should stop at the visited
     * node and not proceed any further down the node's children.
     * @returns True if the visitation should break, or false otherwise.
     */
    function visitNodes(node, visitor) {
        const stopVisitation = visitor(node);
        if (!stopVisitation && node.children !== null) {
            for (let i = 0; i < node.children.length; i++) {
                visitNodes(node.children[i], visitor);
            }
        }
        return true;
    }
    FSComponent.visitNodes = visitNodes;
    /**
     * An empty callback handler.
     */
    FSComponent.EmptyHandler = () => { return; };
})(FSComponent || (FSComponent = {}));
FSComponent.Fragment;

/**
 * A number with an associated unit. Each NumberUnit is created with a reference unit type,
 * which cannot be changed after instantiation. The reference unit type determines how the
 * value of the NumberUnit is internally represented. Each NumberUnit also maintains an
 * active unit type, which can be dynamically changed at any time.
 */
class NumberUnit {
    /**
     * Constructor.
     * @param number - the initial numeric value of the new NumberUnit.
     * @param unit - the unit type of the new NumberUnit.
     */
    constructor(number, unit) {
        this._number = number;
        this._unit = unit;
        this.readonly = new NumberUnitReadOnly(this);
    }
    /**
     * Gets this NumberUnit's numeric value.
     * @returns This NumberUnit's numeric value.
     */
    get number() {
        return this._number;
    }
    /**
     * Gets this NumberUnit's unit type.
     * @returns This NumberUnit's unit type.
     */
    get unit() {
        return this._unit;
    }
    /**
     * Converts a value to a numeric value with this NumberUnit's unit type.
     * @param value - the value.
     * @param unit - the unit type of the new value. Defaults to this NumberUnit's unit type. This argument is ignored if
     * value is a NumberUnit.
     * @returns the numeric of the value with this NumberUnit's unit type.
     */
    toNumberOfThisUnit(value, unit) {
        if ((typeof value !== 'number') && this.unit.canConvert(value.unit)) {
            return this.unit.convertFrom(value.number, value.unit);
        }
        if (typeof value === 'number' && (!unit || this.unit.canConvert(unit))) {
            return unit ? this.unit.convertFrom(value, unit) : value;
        }
        return undefined;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    set(arg1, arg2) {
        const converted = this.toNumberOfThisUnit(arg1, arg2);
        if (converted !== undefined) {
            this._number = converted;
            return this;
        }
        throw new Error('Invalid unit conversion attempted.');
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    add(arg1, arg2, arg3) {
        const isArg2NumberUnit = arg2 instanceof NumberUnit;
        const converted = this.toNumberOfThisUnit(arg1, isArg2NumberUnit ? undefined : arg2);
        if (converted !== undefined) {
            let out = isArg2NumberUnit ? arg2 : arg3;
            if (out) {
                out.set(this.number + converted, this.unit);
            }
            else {
                out = this;
                this._number += converted;
            }
            return out;
        }
        throw new Error('Invalid unit conversion attempted.');
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    subtract(arg1, arg2, arg3) {
        const isArg2NumberUnit = arg2 instanceof NumberUnit;
        const converted = this.toNumberOfThisUnit(arg1, isArg2NumberUnit ? undefined : arg2);
        if (converted !== undefined) {
            let out = isArg2NumberUnit ? arg2 : arg3;
            if (out) {
                out.set(this.number - converted, this.unit);
            }
            else {
                out = this;
                this._number -= converted;
            }
            return out;
        }
        throw new Error('Invalid unit conversion attempted.');
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    scale(factor, out) {
        if (out) {
            return out.set(this.number * factor, this.unit);
        }
        else {
            this._number *= factor;
            return this;
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    ratio(value, unit) {
        const converted = this.toNumberOfThisUnit(value, unit);
        if (converted) {
            return this.number / converted;
        }
        throw new Error('Invalid unit conversion attempted.');
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    abs(out) {
        if (out) {
            return out.set(Math.abs(this.number), this.unit);
        }
        else {
            this._number = Math.abs(this._number);
            return this;
        }
    }
    /**
     * Returns the numeric value of this NumberUnit after conversion to a specified unit.
     * @param unit The unit to which to convert.
     * @returns The converted numeric value.
     * @throws Error if this NumberUnit's unit type cannot be converted to the specified unit.
     */
    asUnit(unit) {
        return this.unit.convertTo(this.number, unit);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    compare(value, unit) {
        const converted = this.toNumberOfThisUnit(value, unit);
        if (converted === undefined) {
            throw new Error('Invalid unit conversion attempted.');
        }
        const diff = this.number - converted;
        if (Math.abs(diff) < 1e-14) {
            return 0;
        }
        return Math.sign(diff);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    equals(value, unit) {
        const converted = this.toNumberOfThisUnit(value, unit);
        if (converted === undefined) {
            return false;
        }
        const diff = this.number - converted;
        return Math.abs(diff) < 1e-14;
    }
    /**
     * Checks whether this NumberUnit has a numeric value of NaN.
     * @returns Whether this NumberUnit has a numeric value of NaN.
     */
    isNaN() {
        return isNaN(this.number);
    }
    /**
     * Copies this NumberUnit.
     * @returns A copy of this NumberUnit.
     */
    copy() {
        return new NumberUnit(this.number, this.unit);
    }
}
/**
 * A read-only interface for a WT_NumberUnit.
 */
class NumberUnitReadOnly {
    /**
     * Constructor.
     * @param source - the source of the new read-only NumberUnit.
     */
    constructor(source) {
        this.source = source;
    }
    /**
     * Gets this NumberUnit's numeric value.
     * @returns This NumberUnit's numeric value.
     */
    get number() {
        return this.source.number;
    }
    /**
     * Gets this NumberUnit's unit type.
     * @returns This NumberUnit's unit type.
     */
    get unit() {
        return this.source.unit;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    add(arg1, arg2, arg3) {
        const isArg2NumberUnit = arg2 instanceof NumberUnit;
        const out = (isArg2NumberUnit ? arg2 : arg3);
        if (typeof arg1 === 'number') {
            return this.source.add(arg1, arg2, out);
        }
        else {
            return this.source.add(arg1, out);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    subtract(arg1, arg2, arg3) {
        const isArg2NumberUnit = arg2 instanceof NumberUnit;
        const out = (isArg2NumberUnit ? arg2 : arg3);
        if (typeof arg1 === 'number') {
            return this.source.subtract(arg1, arg2, out);
        }
        else {
            return this.source.subtract(arg1, out);
        }
    }
    /**
     * Scales this NumberUnit by a unit-less factor and returns the result.
     * @param factor The factor by which to scale.
     * @param out The NumberUnit to which to write the result.
     * @returns The scaled value.
     */
    scale(factor, out) {
        return this.source.scale(factor, out);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    ratio(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.ratio(arg1, arg2);
        }
        else {
            return this.source.ratio(arg1);
        }
    }
    /**
     * Calculates the absolute value of this NumberUnit and returns the result.
     * @param out The NumberUnit to which to write the result.
     * @returns The absolute value.
     */
    abs(out) {
        return this.source.abs(out);
    }
    /**
     * Returns the numeric value of this NumberUnit after conversion to a specified unit.
     * @param unit The unit to which to convert.
     * @returns The converted numeric value.
     * @throws Error if this NumberUnit's unit type cannot be converted to the specified unit.
     */
    asUnit(unit) {
        return this.source.asUnit(unit);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    compare(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.compare(arg1, arg2);
        }
        else {
            return this.source.compare(arg1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    equals(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.equals(arg1, arg2);
        }
        else {
            return this.source.equals(arg1);
        }
    }
    /**
     * Checks whether this NumberUnit has a numeric value of NaN.
     * @returns Whether this NumberUnit has a numeric value of NaN.
     */
    isNaN() {
        return this.source.isNaN();
    }
    /**
     * Copies this NumberUnit.
     * @returns A copy of this NumberUnit.
     */
    copy() {
        return this.source.copy();
    }
}
/**
 * A unit of measurement.
 */
class AbstractUnit {
    /**
     * Constructor.
     * @param name The name of this unit.
     */
    constructor(name) {
        this.name = name;
    }
    /** @inheritdoc */
    canConvert(otherUnit) {
        return this.family === otherUnit.family;
    }
    /** @inheritdoc */
    createNumber(value) {
        return new NumberUnit(value, this);
    }
    /** @inheritdoc */
    equals(other) {
        return this.family === other.family && this.name === other.name;
    }
}
/**
 * A unit that can be converted to another unit of the same type via a fixed linear transformation.
 */
class SimpleUnit extends AbstractUnit {
    /**
     * Constructor.
     * @param family The family to which this unit belongs.
     * @param name The name of this unit.
     * @param scaleFactor The relative linear scale of the new unit compared to the standard unit of the same family.
     * @param zeroOffset The zero offset of the new unit compared to the standard unit of the same family.
     */
    constructor(family, name, scaleFactor, zeroOffset = 0) {
        super(name);
        this.family = family;
        this.scaleFactor = scaleFactor;
        this.zeroOffset = zeroOffset;
    }
    /** @inheritdoc */
    canConvert(otherUnit) {
        return otherUnit instanceof SimpleUnit && super.canConvert(otherUnit);
    }
    /** @inheritdoc */
    convertTo(value, toUnit) {
        if (!this.canConvert(toUnit)) {
            throw new Error(`Invalid conversion from ${this.name} to ${toUnit.name}.`);
        }
        return (value + this.zeroOffset) * (this.scaleFactor / toUnit.scaleFactor) - toUnit.zeroOffset;
    }
    /** @inheritdoc */
    convertFrom(value, fromUnit) {
        if (!this.canConvert(fromUnit)) {
            throw new Error(`Invalid conversion from ${fromUnit.name} to ${this.name}.`);
        }
        return (value + fromUnit.zeroOffset) * (fromUnit.scaleFactor / this.scaleFactor) - this.zeroOffset;
    }
}
/**
 * A unit of measure composed of the multiplicative combination of multiple elementary units.
 */
class CompoundUnit extends AbstractUnit {
    /**
     * Constructor.
     * @param family The family to which this unit belongs.
     * @param numerator An array of CompoundableUnits containing all the units in the numerator of the compound unit.
     * @param denominator An array of CompoundableUnits containing all the units in the denominator of the compound unit.
     * @param name The name of this unit. If not defined, one will be automatically generated.
     */
    constructor(family, numerator, denominator, name) {
        // if not specified, build name from component units.
        if (name === undefined) {
            name = '';
            let i = 0;
            while (i < numerator.length - 1) {
                name += `${numerator[i].name}-`;
            }
            name += `${numerator[i].name}`;
            if (denominator.length > 0) {
                name += ' per ';
                i = 0;
                while (i < denominator.length - 1) {
                    name += `${denominator[i].name}-`;
                }
                name += `${denominator[i].name}`;
            }
        }
        super(name);
        this.family = family;
        this.numerator = Array.from(numerator);
        this.denominator = Array.from(denominator);
        this.numerator.sort((a, b) => a.family.localeCompare(b.family));
        this.denominator.sort((a, b) => a.family.localeCompare(b.family));
        this.scaleFactor = this.getScaleFactor();
    }
    /**
     * Gets the scale factor for this unit.
     * @returns the scale factor for this unit.
     */
    getScaleFactor() {
        let factor = 1;
        factor = this.numerator.reduce((prev, curr) => prev * curr.scaleFactor, factor);
        factor = this.denominator.reduce((prev, curr) => prev / curr.scaleFactor, factor);
        return factor;
    }
    /** @inheritdoc */
    canConvert(otherUnit) {
        return otherUnit instanceof CompoundUnit && super.canConvert(otherUnit);
    }
    /** @inheritdoc */
    convertTo(value, toUnit) {
        if (!this.canConvert(toUnit)) {
            throw new Error(`Invalid conversion from ${this.name} to ${toUnit.name}.`);
        }
        return value * (this.scaleFactor / toUnit.scaleFactor);
    }
    /** @inheritdoc */
    convertFrom(value, fromUnit) {
        if (!this.canConvert(fromUnit)) {
            throw new Error(`Invalid conversion from ${fromUnit.name} to ${this.name}.`);
        }
        return value * (fromUnit.scaleFactor / this.scaleFactor);
    }
}
/**
 * Predefined unit families.
 */
var UnitFamily;
(function (UnitFamily) {
    UnitFamily["Distance"] = "distance";
    UnitFamily["Angle"] = "angle";
    UnitFamily["Duration"] = "duration";
    UnitFamily["Weight"] = "weight";
    UnitFamily["Volume"] = "volume";
    UnitFamily["Pressure"] = "pressure";
    UnitFamily["Temperature"] = "temperature";
    UnitFamily["Speed"] = "speed";
    UnitFamily["WeightFlux"] = "weight_flux";
    UnitFamily["VolumeFlux"] = "volume_flux";
})(UnitFamily || (UnitFamily = {}));
/**
 * Predefined unit types.
 */
class UnitType {
}
UnitType.METER = new SimpleUnit(UnitFamily.Distance, 'meter', 1);
UnitType.FOOT = new SimpleUnit(UnitFamily.Distance, 'foot', 0.3048);
UnitType.KILOMETER = new SimpleUnit(UnitFamily.Distance, 'kilometer', 1000);
UnitType.MILE = new SimpleUnit(UnitFamily.Distance, 'mile', 1609.34);
UnitType.NMILE = new SimpleUnit(UnitFamily.Distance, 'nautical mile', 1852);
UnitType.GA_RADIAN = new SimpleUnit(UnitFamily.Distance, 'great arc radian', 6378100);
UnitType.RADIAN = new SimpleUnit(UnitFamily.Angle, 'radian', 1);
UnitType.DEGREE = new SimpleUnit(UnitFamily.Angle, 'degree', Math.PI / 180);
UnitType.ARC_MIN = new SimpleUnit(UnitFamily.Angle, 'minute', Math.PI / 180 / 60);
UnitType.ARC_SEC = new SimpleUnit(UnitFamily.Angle, 'second', Math.PI / 180 / 3600);
UnitType.MILLISECOND = new SimpleUnit(UnitFamily.Duration, 'millisecond', 0.001);
UnitType.SECOND = new SimpleUnit(UnitFamily.Duration, 'second', 1);
UnitType.MINUTE = new SimpleUnit(UnitFamily.Duration, 'minute', 60);
UnitType.HOUR = new SimpleUnit(UnitFamily.Duration, 'hour', 3600);
UnitType.KILOGRAM = new SimpleUnit(UnitFamily.Weight, 'kilogram', 1);
UnitType.POUND = new SimpleUnit(UnitFamily.Weight, 'pound', 0.453592);
UnitType.TON = new SimpleUnit(UnitFamily.Weight, 'ton', 907.185);
UnitType.TONNE = new SimpleUnit(UnitFamily.Weight, 'tonne', 1000);
// the following fuel units use the generic conversion factor of 1 gal = 6.7 lbs
UnitType.LITER_FUEL = new SimpleUnit(UnitFamily.Weight, 'liter', 0.80283679);
UnitType.GALLON_FUEL = new SimpleUnit(UnitFamily.Weight, 'gallon', 3.0390664);
UnitType.LITER = new SimpleUnit(UnitFamily.Volume, 'liter', 1);
UnitType.GALLON = new SimpleUnit(UnitFamily.Volume, 'gallon', 3.78541);
UnitType.HPA = new SimpleUnit(UnitFamily.Pressure, 'hectopascal', 1);
UnitType.ATM = new SimpleUnit(UnitFamily.Pressure, 'atmosphere', 1013.25);
UnitType.IN_HG = new SimpleUnit(UnitFamily.Pressure, 'inch of mercury', 33.8639);
UnitType.MM_HG = new SimpleUnit(UnitFamily.Pressure, 'millimeter of mercury', 1.33322);
UnitType.CELSIUS = new SimpleUnit(UnitFamily.Temperature, '° Celsius', 1, 273.15);
UnitType.FAHRENHEIT = new SimpleUnit(UnitFamily.Temperature, '° Fahrenheit', 5 / 9, 459.67);
UnitType.KNOT = new CompoundUnit(UnitFamily.Speed, [UnitType.NMILE], [UnitType.HOUR], 'knot');
UnitType.KPH = new CompoundUnit(UnitFamily.Speed, [UnitType.KILOMETER], [UnitType.HOUR]);
UnitType.MPM = new CompoundUnit(UnitFamily.Speed, [UnitType.METER], [UnitType.MINUTE]);
UnitType.MPS = new CompoundUnit(UnitFamily.Speed, [UnitType.METER], [UnitType.SECOND]);
UnitType.FPM = new CompoundUnit(UnitFamily.Speed, [UnitType.FOOT], [UnitType.MINUTE]);
UnitType.FPS = new CompoundUnit(UnitFamily.Speed, [UnitType.FOOT], [UnitType.SECOND]);
UnitType.KGH = new CompoundUnit(UnitFamily.WeightFlux, [UnitType.KILOGRAM], [UnitType.HOUR]);
UnitType.PPH = new CompoundUnit(UnitFamily.WeightFlux, [UnitType.POUND], [UnitType.HOUR]);
UnitType.LPH_FUEL = new CompoundUnit(UnitFamily.WeightFlux, [UnitType.LITER_FUEL], [UnitType.HOUR]);
UnitType.GPH_FUEL = new CompoundUnit(UnitFamily.WeightFlux, [UnitType.GALLON_FUEL], [UnitType.HOUR]);

/**
 * A class for conversions of degree units.
 */
class Degrees {
    constructor() {
        /**
         * Converts degrees to radians.
         * @param degrees The degrees to convert.
         * @returns The result as radians.
         */
        this.toRadians = (degrees) => degrees * (Math.PI / 180);
    }
}
/**
 * A class for conversions of foot units.
 */
class Feet {
    constructor() {
        /**
         * Converts feet to meters.
         * @param feet The feet to convert.
         * @returns The result as meters.
         */
        this.toMeters = (feet) => feet * 0.3048;
        /**
         * Converts feet to nautical miles.
         * @param feet The feet to convert.
         * @returns The result as nautical miles.
         */
        this.toNauticalMiles = (feet) => feet / 6076.11549;
    }
}
/**
 * A class for conversions of meter units.
 */
class Meters {
    constructor() {
        /**
         * Converts meters to feet.
         * @param meters The meters to convert.
         * @returns The result as feet.
         */
        this.toFeet = (meters) => meters / 0.3048;
        /**
         * Converts meters to nautical miles.
         * @param meters The meters to convert.
         * @returns The result as nautical miles.
         */
        this.toNauticalMiles = (meters) => meters / 1852;
    }
}
/**
 * A class for conversions of nautical mile units.
 */
class NauticalMiles {
    constructor() {
        /**
         * Converts nautical miles to feet.
         * @param nm The nautical miles to convert.
         * @returns The result as feet.
         */
        this.toFeet = (nm) => nm * 6076.11549;
        /**
         * Converts nautical miles to meters.
         * @param nm The nautical miles to convert.
         * @returns The result as meters.
         */
        this.toMeters = (nm) => nm * 1852;
    }
}
/**
 * A class for conversions of radian units.
 */
class Radians {
    constructor() {
        /**
         * Converts radians to degrees.
         * @param radians The radians to convert.
         * @returns The result as degrees.
         */
        this.toDegrees = (radians) => radians * 180 / Math.PI;
    }
}
/**
 * A class for unit conversions.
 */
class Units {
}
/** The degrees unit. */
Units.Degrees = new Degrees();
/** The radians unit. */
Units.Radians = new Radians();
/** The feet unit. */
Units.Feet = new Feet();
/** The meters unit. */
Units.Meters = new Meters();
/** The nautical miles unit. */
Units.NauticalMiles = new NauticalMiles();

/**
 * 2D vector mathematical opertaions.
 */
/**
 * 3D vector mathematical opertaions.
 */
class Vec3Math {
    /**
     * Gets the spherical angle theta of a vector in radians.
     * @param vec - a vector.
     * @returns the spherical angle theta of the vector.
     */
    static theta(vec) {
        return Math.atan2(Math.hypot(vec[0], vec[1]), vec[2]);
    }
    /**
     * Gets the spherical angle phi of a vector in radians.
     * @param vec - a vector.
     * @returns the spherical angle phi of the vector.
     */
    static phi(vec) {
        return Math.atan2(vec[1], vec[0]);
    }
    /**
     * Sets the components of a vector.
     * @param x - the new x-component.
     * @param y - the new y-component.
     * @param z - the new z-component.
     * @param vec - the vector to change.
     * @returns the vector after it has been changed.
     */
    static set(x, y, z, vec) {
        vec[0] = x;
        vec[1] = y;
        vec[2] = z;
        return vec;
    }
    /**
     * Sets the spherical components of a vector.
     * @param r - the new length (magnitude).
     * @param theta - the new spherical angle theta, in radians.
     * @param phi - the new spherical angle phi, in radians.
     * @param vec - the vector to change.
     * @returns the vector after it has been changed.
     */
    static setFromSpherical(r, theta, phi, vec) {
        const sinTheta = Math.sin(theta);
        vec[0] = sinTheta * Math.cos(phi);
        vec[1] = sinTheta * Math.sin(phi);
        vec[2] = Math.cos(theta);
        return vec;
    }
    /**
     * Add one vector to another.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @param out The vector to write the results to.
     * @returns the vector sum.
     */
    static add(v1, v2, out) {
        out[0] = v1[0] + v2[0];
        out[1] = v1[1] + v2[1];
        out[2] = v1[2] + v2[2];
        return out;
    }
    /**
     * Subtracts one vector from another.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @param out The vector to write the results to.
     * @returns the vector difference.
     */
    static sub(v1, v2, out) {
        out[0] = v1[0] - v2[0];
        out[1] = v1[1] - v2[1];
        out[2] = v1[2] - v2[2];
        return out;
    }
    /**
     * Gets the dot product of two vectors.
     * @param v1 The first vector.
     * @param v2 The second vector.
     * @returns The dot product of the vectors.
     */
    static dot(v1, v2) {
        return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    }
    /**
     * Gets the cross product of two vectors.
     * @param v1 - the first vector.
     * @param v2 - the second vector.
     * @param out - the vector to which to write the result.
     * @returns the cross product.
     */
    static cross(v1, v2, out) {
        const x1 = v1[0];
        const y1 = v1[1];
        const z1 = v1[2];
        const x2 = v2[0];
        const y2 = v2[1];
        const z2 = v2[2];
        out[0] = y1 * z2 - z1 * y2;
        out[1] = z1 * x2 - x1 * z2;
        out[2] = x1 * y2 - y1 * x2;
        return out;
    }
    /**
     * Multiplies a vector by a scalar.
     * @param v1 The vector to multiply.
     * @param scalar The scalar to apply.
     * @param out The vector to write the results to.
     * @returns The scaled vector.
     */
    static multScalar(v1, scalar, out) {
        out[0] = v1[0] * scalar;
        out[1] = v1[1] * scalar;
        out[2] = v1[2] * scalar;
        return out;
    }
    /**
     * Gets the magnitude of a vector.
     * @param v1 The vector to get the magnitude for.
     * @returns the vector's magnitude.
     */
    static abs(v1) {
        return Math.hypot(v1[0], v1[1], v1[2]);
    }
    /**
     * Normalizes the vector to a unit vector.
     * @param v1 The vector to normalize.
     * @param out The vector to write the results to.
     * @returns the normalized vector.
     */
    static normalize(v1, out) {
        const mag = Vec3Math.abs(v1);
        out[0] = v1[0] / mag;
        out[1] = v1[1] / mag;
        out[2] = v1[2] / mag;
        return out;
    }
    /**
     * Gets the Euclidean distance between two vectors.
     * @param vec1 The first vector.
     * @param vec2 The second vector.
     * @returns the Euclidean distance between the two vectors.
     */
    static distance(vec1, vec2) {
        return Math.hypot(vec2[0] - vec1[0], vec2[1] - vec1[0], vec2[2] - vec1[2]);
    }
    /**
     * Checks if two vectors are equal.
     * @param vec1 - the first vector.
     * @param vec2 - the second vector.
     * @returns whether the two vectors are equal.
     */
    static equals(vec1, vec2) {
        return vec1.length === vec2.length && vec1.every((element, index) => element === vec2[index]);
    }
    /**
     * Copies one vector to another.
     * @param from - the vector from which to copy.
     * @param to - the vector to which to copy.
     * @returns the changed vector.
     */
    static copy(from, to) {
        return Vec3Math.set(from[0], from[1], from[2], to);
    }
}

/**
 * A read-only wrapper for a GeoPoint.
 */
class GeoPointReadOnly {
    /**
     * Constructor.
     * @param source - the source of the new read-only point.
     */
    constructor(source) {
        this.source = source;
    }
    /**
     * The latitude of this point, in degrees.
     * @returns the latitude of this point.
     */
    get lat() {
        return this.source.lat;
    }
    /**
     * The longitude of this point, in degrees.
     * @returns the longitude of this point.
     */
    get lon() {
        return this.source.lon;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    distance(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.distance(arg1, arg2);
        }
        else {
            return this.source.distance(arg1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    distanceRhumb(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.distanceRhumb(arg1, arg2);
        }
        else {
            return this.source.distanceRhumb(arg1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingTo(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.bearingTo(arg1, arg2);
        }
        else {
            return this.source.bearingTo(arg1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingFrom(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.bearingFrom(arg1, arg2);
        }
        else {
            return this.source.bearingFrom(arg1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingRhumb(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return this.source.bearingRhumb(arg1, arg2);
        }
        else {
            return this.source.bearingRhumb(arg1);
        }
    }
    /**
     * Offsets this point by an initial bearing and distance along a great circle.
     * @param bearing - the initial bearing (forward azimuth) by which to offset.
     * @param distance - the distance, in great-arc radians, by which to offset.
     * @param out - the GeoPoint to which to write the results. If not supplied, a new GeoPoint object is created.
     * @returns the offset point.
     * @throws {Error} argument out cannot be undefined.
     */
    offset(bearing, distance, out) {
        if (!out) {
            throw new Error('Cannot mutate a read-only GeoPoint.');
        }
        return this.source.offset(bearing, distance, out);
    }
    /**
     * Offsets this point by a constant bearing and distance along a rhumb line.
     * @param bearing - the bearing by which to offset.
     * @param distance - the distance, in great-arc radians, by which to offset.
     * @param out - the GeoPoint to which to write the results. If not supplied, a new GeoPoint object is created.
     * @returns the offset point.
     * @throws {Error} argument out cannot be undefined.
     */
    offsetRhumb(bearing, distance, out) {
        if (!out) {
            throw new Error('Cannot mutate a read-only GeoPoint.');
        }
        return this.source.offsetRhumb(bearing, distance, out);
    }
    /**
     * Calculates the cartesian (x, y, z) representation of this point, in units of great-arc radians. By convention,
     * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
     * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
     * @param out - the vector array to which to write the result.
     * @returns the cartesian representation of this point.
     */
    toCartesian(out) {
        return this.source.toCartesian(out);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    equals(arg1, arg2, arg3) {
        if (typeof arg1 === 'number') {
            return this.source.equals(arg1, arg2, arg3);
        }
        else {
            return this.source.equals(arg1, arg2);
        }
    }
    /**
     * Copies this point.
     * @param to - an optional point to which to copy this point. If this argument is not supplied, a new GeoPoint object
     * will be created.
     * @returns a copy of this point.
     */
    copy(to) {
        return this.source.copy(to);
    }
}
/**
 * A point on Earth's surface. This class uses a spherical Earth model.
 */
class GeoPoint {
    /**
     * Constructor.
     * @param lat - the latitude, in degrees.
     * @param lon - the longitude, in degrees.
     */
    constructor(lat, lon) {
        this._lat = 0;
        this._lon = 0;
        this.set(lat, lon);
        this.readonly = new GeoPointReadOnly(this);
    }
    /**
     * The latitude of this point, in degrees.
     * @returns the latitude of this point.
     */
    get lat() {
        return this._lat;
    }
    /**
     * The longitude of this point, in degrees.
     * @returns the longitude of this point.
     */
    get lon() {
        return this._lon;
    }
    /**
     * Converts an argument list consisting of either a LatLonInterface or lat/lon coordinates into an equivalent
     * LatLonInterface.
     * @param arg1 Argument 1.
     * @param arg2 Argument 2.
     * @returns a LatLonInterface.
     */
    static asLatLonInterface(arg1, arg2) {
        if (typeof arg1 === 'number') {
            return GeoPoint.tempGeoPoint.set(arg1, arg2);
        }
        else {
            return arg1;
        }
    }
    /**
     * Converts an argument list consisting of either a 3D vector or x, y, z components into an equivalent 3D vector.
     * @param arg1 Argument 1.
     * @param arg2 Argument 2.
     * @param arg3 Argument 3.
     * @returns a 3D vector.
     */
    static asVec3(arg1, arg2, arg3) {
        if (typeof arg1 === 'number') {
            return Vec3Math.set(arg1, arg2, arg3, GeoPoint.tempVec3);
        }
        else {
            return arg1;
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    set(arg1, arg2) {
        let lat, lon;
        if (typeof arg1 === 'number') {
            lat = arg1;
            lon = arg2;
        }
        else {
            lat = arg1.lat;
            lon = arg1.lon;
        }
        lat = GeoPoint.toPlusMinus180(lat);
        lon = GeoPoint.toPlusMinus180(lon);
        if (Math.abs(lat) > 90) {
            lat = 180 - lat;
            lat = GeoPoint.toPlusMinus180(lat);
            lon += 180;
            lon = GeoPoint.toPlusMinus180(lon);
        }
        this._lat = lat;
        this._lon = lon;
        return this;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    setFromCartesian(arg1, arg2, arg3) {
        const vec = GeoPoint.asVec3(arg1, arg2, arg3);
        const theta = Vec3Math.theta(vec);
        const phi = Vec3Math.phi(vec);
        return this.set(90 - theta * Avionics.Utils.RAD2DEG, phi * Avionics.Utils.RAD2DEG);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    distance(arg1, arg2) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        const lat1 = this.lat * Avionics.Utils.DEG2RAD;
        const lat2 = other.lat * Avionics.Utils.DEG2RAD;
        const lon1 = this.lon * Avionics.Utils.DEG2RAD;
        const lon2 = other.lon * Avionics.Utils.DEG2RAD;
        // haversine formula
        const sinHalfDeltaLat = Math.sin((lat2 - lat1) / 2);
        const sinHalfDeltaLon = Math.sin((lon2 - lon1) / 2);
        const a = sinHalfDeltaLat * sinHalfDeltaLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfDeltaLon * sinHalfDeltaLon;
        return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    distanceRhumb(arg1, arg2) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        const lat1 = this.lat * Avionics.Utils.DEG2RAD;
        const lat2 = other.lat * Avionics.Utils.DEG2RAD;
        const lon1 = this.lon * Avionics.Utils.DEG2RAD;
        const lon2 = other.lon * Avionics.Utils.DEG2RAD;
        const deltaLat = lat2 - lat1;
        let deltaLon = lon2 - lon1;
        const deltaPsi = GeoPoint.deltaPsi(lat1, lat2);
        const correction = GeoPoint.rhumbCorrection(deltaPsi, lat1, lat2);
        if (Math.abs(deltaLon) > Math.PI) {
            deltaLon += -Math.sign(deltaLon) * 2 * Math.PI;
        }
        return Math.sqrt(deltaLat * deltaLat + correction * correction * deltaLon * deltaLon);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingTo(arg1, arg2) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        return GeoPoint.calculateInitialBearing(this, other);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingFrom(arg1, arg2) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        return (GeoPoint.calculateInitialBearing(this, other) + 180) % 360;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    bearingRhumb(arg1, arg2) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        const lat1 = this.lat * Avionics.Utils.DEG2RAD;
        const lon1 = this.lon * Avionics.Utils.DEG2RAD;
        const lat2 = other.lat * Avionics.Utils.DEG2RAD;
        const lon2 = other.lon * Avionics.Utils.DEG2RAD;
        let deltaLon = lon2 - lon1;
        const deltaPsi = GeoPoint.deltaPsi(lat1, lat2);
        if (Math.abs(deltaLon) > Math.PI) {
            deltaLon += -Math.sign(deltaLon) * 2 * Math.PI;
        }
        return Math.atan2(deltaLon, deltaPsi) * Avionics.Utils.RAD2DEG;
    }
    /**
     * Offsets this point by an initial bearing and distance along a great circle.
     * @param bearing - the initial bearing (forward azimuth) by which to offset.
     * @param distance - the distance, in great-arc radians, by which to offset.
     * @param out - the GeoPoint to which to write the results. By default this point.
     * @returns the offset point.
     */
    offset(bearing, distance, out) {
        const latRad = this.lat * Avionics.Utils.DEG2RAD;
        const lonRad = this.lon * Avionics.Utils.DEG2RAD;
        const sinLat = Math.sin(latRad);
        const cosLat = Math.cos(latRad);
        const sinBearing = Math.sin(bearing * Avionics.Utils.DEG2RAD);
        const cosBearing = Math.cos(bearing * Avionics.Utils.DEG2RAD);
        const angularDistance = distance;
        const sinAngularDistance = Math.sin(angularDistance);
        const cosAngularDistance = Math.cos(angularDistance);
        const offsetLatRad = Math.asin(sinLat * cosAngularDistance + cosLat * sinAngularDistance * cosBearing);
        const offsetLonDeltaRad = Math.atan2(sinBearing * sinAngularDistance * cosLat, cosAngularDistance - sinLat * Math.sin(offsetLatRad));
        const offsetLat = offsetLatRad * Avionics.Utils.RAD2DEG;
        const offsetLon = (lonRad + offsetLonDeltaRad) * Avionics.Utils.RAD2DEG;
        return (out !== null && out !== void 0 ? out : this).set(offsetLat, offsetLon);
    }
    /**
     * Offsets this point by a constant bearing and distance along a rhumb line.
     * @param bearing - the bearing by which to offset.
     * @param distance - the distance, in great-arc radians, by which to offset.
     * @param out - the GeoPoint to which to write the results. By default this point.
     * @returns the offset point.
     */
    offsetRhumb(bearing, distance, out) {
        const latRad = this.lat * Avionics.Utils.DEG2RAD;
        const lonRad = this.lon * Avionics.Utils.DEG2RAD;
        const bearingRad = bearing * Avionics.Utils.DEG2RAD;
        const deltaLat = distance * Math.cos(bearingRad);
        let offsetLat = latRad + deltaLat;
        let offsetLon;
        if (Math.abs(offsetLat) >= Math.PI / 2) {
            // you can't technically go past the poles along a rhumb line, so we will simply terminate the path at the pole
            offsetLat = Math.sign(offsetLat) * 90;
            offsetLon = 0; // since longitude is meaningless at the poles, we'll arbitrarily pick a longitude of 0 degrees.
        }
        else {
            const deltaPsi = GeoPoint.deltaPsi(latRad, offsetLat);
            const correction = GeoPoint.rhumbCorrection(deltaPsi, latRad, offsetLat);
            const deltaLon = distance * Math.sin(bearingRad) / correction;
            offsetLon = lonRad + deltaLon;
            offsetLat *= Avionics.Utils.RAD2DEG;
            offsetLon *= Avionics.Utils.RAD2DEG;
        }
        return (out !== null && out !== void 0 ? out : this).set(offsetLat, offsetLon);
    }
    /**
     * Calculates the cartesian (x, y, z) representation of this point, in units of great-arc radians. By convention,
     * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
     * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
     * @param out - the vector array to which to write the result.
     * @returns the cartesian representation of this point.
     */
    toCartesian(out) {
        return GeoPoint.sphericalToCartesian(this, out);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    equals(arg1, arg2, arg3) {
        const other = GeoPoint.asLatLonInterface(arg1, arg2);
        const tolerance = typeof arg1 === 'number' ? arg3 : arg2;
        if (other) {
            return this.distance(other) <= (tolerance !== null && tolerance !== void 0 ? tolerance : GeoPoint.EQUALITY_TOLERANCE);
        }
        else {
            return false;
        }
    }
    /**
     * Copies this point.
     * @param to - an optional point to which to copy this point. If this argument is not supplied, a new GeoPoint object
     * will be created.
     * @returns a copy of this point.
     */
    copy(to) {
        return to ? to.set(this.lat, this.lon) : new GeoPoint(this.lat, this.lon);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static sphericalToCartesian(arg1, arg2, arg3) {
        const point = GeoPoint.asLatLonInterface(arg1, arg2);
        const theta = (90 - point.lat) * Avionics.Utils.DEG2RAD;
        const phi = point.lon * Avionics.Utils.DEG2RAD;
        return Vec3Math.setFromSpherical(1, theta, phi, arg3 !== null && arg3 !== void 0 ? arg3 : arg2);
    }
    /**
     * Converts an angle, in degrees, to an equivalent value in the range [-180, 180).
     * @param angle - an angle in degrees.
     * @returns the angle's equivalent in the range [-180, 180).
     */
    static toPlusMinus180(angle) {
        return ((angle % 360) + 540) % 360 - 180;
    }
    /**
     * Calculates the initial bearing (forward azimuth) from an origin point to a destination point.
     * @param origin - the origin point.
     * @param destination - the destination point.
     * @returns the initial bearing from the origin to destination.
     */
    static calculateInitialBearing(origin, destination) {
        const lat1 = origin.lat * Avionics.Utils.DEG2RAD;
        const lat2 = destination.lat * Avionics.Utils.DEG2RAD;
        const lon1 = origin.lon * Avionics.Utils.DEG2RAD;
        const lon2 = destination.lon * Avionics.Utils.DEG2RAD;
        const cosLat2 = Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * cosLat2 * Math.cos(lon2 - lon1);
        const y = Math.sin(lon2 - lon1) * cosLat2;
        const bearing = Math.atan2(y, x) * Avionics.Utils.RAD2DEG;
        return (bearing + 360) % 360; // enforce range [0, 360)
    }
    /**
     * Calculates the difference in isometric latitude from a pair of geodetic (geocentric) latitudes.
     * @param latRad1 - geodetic latitude 1, in radians.
     * @param latRad2 - geodetic latitude 2, in radians.
     * @returns the difference in isometric latitude from latitude 1 to latitude 2, in radians.
     */
    static deltaPsi(latRad1, latRad2) {
        return Math.log(Math.tan(latRad2 / 2 + Math.PI / 4) / Math.tan(latRad1 / 2 + Math.PI / 4));
    }
    /**
     * Calculates the rhumb correction factor between two latitudes.
     * @param deltaPsi - the difference in isometric latitude beween the two latitudes.
     * @param latRad1 - geodetic latitude 1, in radians.
     * @param latRad2 - geodetic latitude 2, in radians.
     * @returns the rhumb correction factor between the two latitudes.
     */
    static rhumbCorrection(deltaPsi, latRad1, latRad2) {
        return Math.abs(deltaPsi) > 1e-12 ? ((latRad2 - latRad1) / deltaPsi) : Math.cos(latRad1);
    }
}
/**
 * The default equality tolerance, defined as the maximum allowed distance between two equal points in great-arc
 * radians.
 */
GeoPoint.EQUALITY_TOLERANCE = 1e-7; // ~61 cm
GeoPoint.tempVec3 = new Float64Array(3);
GeoPoint.tempGeoPoint = new GeoPoint(0, 0);

/**
 * A circle on Earth's surface, defined as the set of points on the Earth's surface equidistant (as measured
 * geodetically) from a central point.
 */
class GeoCircle {
    /**
     * Constructor.
     * @param center The center of the new small circle, represented as a position vector in the standard geographic
     * cartesian reference system.
     * @param radius The radius of the new small circle in great-arc radians.
     */
    constructor(center, radius) {
        this._center = new Float64Array(3);
        this._radius = 0;
        this.set(center, radius);
    }
    // eslint-disable-next-line jsdoc/require-returns
    /**
     * The center of this circle.
     */
    get center() {
        return this._center;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /**
     * The radius of this circle, in great-arc radians.
     */
    get radius() {
        return this._radius;
    }
    /**
     * Checks whether this circle is a great circle, or equivalently, whether its radius is equal to pi / 2 great-arc
     * radians.
     * @returns Whether this circle is a great circle.
     */
    isGreatCircle() {
        return this._radius === Math.PI / 2;
    }
    /**
     * Calculates the length of an arc along this circle subtended by a central angle.
     * @param angle A central angle, in radians.
     * @returns the length of the arc subtended by the angle, in great-arc radians.
     */
    arcLength(angle) {
        return Math.sin(this._radius) * angle;
    }
    /**
     * Sets the center and radius of this circle.
     * @param center The new center.
     * @param radius The new radius in great-arc radians.
     * @returns this circle, after it has been changed.
     */
    set(center, radius) {
        if (center instanceof Float64Array) {
            if (Vec3Math.abs(center) === 0) {
                // if center has no direction, arbitrarily set the center to 0 N, 0 E.
                Vec3Math.set(1, 0, 0, this._center);
            }
            else {
                Vec3Math.normalize(center, this._center);
            }
        }
        else {
            GeoPoint.sphericalToCartesian(center, this._center);
        }
        this._radius = Math.abs(radius) % Math.PI;
        return this;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    setAsGreatCircle(arg1, arg2) {
        this.set(GeoCircle._getGreatCircleNormal(arg1, arg2, GeoCircle.vec3Cache[0]), Math.PI / 2);
        return this;
    }
    /**
     * Gets the distance from a point to the center of this circle, in great-arc radians.
     * @param point The point to which to measure the distance.
     * @returns the distance from the point to the center of this circle.
     */
    distanceToCenter(point) {
        if (point instanceof Float64Array) {
            point = Vec3Math.normalize(point, GeoCircle.vec3Cache[0]);
        }
        else {
            point = GeoPoint.sphericalToCartesian(point, GeoCircle.vec3Cache[0]);
        }
        const dot = Vec3Math.dot(point, this._center);
        return Math.acos(Utils.Clamp(dot, -1, 1));
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    closest(point, out) {
        if (!(point instanceof Float64Array)) {
            point = GeoPoint.sphericalToCartesian(point, GeoCircle.vec3Cache[0]);
        }
        const offset = Vec3Math.multScalar(this._center, Math.cos(this._radius), GeoCircle.vec3Cache[1]);
        const dot = Vec3Math.dot(Vec3Math.sub(point, offset, GeoCircle.vec3Cache[2]), this._center);
        const planeProjected = Vec3Math.sub(point, Vec3Math.multScalar(this._center, dot, GeoCircle.vec3Cache[2]), GeoCircle.vec3Cache[2]);
        if (Vec3Math.dot(planeProjected, planeProjected) === 0 || Math.abs(Vec3Math.dot(planeProjected, this._center)) === 1) {
            // the point is equidistant from all points on this circle
            return out instanceof GeoPoint ? out.set(NaN, NaN) : Vec3Math.set(NaN, NaN, NaN, out);
        }
        const displacement = Vec3Math.multScalar(Vec3Math.normalize(Vec3Math.sub(planeProjected, offset, GeoCircle.vec3Cache[2]), GeoCircle.vec3Cache[2]), Math.sin(this._radius), GeoCircle.vec3Cache[2]);
        const closest = Vec3Math.add(offset, displacement, GeoCircle.vec3Cache[2]);
        return out instanceof Float64Array ? Vec3Math.normalize(closest, out) : out.setFromCartesian(closest);
    }
    /**
     * Calculates and returns the great-circle distance from a specified point to the closest point that lies on this
     * circle. In other words, calculates the shortest distance from a point to this circle. The distance is signed, with
     * positive distances representing deviation away from the center of the circle, and negative distances representing
     * deviation toward the center of the circle.
     * @param point A point, represented as either a position vector or lat/long coordinates.
     * @returns the great circle distance, in great-arc radians, from the point to the closest point on this circle.
     */
    distance(point) {
        const distanceToCenter = this.distanceToCenter(point);
        return distanceToCenter - this._radius;
    }
    /**
     * Checks whether a point lies on this circle.
     * @param point A point, represented as either a position vector or lat/long coordinates.
     * @param tolerance The error tolerance, in great-arc radians, of this operation. Defaults to
     * `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns whether the point lies on this circle.
     */
    includes(point, tolerance = GeoCircle.ANGULAR_TOLERANCE) {
        const distance = this.distance(point);
        return Math.abs(distance) < tolerance;
    }
    /**
     * Checks whether a point lies within the boundary defined by this circle. This is equivalent to checking whether
     * the distance of the point from the center of this circle is less than or equal to this circle's radius.
     * @param point A point, represented as either a position vector or lat/long coordinates.
     * @param inclusive Whether points that lie on this circle should pass the check. True by default.
     * @param tolerance The error tolerance, in great-arc radians, of this operation. Defaults to
     * `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns whether the point lies within the boundary defined by this circle.
     */
    encircles(point, inclusive = true, tolerance = GeoCircle.ANGULAR_TOLERANCE) {
        const distance = this.distance(point);
        return inclusive
            ? distance <= tolerance
            : distance < -tolerance;
    }
    /**
     * Gets the angular distance along an arc between two points that lie on this circle. The arc extends from the first
     * point to the second in a counterclockwise direction when viewed from above the center of the circle.
     * @param start A point on this circle which marks the beginning of an arc.
     * @param end A point on this circle which marks the end of an arc.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `start` and `end` lie on this circle.
     * Defaults to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns the angular width of the arc between the two points, in radians.
     * @throws Error if either point does not lie on this circle.
     */
    angleAlong(start, end, tolerance = GeoCircle.ANGULAR_TOLERANCE) {
        if (!(start instanceof Float64Array)) {
            start = GeoPoint.sphericalToCartesian(start, GeoCircle.vec3Cache[1]);
        }
        if (!(end instanceof Float64Array)) {
            end = GeoPoint.sphericalToCartesian(end, GeoCircle.vec3Cache[2]);
        }
        if (!this.includes(start, tolerance) || !this.includes(end, tolerance)) {
            throw new Error(`GeoCircle: at least one of the two specified arc end points does not lie on this circle (start point distance of ${this.distance(start)}, end point distance of ${this.distance(end)}, vs tolerance of ${tolerance}).`);
        }
        if (this._radius <= GeoCircle.ANGULAR_TOLERANCE) {
            return 0;
        }
        const startRadialNormal = Vec3Math.normalize(Vec3Math.cross(this._center, start, GeoCircle.vec3Cache[3]), GeoCircle.vec3Cache[3]);
        const endRadialNormal = Vec3Math.normalize(Vec3Math.cross(this._center, end, GeoCircle.vec3Cache[4]), GeoCircle.vec3Cache[4]);
        const angularDistance = Math.acos(Utils.Clamp(Vec3Math.dot(startRadialNormal, endRadialNormal), -1, 1));
        const isArcGreaterThanSemi = Vec3Math.dot(startRadialNormal, end) < 0;
        return isArcGreaterThanSemi ? 2 * Math.PI - angularDistance : angularDistance;
    }
    /**
     * Gets the distance along an arc between two points that lie on this circle. The arc extends from the first point
     * to the second in a counterclockwise direction when viewed from above the center of the circle.
     * @param start A point on this circle which marks the beginning of an arc.
     * @param end A point on this circle which marks the end of an arc.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `start` and `end` lie on this circle.
     * Defaults to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns the length of the arc between the two points, in great-arc radians.
     * @throws Error if either point does not lie on this circle.
     */
    distanceAlong(start, end, tolerance = GeoCircle.ANGULAR_TOLERANCE) {
        return this.arcLength(this.angleAlong(start, end, tolerance));
    }
    /**
     * Calculates the true bearing along this circle at a point on the circle.
     * @param point A point on this circle.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
     * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns the bearing along this circle at the point.
     * @throws Error if the point does not lie on this circle.
     */
    bearingAt(point, tolerance = GeoCircle.ANGULAR_TOLERANCE) {
        if (!(point instanceof Float64Array)) {
            point = GeoPoint.sphericalToCartesian(point, GeoCircle.vec3Cache[1]);
        }
        if (!this.includes(point, tolerance)) {
            throw new Error(`GeoCircle: the specified point does not lie on this circle (distance of ${Math.abs(this.distance(point))} vs tolerance of ${tolerance}).`);
        }
        if (this._radius <= GeoCircle.ANGULAR_TOLERANCE || 1 - Math.abs(Vec3Math.dot(point, GeoCircle.NORTH_POLE)) <= GeoCircle.ANGULAR_TOLERANCE) {
            // Meaningful bearings cannot be defined along a circle with 0 radius (effectively a point) and at the north and south poles.
            return NaN;
        }
        const radialNormal = Vec3Math.normalize(Vec3Math.cross(this._center, point, GeoCircle.vec3Cache[2]), GeoCircle.vec3Cache[2]);
        const northNormal = Vec3Math.normalize(Vec3Math.cross(point, GeoCircle.NORTH_POLE, GeoCircle.vec3Cache[3]), GeoCircle.vec3Cache[3]);
        return (Math.acos(Utils.Clamp(Vec3Math.dot(radialNormal, northNormal), -1, 1)) * (radialNormal[2] >= 0 ? 1 : -1) * Avionics.Utils.RAD2DEG - 90 + 360) % 360;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    offsetDistanceAlong(point, distance, out, tolerance = GeoCircle.ANGULAR_TOLERANCE) {
        const angle = distance / Math.sin(this.radius);
        return this._offsetAngleAlong(point, angle, out, tolerance);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    offsetAngleAlong(point, angle, out, tolerance = GeoCircle.ANGULAR_TOLERANCE) {
        return this._offsetAngleAlong(point, angle, out, tolerance);
    }
    /**
     * Offsets a point on this circle by a specified angular distance. The direction of the offset for positive distances
     * is counterclockwise when viewed from above the center of this circle.
     * @param point The point to offset.
     * @param angle The angular distance by which to offset, in radians.
     * @param out A Float64Array or GeoPoint object to which to write the result.
     * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
     * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns The offset point.
     * @throws Error if the point does not lie on this circle.
     */
    _offsetAngleAlong(point, angle, out, tolerance = GeoCircle.ANGULAR_TOLERANCE) {
        if (!(point instanceof Float64Array)) {
            point = GeoPoint.sphericalToCartesian(point, GeoCircle.vec3Cache[3]);
        }
        if (!this.includes(point, tolerance)) {
            throw new Error(`GeoCircle: the specified point does not lie on this circle (distance of ${Math.abs(this.distance(point))} vs tolerance of ${tolerance}).`);
        }
        if (this.radius === 0) {
            return out instanceof GeoPoint ? out.setFromCartesian(point) : Vec3Math.copy(point, out);
        }
        // Since point may not lie exactly on this circle due to error tolerance, project point onto this circle to ensure
        // the offset point lies exactly on this circle.
        point = this.closest(point, GeoCircle.vec3Cache[3]);
        const sin = Math.sin(angle / 2);
        const q0 = Math.cos(angle / 2);
        const q1 = sin * this._center[0];
        const q2 = sin * this._center[1];
        const q3 = sin * this._center[2];
        const q0Sq = q0 * q0;
        const q1Sq = q1 * q1;
        const q2Sq = q2 * q2;
        const q3Sq = q3 * q3;
        const q01 = q0 * q1;
        const q02 = q0 * q2;
        const q03 = q0 * q3;
        const q12 = q1 * q2;
        const q13 = q1 * q3;
        const q23 = q2 * q3;
        const rot_11 = q0Sq + q1Sq - q2Sq - q3Sq;
        const rot_12 = 2 * (q12 - q03);
        const rot_13 = 2 * (q13 + q02);
        const rot_21 = 2 * (q12 + q03);
        const rot_22 = q0Sq - q1Sq + q2Sq - q3Sq;
        const rot_23 = 2 * (q23 - q01);
        const rot_31 = 2 * (q13 - q02);
        const rot_32 = 2 * (q23 + q01);
        const rot_33 = (q0Sq - q1Sq - q2Sq + q3Sq);
        const x = point[0];
        const y = point[1];
        const z = point[2];
        const rotX = rot_11 * x + rot_12 * y + rot_13 * z;
        const rotY = rot_21 * x + rot_22 * y + rot_23 * z;
        const rotZ = rot_31 * x + rot_32 * y + rot_33 * z;
        return out instanceof Float64Array
            ? Vec3Math.set(rotX, rotY, rotZ, out)
            : out.setFromCartesian(Vec3Math.set(rotX, rotY, rotZ, GeoCircle.vec3Cache[2]));
    }
    /**
     * Calculates and returns the set of intersection points between this circle and another one, and writes the results
     * to an array of position vectors.
     * @param other The other circle to test for intersections.
     * @param out An array in which to store the results. The results will be stored at indexes 0 and 1. If these indexes
     * are empty, then new Float64Array objects will be created and inserted into the array.
     * @returns The number of solutions written to the out array. Either 0, 1, or 2.
     */
    intersection(other, out) {
        const center1 = this._center;
        const center2 = other._center;
        const radius1 = this._radius;
        const radius2 = other._radius;
        /**
         * Theory: We can model geo circles as the intersection between a sphere and the unit sphere (Earth's surface).
         * Therefore, the intersection of two geo circles is the intersection between two spheres AND the unit sphere.
         * First, we find the intersection of the two non-Earth spheres (which can either be a sphere, a circle, or a
         * point), then we find the intersection of that geometry with the unit sphere.
         */
        const dot = Vec3Math.dot(center1, center2);
        const dotSquared = dot * dot;
        if (dotSquared === 1) {
            // the two circles are concentric; either there are zero solutions or infinite solutions; either way we don't
            // write any solutions to the array.
            return 0;
        }
        // find the position vector to the center of the circle which defines the intersection of the two geo circle
        // spheres.
        const a = (Math.cos(radius1) - dot * Math.cos(radius2)) / (1 - dotSquared);
        const b = (Math.cos(radius2) - dot * Math.cos(radius1)) / (1 - dotSquared);
        const intersection = Vec3Math.add(Vec3Math.multScalar(center1, a, GeoCircle.vec3Cache[0]), Vec3Math.multScalar(center2, b, GeoCircle.vec3Cache[1]), GeoCircle.vec3Cache[0]);
        const intersectionLengthSquared = Vec3Math.dot(intersection, intersection);
        if (intersectionLengthSquared > 1) {
            // the two geo circle spheres do not intersect.
            return 0;
        }
        const cross = Vec3Math.cross(center1, center2, GeoCircle.vec3Cache[1]);
        const crossLengthSquared = Vec3Math.dot(cross, cross);
        if (crossLengthSquared === 0) {
            // this technically can't happen (since we already check if center1 dot center2 === +/-1 above, but just in
            // case...)
            return 0;
        }
        const offset = Math.sqrt((1 - intersectionLengthSquared) / crossLengthSquared);
        let solutionCount = 1;
        if (!out[0]) {
            out[0] = new Float64Array(3);
        }
        out[0].set(cross);
        Vec3Math.multScalar(out[0], offset, out[0]);
        Vec3Math.add(out[0], intersection, out[0]);
        if (offset > 0) {
            if (!out[1]) {
                out[1] = new Float64Array(3);
            }
            out[1].set(cross);
            Vec3Math.multScalar(out[1], -offset, out[1]);
            Vec3Math.add(out[1], intersection, out[1]);
            solutionCount++;
        }
        return solutionCount;
    }
    /**
     * Calculates and returns the set of intersection points between this circle and another one, and writes the results
     * to an array of GeoPoint objects.
     * @param other The other circle to test for intersections.
     * @param out An array in which to store the results. The results will be stored at indexes 0 and 1. If these indexes
     * are empty, then new GeoPoint objects will be created and inserted into the array.
     * @returns The number of solutions written to the out array. Either 0, 1, or 2.
     */
    intersectionGeoPoint(other, out) {
        const solutionCount = this.intersection(other, GeoCircle.intersectionCache);
        for (let i = 0; i < solutionCount; i++) {
            if (!out[i]) {
                out[i] = new GeoPoint(0, 0);
            }
            out[i].setFromCartesian(GeoCircle.intersectionCache[i]);
        }
        return solutionCount;
    }
    /**
     * Calculates and returns the number of intersection points between this circle and another one. Returns NaN if there
     * are an infinite number of intersection points.
     * @param other The other circle to test for intersections.
     * @param tolerance The error tolerance, in great-arc radians, of this operation. Defaults to
     * `GeoCircle.ANGULAR_TOLERANCE` if not specified.
     * @returns the number of intersection points between this circle and the other one.
     */
    numIntersectionPoints(other, tolerance = GeoCircle.ANGULAR_TOLERANCE) {
        const center1 = this.center;
        const center2 = other.center;
        const radius1 = this.radius;
        const radius2 = other.radius;
        const dot = Vec3Math.dot(center1, center2);
        const dotSquared = dot * dot;
        if (dotSquared === 1) {
            // the two circles are concentric; if they are the same circle there are an infinite number of intersections,
            // otherwise there are none.
            if (dot === 1) {
                // centers are the same
                return (Math.abs(this.radius - other.radius) <= tolerance) ? NaN : 0;
            }
            else {
                // centers are antipodal
                return (Math.abs(Math.PI - this.radius - other.radius) <= tolerance) ? NaN : 0;
            }
        }
        const a = (Math.cos(radius1) - dot * Math.cos(radius2)) / (1 - dotSquared);
        const b = (Math.cos(radius2) - dot * Math.cos(radius1)) / (1 - dotSquared);
        const intersection = Vec3Math.add(Vec3Math.multScalar(center1, a, GeoCircle.vec3Cache[0]), Vec3Math.multScalar(center2, b, GeoCircle.vec3Cache[1]), GeoCircle.vec3Cache[1]);
        const intersectionLengthSquared = Vec3Math.dot(intersection, intersection);
        if (intersectionLengthSquared > 1) {
            return 0;
        }
        const cross = Vec3Math.cross(center1, center2, GeoCircle.vec3Cache[1]);
        const crossLengthSquared = Vec3Math.dot(cross, cross);
        if (crossLengthSquared === 0) {
            return 0;
        }
        const sinTol = Math.sin(tolerance);
        return ((1 - intersectionLengthSquared) / crossLengthSquared > sinTol * sinTol) ? 2 : 1;
    }
    /**
     * Creates a new small circle from a lat/long coordinate pair and radius.
     * @param point The center of the new small circle.
     * @param radius The radius of the new small circle, in great-arc radians.
     * @returns a small circle.
     */
    static createFromPoint(point, radius) {
        return new GeoCircle(GeoPoint.sphericalToCartesian(point, GeoCircle.vec3Cache[0]), radius);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static createGreatCircle(arg1, arg2) {
        return new GeoCircle(GeoCircle._getGreatCircleNormal(arg1, arg2, GeoCircle.vec3Cache[0]), Math.PI / 2);
    }
    /**
     * Creates a new great circle defined by one point and a bearing offset. The new great circle will be equivalent to
     * the path projected from the point with the specified initial bearing (forward azimuth).
     * @param point A point that lies on the new great circle.
     * @param bearing The initial bearing from the point.
     * @returns a great circle.
     */
    static createGreatCircleFromPointBearing(point, bearing) {
        return new GeoCircle(GeoCircle.getGreatCircleNormalFromPointBearing(point, bearing, GeoCircle.vec3Cache[0]), Math.PI / 2);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static getGreatCircleNormal(arg1, arg2, out) {
        return GeoCircle._getGreatCircleNormal(arg1, arg2, out);
    }
    /**
     * Calculates a normal vector for a great circle given two points which lie on the circle, or a point and initial bearing.
     * @param arg1 A point that lies on the great circle.
     * @param arg2 A second point that lies on the great circle, or an initial bearing from the first point.
     * @param out The vector to which to write the result.
     * @returns the normal vector for the great circle.
     */
    static _getGreatCircleNormal(arg1, arg2, out) {
        if (typeof arg2 === 'number') {
            return GeoCircle.getGreatCircleNormalFromPointBearing(arg1, arg2, out);
        }
        else {
            return GeoCircle.getGreatCircleNormalFromPoints(arg1, arg2, out);
        }
    }
    /**
     * Calculates a normal vector for a great circle given two points which lie on the cirlce.
     * @param point1 The first point that lies on the great circle.
     * @param point2 The second point that lies on the great circle.
     * @param out The vector to which to write the result.
     * @returns the normal vector for the great circle.
     */
    static getGreatCircleNormalFromPoints(point1, point2, out) {
        if (!(point1 instanceof Float64Array)) {
            point1 = GeoPoint.sphericalToCartesian(point1, GeoCircle.vec3Cache[0]);
        }
        if (!(point2 instanceof Float64Array)) {
            point2 = GeoPoint.sphericalToCartesian(point2, GeoCircle.vec3Cache[1]);
        }
        return Vec3Math.normalize(Vec3Math.cross(point1, point2, out), out);
    }
    /**
     * Calculates a normal vector for a great circle given a point and initial bearing.
     * @param point A point that lies on the great circle.
     * @param bearing The initial bearing from the point.
     * @param out The vector to which to write the result.
     * @returns the normal vector for the great circle.
     */
    static getGreatCircleNormalFromPointBearing(point, bearing, out) {
        if (point instanceof Float64Array) {
            point = GeoCircle.tempGeoPoint.setFromCartesian(point);
        }
        const lat = point.lat * Avionics.Utils.DEG2RAD;
        const long = point.lon * Avionics.Utils.DEG2RAD;
        bearing *= Avionics.Utils.DEG2RAD;
        const sinLat = Math.sin(lat);
        const sinLon = Math.sin(long);
        const cosLon = Math.cos(long);
        const sinBearing = Math.sin(bearing);
        const cosBearing = Math.cos(bearing);
        const x = sinLon * cosBearing - sinLat * cosLon * sinBearing;
        const y = -cosLon * cosBearing - sinLat * sinLon * sinBearing;
        const z = Math.cos(lat) * sinBearing;
        return Vec3Math.set(x, y, z, out);
    }
}
GeoCircle.ANGULAR_TOLERANCE = 1e-7; // ~61cm
GeoCircle.NORTH_POLE = new Float64Array([0, 0, 1]);
GeoCircle.tempGeoPoint = new GeoPoint(0, 0);
GeoCircle.vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];
GeoCircle.intersectionCache = [new Float64Array(3), new Float64Array(3)];

/**
 * Navigational mathematics functions.
 */
class NavMath {
    /**
     * Clamps a value to a min and max.
     * @param val The value to clamp.
     * @param min The minimum value to clamp to.
     * @param max The maximum value to clamp to.
     * @returns The clamped value.
     */
    static clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }
    /**
     * Normalizes a heading to a 0-360 range.
     * @param heading The heading to normalize.
     * @returns The normalized heading.
     */
    static normalizeHeading(heading) {
        if (isFinite(heading)) {
            return (heading % 360 + 360) % 360;
        }
        else {
            console.error(`normalizeHeading: Invalid heading: ${heading}`);
            return NaN;
        }
    }
    /**
     * Gets the turn radius for a given true airspeed.
     * @param airspeedTrue The true airspeed of the plane.
     * @param bankAngle The bank angle of the plane, in degrees.
     * @returns The airplane turn radius.
     */
    static turnRadius(airspeedTrue, bankAngle) {
        return (Math.pow(airspeedTrue, 2) / (11.26 * Math.tan(bankAngle * NavMath.DEG2RAD)))
            / 3.2808399;
    }
    /**
     * Gets the required bank angle for a given true airspeed and turn radius.
     * @param airspeedTrue The true airspeed of the plane.
     * @param radius The airplane turn radius.
     * @returns The required bank angle, in degrees.
     */
    static bankAngle(airspeedTrue, radius) {
        const airspeedMS = airspeedTrue * 0.51444444;
        return Units.Radians.toDegrees(Math.atan(Math.pow(airspeedMS, 2) / (radius * 9.80665)));
    }
    /**
     * Get the turn direction for a given course change.
     * @param startCourse The start course.
     * @param endCourse The end course.
     * @returns The turn direction for the course change.
     */
    static getTurnDirection(startCourse, endCourse) {
        return NavMath.normalizeHeading(endCourse - startCourse) > 180 ? 'left' : 'right';
    }
    /**
     * Converts polar radians to degrees north.
     * @param radians The radians to convert.
     * @returns The angle, in degrees north.
     */
    static polarToDegreesNorth(radians) {
        return NavMath.normalizeHeading((180 / Math.PI) * (Math.PI / 2 - radians));
    }
    /**
     * Converts degrees north to polar radians.
     * @param degrees The degrees to convert.
     * @returns The angle radians, in polar.
     */
    static degreesNorthToPolar(degrees) {
        return NavMath.normalizeHeading(degrees - 90) / (180 / Math.PI);
    }
    /**
     * Calculates the distance along an arc on Earth's surface. The arc begins at the intersection of the great circle
     * passing through the center of a circle of radius `radius` meters in the direction of 'startBearing', and ends at
     * the intersection of the great circle passing through the center of the circle in the direction of 'endBearing',
     * proceeding clockwise (as viewed from above).
     * @param startBearing The degrees of the start of the arc.
     * @param endBearing The degrees of the end of the arc.
     * @param radius The radius of the arc, in meters.
     * @returns The arc distance.
     */
    static calculateArcDistance(startBearing, endBearing, radius) {
        const angularWidth = ((endBearing - startBearing + 360) % 360) * Avionics.Utils.DEG2RAD;
        const conversion = UnitType.GA_RADIAN.convertTo(1, UnitType.METER);
        return angularWidth * Math.sin(radius / conversion) * conversion;
    }
    /**
     * Calculates the intersection of a line and a circle.
     * @param x1 The start x of the line.
     * @param y1 The start y of the line.
     * @param x2 The end x of the line.
     * @param y2 The end y of the line.
     * @param cx The circle center x.
     * @param cy The circle center y.
     * @param r The radius of the circle.
     * @param sRef The reference to the solution object to write the solution to.
     * @returns The number of solutions (0, 1 or 2).
     */
    static circleIntersection(x1, y1, x2, y2, cx, cy, r, sRef) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const a = dx * dx + dy * dy;
        const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
        const c = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;
        const det = b * b - 4 * a * c;
        if (a < 0.0000001 || det < 0) {
            sRef.x1 = NaN;
            sRef.x2 = NaN;
            sRef.y1 = NaN;
            sRef.y2 = NaN;
            return 0;
        }
        else if (det == 0) {
            const t = -b / (2 * a);
            sRef.x1 = x1 + t * dx;
            sRef.y1 = y1 + t * dy;
            sRef.x2 = NaN;
            sRef.y2 = NaN;
            return 1;
        }
        else {
            const t1 = ((-b + Math.sqrt(det)) / (2 * a));
            sRef.x1 = x1 + t1 * dx;
            sRef.y1 = y1 + t1 * dy;
            const t2 = ((-b - Math.sqrt(det)) / (2 * a));
            sRef.x2 = x1 + t2 * dx;
            sRef.y2 = y1 + t2 * dy;
            return 2;
        }
    }
    /**
     * Gets the degrees north that a point lies on a circle.
     * @param cx The x point of the center of the circle.
     * @param cy The y point of the center of the circle.
     * @param x The x point to get the bearing for.
     * @param y The y point to get the bearing for.
     * @returns The angle in degrees north that the point is relative to the center.
     */
    static northAngle(cx, cy, x, y) {
        return NavMath.polarToDegreesNorth(Math.atan2(y - cy, x - cx));
    }
    /**
     * Checks if a degrees north bearing is between two other degrees north bearings.
     * @param bearing The bearing in degrees north to check.
     * @param start The start bearing in degrees north.
     * @param end The end bearing, in degrees north.
     * @returns True if the bearing is between the two provided bearings, false otherwise.
     */
    static bearingIsBetween(bearing, start, end) {
        const range = this.normalizeHeading(end - start);
        const relativeBearing = this.normalizeHeading(bearing - start);
        return relativeBearing >= 0 && relativeBearing <= range;
    }
    /**
     * Converts a degrees north heading to a degrees north turn circle angle.
     * @param heading The heading to convert.
     * @param turnDirection The direction of the turn.
     * @returns A degrees north turn circle angle.
     */
    static headingToAngle(heading, turnDirection) {
        return NavMath.normalizeHeading(heading + (turnDirection === 'left' ? 90 : -90));
    }
    /**
     * Converts a degrees north turn circle angle to a degrees north heading.
     * @param angle The turn circle angle to convert.
     * @param turnDirection The direction of the turn.
     * @returns A degrees north heading.
     */
    static angleToHeading(angle, turnDirection) {
        return NavMath.normalizeHeading(angle + (turnDirection === 'left' ? -90 : 90));
    }
    /**
     * Calculates the wind correction angle.
     * @param course The current plane true course.
     * @param airspeedTrue The current plane true airspeed.
     * @param windDirection The direction of the wind, in degrees true.
     * @param windSpeed The current speed of the wind.
     * @returns The calculated wind correction angle.
     */
    static windCorrectionAngle(course, airspeedTrue, windDirection, windSpeed) {
        const currCrosswind = windSpeed * (Math.sin((course * Math.PI / 180) - (windDirection * Math.PI / 180)));
        const windCorrection = 180 * Math.asin(currCrosswind / airspeedTrue) / Math.PI;
        return windCorrection;
    }
    /**
     * Calculates the cross track deviation from the provided leg fixes.
     * @param start The location of the starting fix of the leg.
     * @param end The location of the ending fix of the leg.
     * @param pos The current plane location coordinates.
     * @returns The amount of cross track deviation, in nautical miles.
     */
    static crossTrack(start, end, pos) {
        const path = NavMath.geoCircleCache[0].setAsGreatCircle(start, end);
        if (isNaN(path.center[0])) {
            return NaN;
        }
        return UnitType.GA_RADIAN.convertTo(path.distance(pos), UnitType.NMILE);
    }
    /**
     * Calculates the along-track distance from a starting point to another point along a great-circle track running
     * through the starting point.
     * @param start The start of the great-circle track.
     * @param end The end of the great-circle track.
     * @param pos The point for which to calculate the along-track distance.
     * @returns The along-track distance, in nautical miles.
     */
    static alongTrack(start, end, pos) {
        const path = NavMath.geoCircleCache[0].setAsGreatCircle(start, end);
        if (isNaN(path.center[0])) {
            return NaN;
        }
        const distance = path.distanceAlong(start, path.closest(pos, NavMath.vec3Cache[0]));
        return UnitType.GA_RADIAN.convertTo((distance + Math.PI) % (2 * Math.PI) - Math.PI, UnitType.NMILE);
    }
    /**
     * Calculates the desired track from the provided leg fixes.
     * @param start The location of the starting fix of the leg.
     * @param end The location of the ending fix of the leg.
     * @param pos The current plane location coordinates.
     * @returns The desired track, in degrees true.
     */
    static desiredTrack(start, end, pos) {
        const path = NavMath.geoCircleCache[0].setAsGreatCircle(start, end);
        if (isNaN(path.center[0])) {
            return NaN;
        }
        return path.bearingAt(path.closest(pos, NavMath.vec3Cache[0]));
    }
    /**
     * Gets the desired track for a given arc.
     * @param center The center of the arc.
     * @param turnDirection The direction of the turn.
     * @param pos The current plane position.
     * @returns The desired track.
     */
    static desiredTrackArc(center, turnDirection, pos) {
        const northAngle = NavMath.geoPointCache[0].set(pos).bearingFrom(center);
        //TODO: Clamp the arc angle to the start and end angles
        return NavMath.angleToHeading(northAngle, turnDirection);
    }
    /**
     * Gets the percentage along the arc path that the plane currently is.
     * @param start The start of the arc, in degrees north.
     * @param end The end of the arc, in degrees north.
     * @param center The center location of the arc.
     * @param turnDirection The direction of the turn.
     * @param pos The current plane position.
     * @returns The percentage along the arc the plane is.
     */
    static percentAlongTrackArc(start, end, center, turnDirection, pos) {
        const bearingFromCenter = NavMath.geoPointCache[0].set(center).bearingTo(pos);
        const sign = turnDirection === 'right' ? 1 : -1;
        const alpha = ((end - start) * sign + 360) % 360;
        const mid = (start + alpha / 2 * sign + 360) % 360;
        const rotBearing = ((bearingFromCenter - mid) + 540) % 360 - 180;
        const frac = rotBearing * sign / alpha + 0.5;
        return frac;
    }
    /**
     * Gets a position given an arc and a distance from the arc start.
     * @param start The start bearing of the arc.
     * @param center The center of the arc.
     * @param radius The radius of the arc.
     * @param turnDirection The turn direction for the arc.
     * @param distance The distance along the arc to get the position for.
     * @param out The position to write to.
     * @returns The position along the arc that was written to.
     */
    static positionAlongArc(start, center, radius, turnDirection, distance, out) {
        const convertedRadius = UnitType.GA_RADIAN.convertTo(Math.sin(UnitType.METER.convertTo(radius, UnitType.GA_RADIAN)), UnitType.METER);
        const theta = UnitType.RADIAN.convertTo(distance / convertedRadius, UnitType.DEGREE);
        const bearing = turnDirection === 'right' ? start + theta : start - theta;
        center.offset(NavMath.normalizeHeading(bearing), UnitType.METER.convertTo(radius, UnitType.GA_RADIAN), out);
        return out;
    }
    /**
     * Gets the cross track distance for a given arc.
     * @param center The center of the arc.
     * @param radius The radius of the arc, in meters.
     * @param pos The current plane position.
     * @returns The cross track distance, in NM.
     */
    static crossTrackArc(center, radius, pos) {
        return UnitType.METER.convertTo(radius, UnitType.NMILE) - UnitType.GA_RADIAN.convertTo(NavMath.geoPointCache[0].set(pos).distance(center), UnitType.NMILE);
    }
    /**
     * Gets the total difference in degrees between two angles.
     * @param a The first angle.
     * @param b The second angle.
     * @returns The difference between the two angles, in degrees.
     */
    static diffAngle(a, b) {
        let diff = b - a;
        while (diff > 180) {
            diff -= 360;
        }
        while (diff <= -180) {
            diff += 360;
        }
        return diff;
    }
    /**
     * Finds side a given sides b, c, and angles beta, gamma.
     * @param b The length of side b, as a trigonometric ratio.
     * @param c The length of side c, as a trigonometric ratio.
     * @param beta The angle, in radians, of the opposite of side b.
     * @param gamma The angle, in radians, of the opposite of side c
     * @returns The length of side a, as a trigonometric ratio.
     */
    static napierSide(b, c, beta, gamma) {
        return 2 * Math.atan(Math.tan(0.5 * (b - c))
            * (Math.sin(0.5 * (beta + gamma)) / Math.sin(0.5 * (beta - gamma))));
    }
    /**
     * Calculates a normal vector to a provided course in degrees north.
     * @param course The course in degrees north.
     * @param turnDirection The direction of the turn to orient the normal.
     * @param outVector The normal vector for the provided course.
     */
    static normal(course, turnDirection, outVector) {
        const normalCourse = NavMath.headingToAngle(course, turnDirection);
        const polarCourse = NavMath.degreesNorthToPolar(normalCourse);
        outVector[0] = Math.cos(polarCourse);
        outVector[1] = Math.sin(polarCourse);
    }
}
NavMath.DEG2RAD = Math.PI / 180;
NavMath.RAD2DEG = 180 / Math.PI;
NavMath.vec3Cache = [new Float64Array(3)];
NavMath.geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
NavMath.geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

/// <reference types="msfstypes/Coherent/Facilities" />
/**
 * A utility class for working with magnetic variation (magnetic declination).
 */
class MagVar {
    // eslint-disable-next-line jsdoc/require-jsdoc
    static get(arg1, arg2) {
        return MagVar.getMagVar(arg1, arg2);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static magneticToTrue(bearing, arg1, arg2) {
        return NavMath.normalizeHeading(bearing + (typeof arg1 === 'number' && arg2 === undefined ? arg1 : MagVar.getMagVar(arg1, arg2)));
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static trueToMagnetic(bearing, arg1, arg2) {
        return NavMath.normalizeHeading(bearing - (typeof arg1 === 'number' && arg2 === undefined ? arg1 : MagVar.getMagVar(arg1, arg2)));
    }
    /**
     * Gets the magnetic variation (magnetic declination) at a specific point on Earth.
     * @param arg1 The query point, or the latitude of the query point.
     * @param arg2 The longitude of the query point.
     * @returns The magnetic variation (magnetic declination) at the point.
     */
    static getMagVar(arg1, arg2) {
        if (typeof Facilities === 'undefined') {
            // In case this code is executed before the Facilities class is created.
            return 0;
        }
        let lat, lon;
        if (typeof arg1 === 'number') {
            lat = arg1;
            lon = arg2;
        }
        else {
            lat = arg1.lat;
            lon = arg1.lon;
        }
        return Facilities.getMagVar(lat, lon);
    }
}

/**
 * The possible reference norths for navigation angle units.
 */
var NavAngleUnitReferenceNorth;
(function (NavAngleUnitReferenceNorth) {
    NavAngleUnitReferenceNorth["True"] = "true";
    NavAngleUnitReferenceNorth["Magnetic"] = "magnetic";
})(NavAngleUnitReferenceNorth || (NavAngleUnitReferenceNorth = {}));
/**
 * A navigation angle unit, which is a measure of angular degrees relative to either true or magnetic north.
 *
 * Unlike most other unit types, each instance of navigation angle unit contains state specific to that instance,
 * namely the location used to retrieve magnetic variation for conversions. Therefore, it is generally recommended
 * not to re-use the same NavAngleUnit instance to instantiate multiple NumberUnits.
 *
 * Conversions use the location of the NavAngleUnit instance whose conversion method is called; this also means that
 * when using `NumberUnit.asUnit()`, the location of the unit of the NumberUnit whose `asUnit()` method was called
 * will be used.
 */
class NavAngleUnit extends AbstractUnit {
    // eslint-disable-next-line jsdoc/require-jsdoc
    constructor(type, arg1, arg2) {
        super(type === NavAngleUnitReferenceNorth.True ? 'true bearing' : 'magnetic bearing');
        /** @inheritdoc */
        this.family = NavAngleUnit.FAMILY;
        /** This location used to retrieve magnetic variation for conversions related to this unit. */
        this.location = new GeoPoint(0, 0);
        typeof arg1 === 'number' ? this.location.set(arg1, arg2) : this.location.set(arg1);
    }
    /**
     * Checks whether this nav angle unit is relative to magnetic north.
     * @returns Whether this nav angle unit is relative to magnetic north.
     */
    isMagnetic() {
        return this.name === 'magnetic bearing';
    }
    /**
     * Converts a value of this unit to another unit. This unit's location is used for the conversion.
     * @param value The value to convert.
     * @param toUnit The unit to which to convert.
     * @returns The converted value.
     * @throws Error if attempting an invalid conversion.
     */
    convertTo(value, toUnit) {
        if (!this.canConvert(toUnit)) {
            throw new Error(`Invalid conversion from ${this.name} to ${toUnit.name}.`);
        }
        if (!isFinite(value)) {
            return NaN;
        }
        if (toUnit.name === this.name) {
            return value;
        }
        return this.isMagnetic() ? MagVar.magneticToTrue(value, this.location) : MagVar.trueToMagnetic(value, this.location);
    }
    /**
     * Converts a value of another unit to this unit. This unit's location is used for the conversion.
     * @param value The value to convert.
     * @param fromUnit The unit from which to convert.
     * @returns The converted value.
     * @throws Error if attempting an invalid conversion.
     */
    convertFrom(value, fromUnit) {
        if (!this.canConvert(fromUnit)) {
            throw new Error(`Invalid conversion from ${fromUnit.name} to ${this.name}.`);
        }
        if (!isFinite(value)) {
            return NaN;
        }
        if (fromUnit.name === this.name) {
            return value;
        }
        return this.isMagnetic() ? MagVar.trueToMagnetic(value, this.location) : MagVar.magneticToTrue(value, this.location);
    }
    /** @inheritdoc */
    equals(other) {
        return other instanceof NavAngleUnit && this.name === other.name && this.location.equals(other.location);
    }
    /**
     * Creates an instance of NavAngleUnit. The location of the unit is initialized to {0 N, 0 E}.
     * @param isMagnetic Whether the new unit is relative to magnetic north.
     * @returns An instance of NavAngleUnit.
     */
    static create(isMagnetic) {
        return new NavAngleUnit(isMagnetic ? NavAngleUnitReferenceNorth.Magnetic : NavAngleUnitReferenceNorth.True, 0, 0);
    }
}
NavAngleUnit.FAMILY = 'navangle';

/**
 * Bitflags describing the relative location of a point with respect to a rectangular bounding box.
 */
var Outcode;
(function (Outcode) {
    Outcode[Outcode["Inside"] = 0] = "Inside";
    Outcode[Outcode["Left"] = 1] = "Left";
    Outcode[Outcode["Top"] = 2] = "Top";
    Outcode[Outcode["Right"] = 4] = "Right";
    Outcode[Outcode["Bottom"] = 8] = "Bottom";
})(Outcode || (Outcode = {}));
Array.from({ length: 8 }, () => {
    return { point: new Float64Array(2), radial: 0 };
});

[new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];

var DmsDirection;
(function (DmsDirection) {
    DmsDirection["NORTH"] = "N";
    DmsDirection["SOUTH"] = "S";
    DmsDirection["WEST"] = "W";
    DmsDirection["EAST"] = "E";
})(DmsDirection || (DmsDirection = {}));

// eslint-disable-next-line @typescript-eslint/no-namespace
var Wait;
(function (Wait) {
    /**
     * Waits for a set amount of time.
     * @param delay The amount of time to wait in milliseconds.
     * @returns a Promise which is fulfilled after the delay.
     */
    // eslint-disable-next-line no-inner-declarations
    function awaitDelay(delay) {
        return new Promise(resolve => setTimeout(() => resolve(), delay));
    }
    Wait.awaitDelay = awaitDelay;
    /**
     * Waits for a condition to be satisfied.
     * @param predicate A function which evaluates whether the condition is satisfied.
     * @param interval The interval, in milliseconds, at which to evaluate the condition. A zero or negative value
     * causes the condition to be evaluated every frame. Defaults to 0.
     * @param timeout The amount of time, in milliseconds, before the returned Promise is rejected if the condition is
     * not satisfied. A zero or negative value causes the Promise to never be rejected and the condition to be
     * continually evaluated until it is satisfied. Defaults to 0.
     * @returns a Promise which is fulfilled when the condition is satisfied.
     */
    // eslint-disable-next-line no-inner-declarations
    function awaitCondition(predicate, interval = 0, timeout = 0) {
        const t0 = Date.now();
        if (interval <= 0) {
            const loopFunc = (resolve, reject) => {
                if (timeout > 0 && Date.now() - t0 >= timeout) {
                    reject('Await condition timed out.');
                }
                else {
                    predicate() ? resolve() : requestAnimationFrame(loopFunc.bind(undefined, resolve, reject));
                }
            };
            return new Promise((resolve, reject) => { loopFunc(resolve, reject); });
        }
        else {
            return new Promise((resolve, reject) => {
                const timer = setInterval(() => {
                    if (timeout > 0 && Date.now() - t0 > timeout) {
                        clearInterval(timer);
                        reject('Await condition timed out.');
                    }
                    else if (predicate()) {
                        clearInterval(timer);
                        resolve();
                    }
                }, interval);
            });
        }
    }
    Wait.awaitCondition = awaitCondition;
})(Wait || (Wait = {}));

/**
 * Valid type arguments for Set/GetSimVarValue
 */
var SimVarValueType;
(function (SimVarValueType) {
    SimVarValueType["Number"] = "number";
    SimVarValueType["Degree"] = "degrees";
    SimVarValueType["Knots"] = "knots";
    SimVarValueType["Feet"] = "feet";
    SimVarValueType["Meters"] = "meters";
    SimVarValueType["FPM"] = "feet per minute";
    SimVarValueType["Radians"] = "radians";
    SimVarValueType["InHG"] = "inches of mercury";
    SimVarValueType["MB"] = "Millibars";
    SimVarValueType["Bool"] = "Bool";
    SimVarValueType["Celsius"] = "celsius";
    SimVarValueType["MHz"] = "MHz";
    SimVarValueType["KHz"] = "KHz";
    SimVarValueType["NM"] = "nautical mile";
    SimVarValueType["String"] = "string";
    SimVarValueType["RPM"] = "Rpm";
    SimVarValueType["PPH"] = "Pounds per hour";
    SimVarValueType["GPH"] = "gph";
    SimVarValueType["Farenheit"] = "farenheit";
    SimVarValueType["PSI"] = "psi";
    SimVarValueType["GAL"] = "gallons";
    SimVarValueType["Hours"] = "Hours";
    SimVarValueType["Volts"] = "Volts";
    SimVarValueType["Amps"] = "Amperes";
    SimVarValueType["Seconds"] = "seconds";
    SimVarValueType["Enum"] = "Enum";
    SimVarValueType["LLA"] = "latlonalt";
    SimVarValueType["MetersPerSecond"] = "meters per second";
})(SimVarValueType || (SimVarValueType = {}));

/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/utils/XMLLogic" />
/** The kind of data to return. */
var CompositeLogicXMLValueType;
(function (CompositeLogicXMLValueType) {
    CompositeLogicXMLValueType[CompositeLogicXMLValueType["Any"] = 0] = "Any";
    CompositeLogicXMLValueType[CompositeLogicXMLValueType["Number"] = 1] = "Number";
    CompositeLogicXMLValueType[CompositeLogicXMLValueType["String"] = 2] = "String";
})(CompositeLogicXMLValueType || (CompositeLogicXMLValueType = {}));

/// <reference types="msfstypes/JS/dataStorage" />
/* eslint-disable no-inner-declarations */
// eslint-disable-next-line @typescript-eslint/no-namespace
var DataStore;
(function (DataStore) {
    /**
     * Writes a keyed value to the data store.
     * @param key A key.
     * @param value The value to set.
     */
    function set(key, value) {
        SetStoredData(key, JSON.stringify(value));
    }
    DataStore.set = set;
    /**
     * Retrieves a keyed value from the data store.
     * @param key A key.
     * @returns the value stored under the key, or undefined if one could not be retrieved.
     */
    function get(key) {
        try {
            const string = GetStoredData(key);
            return JSON.parse(string);
        }
        catch (e) {
            return undefined;
        }
    }
    DataStore.get = get;
    /**
     * Removes a key from the data store.
     * @param key The key to remove.
     */
    function remove(key) {
        DeleteStoredData(key);
    }
    DataStore.remove = remove;
})(DataStore || (DataStore = {}));

/**
 * Types of airspaces.
 */
var AirspaceType;
(function (AirspaceType) {
    AirspaceType[AirspaceType["None"] = 0] = "None";
    AirspaceType[AirspaceType["Center"] = 1] = "Center";
    AirspaceType[AirspaceType["ClassA"] = 2] = "ClassA";
    AirspaceType[AirspaceType["ClassB"] = 3] = "ClassB";
    AirspaceType[AirspaceType["ClassC"] = 4] = "ClassC";
    AirspaceType[AirspaceType["ClassD"] = 5] = "ClassD";
    AirspaceType[AirspaceType["ClassE"] = 6] = "ClassE";
    AirspaceType[AirspaceType["ClassF"] = 7] = "ClassF";
    AirspaceType[AirspaceType["ClassG"] = 8] = "ClassG";
    AirspaceType[AirspaceType["Tower"] = 9] = "Tower";
    AirspaceType[AirspaceType["Clearance"] = 10] = "Clearance";
    AirspaceType[AirspaceType["Ground"] = 11] = "Ground";
    AirspaceType[AirspaceType["Departure"] = 12] = "Departure";
    AirspaceType[AirspaceType["Approach"] = 13] = "Approach";
    AirspaceType[AirspaceType["MOA"] = 14] = "MOA";
    AirspaceType[AirspaceType["Restricted"] = 15] = "Restricted";
    AirspaceType[AirspaceType["Prohibited"] = 16] = "Prohibited";
    AirspaceType[AirspaceType["Warning"] = 17] = "Warning";
    AirspaceType[AirspaceType["Alert"] = 18] = "Alert";
    AirspaceType[AirspaceType["Danger"] = 19] = "Danger";
    AirspaceType[AirspaceType["Nationalpark"] = 20] = "Nationalpark";
    AirspaceType[AirspaceType["ModeC"] = 21] = "ModeC";
    AirspaceType[AirspaceType["Radar"] = 22] = "Radar";
    AirspaceType[AirspaceType["Training"] = 23] = "Training";
    AirspaceType[AirspaceType["Max"] = 24] = "Max";
})(AirspaceType || (AirspaceType = {}));

/**
 * A viewlistener that gets autopilot mode information.
 */
var MSFSAPStates;
(function (MSFSAPStates) {
    MSFSAPStates[MSFSAPStates["LogicOn"] = 1] = "LogicOn";
    MSFSAPStates[MSFSAPStates["APOn"] = 2] = "APOn";
    MSFSAPStates[MSFSAPStates["FDOn"] = 4] = "FDOn";
    MSFSAPStates[MSFSAPStates["FLC"] = 8] = "FLC";
    MSFSAPStates[MSFSAPStates["Alt"] = 16] = "Alt";
    MSFSAPStates[MSFSAPStates["AltArm"] = 32] = "AltArm";
    MSFSAPStates[MSFSAPStates["GS"] = 64] = "GS";
    MSFSAPStates[MSFSAPStates["GSArm"] = 128] = "GSArm";
    MSFSAPStates[MSFSAPStates["Pitch"] = 256] = "Pitch";
    MSFSAPStates[MSFSAPStates["VS"] = 512] = "VS";
    MSFSAPStates[MSFSAPStates["Heading"] = 1024] = "Heading";
    MSFSAPStates[MSFSAPStates["Nav"] = 2048] = "Nav";
    MSFSAPStates[MSFSAPStates["NavArm"] = 4096] = "NavArm";
    MSFSAPStates[MSFSAPStates["WingLevel"] = 8192] = "WingLevel";
    MSFSAPStates[MSFSAPStates["Attitude"] = 16384] = "Attitude";
    MSFSAPStates[MSFSAPStates["ThrottleSpd"] = 32768] = "ThrottleSpd";
    MSFSAPStates[MSFSAPStates["ThrottleMach"] = 65536] = "ThrottleMach";
    MSFSAPStates[MSFSAPStates["ATArm"] = 131072] = "ATArm";
    MSFSAPStates[MSFSAPStates["YD"] = 262144] = "YD";
    MSFSAPStates[MSFSAPStates["EngineRPM"] = 524288] = "EngineRPM";
    MSFSAPStates[MSFSAPStates["TOGAPower"] = 1048576] = "TOGAPower";
    MSFSAPStates[MSFSAPStates["Autoland"] = 2097152] = "Autoland";
    MSFSAPStates[MSFSAPStates["TOGAPitch"] = 4194304] = "TOGAPitch";
    MSFSAPStates[MSFSAPStates["Bank"] = 8388608] = "Bank";
    MSFSAPStates[MSFSAPStates["FBW"] = 16777216] = "FBW";
    MSFSAPStates[MSFSAPStates["AvionicsManaged"] = 33554432] = "AvionicsManaged";
    MSFSAPStates[MSFSAPStates["None"] = -2147483648] = "None";
})(MSFSAPStates || (MSFSAPStates = {}));

/// <reference types="msfstypes/JS/Simplane" />
/**
 * The available facility frequency types.
 */
var FacilityFrequencyType;
(function (FacilityFrequencyType) {
    FacilityFrequencyType[FacilityFrequencyType["None"] = 0] = "None";
    FacilityFrequencyType[FacilityFrequencyType["ATIS"] = 1] = "ATIS";
    FacilityFrequencyType[FacilityFrequencyType["Multicom"] = 2] = "Multicom";
    FacilityFrequencyType[FacilityFrequencyType["Unicom"] = 3] = "Unicom";
    FacilityFrequencyType[FacilityFrequencyType["CTAF"] = 4] = "CTAF";
    FacilityFrequencyType[FacilityFrequencyType["Ground"] = 5] = "Ground";
    FacilityFrequencyType[FacilityFrequencyType["Tower"] = 6] = "Tower";
    FacilityFrequencyType[FacilityFrequencyType["Clearance"] = 7] = "Clearance";
    FacilityFrequencyType[FacilityFrequencyType["Approach"] = 8] = "Approach";
    FacilityFrequencyType[FacilityFrequencyType["Departure"] = 9] = "Departure";
    FacilityFrequencyType[FacilityFrequencyType["Center"] = 10] = "Center";
    FacilityFrequencyType[FacilityFrequencyType["FSS"] = 11] = "FSS";
    FacilityFrequencyType[FacilityFrequencyType["AWOS"] = 12] = "AWOS";
    FacilityFrequencyType[FacilityFrequencyType["ASOS"] = 13] = "ASOS";
    /** Clearance Pre-Taxi*/
    FacilityFrequencyType[FacilityFrequencyType["CPT"] = 14] = "CPT";
    /** Remote Clearance Delivery */
    FacilityFrequencyType[FacilityFrequencyType["GCO"] = 15] = "GCO";
})(FacilityFrequencyType || (FacilityFrequencyType = {}));
/** Additional Approach Types (additive to those defined in simplane). */
var AdditionalApproachType;
(function (AdditionalApproachType) {
    AdditionalApproachType[AdditionalApproachType["APPROACH_TYPE_VISUAL"] = 99] = "APPROACH_TYPE_VISUAL";
})(AdditionalApproachType || (AdditionalApproachType = {}));
/**
 * Flags indicating the approach fix type.
 */
var FixTypeFlags;
(function (FixTypeFlags) {
    FixTypeFlags[FixTypeFlags["None"] = 0] = "None";
    FixTypeFlags[FixTypeFlags["IAF"] = 1] = "IAF";
    FixTypeFlags[FixTypeFlags["IF"] = 2] = "IF";
    FixTypeFlags[FixTypeFlags["MAP"] = 4] = "MAP";
    FixTypeFlags[FixTypeFlags["FAF"] = 8] = "FAF";
    FixTypeFlags[FixTypeFlags["MAHP"] = 16] = "MAHP";
})(FixTypeFlags || (FixTypeFlags = {}));
/**
 * Flags indicating the rnav approach type.
 */
var RnavTypeFlags;
(function (RnavTypeFlags) {
    RnavTypeFlags[RnavTypeFlags["None"] = 0] = "None";
    RnavTypeFlags[RnavTypeFlags["LNAV"] = 1] = "LNAV";
    RnavTypeFlags[RnavTypeFlags["LNAVVNAV"] = 2] = "LNAVVNAV";
    RnavTypeFlags[RnavTypeFlags["LP"] = 4] = "LP";
    RnavTypeFlags[RnavTypeFlags["LPV"] = 8] = "LPV";
})(RnavTypeFlags || (RnavTypeFlags = {}));
/**
 * The class of airport facility.
 */
var AirportClass;
(function (AirportClass) {
    /** No other airport class could be identified. */
    AirportClass[AirportClass["None"] = 0] = "None";
    /** The airport has at least one hard surface runway. */
    AirportClass[AirportClass["HardSurface"] = 1] = "HardSurface";
    /** The airport has no hard surface runways. */
    AirportClass[AirportClass["SoftSurface"] = 2] = "SoftSurface";
    /** The airport has only water surface runways. */
    AirportClass[AirportClass["AllWater"] = 3] = "AllWater";
    /** The airport has no runways, but does contain helipads. */
    AirportClass[AirportClass["HeliportOnly"] = 4] = "HeliportOnly";
    /** The airport is a non-public use airport. */
    AirportClass[AirportClass["Private"] = 5] = "Private";
})(AirportClass || (AirportClass = {}));
/**
 * The class of an airport facility, expressed as a mask for nearest airport search session filtering.
 */
var AirportClassMask;
(function (AirportClassMask) {
    /** No other airport class could be identified. */
    AirportClassMask[AirportClassMask["None"] = 0] = "None";
    /** The airport has at least one hard surface runway. */
    AirportClassMask[AirportClassMask["HardSurface"] = 2] = "HardSurface";
    /** The airport has no hard surface runways. */
    AirportClassMask[AirportClassMask["SoftSurface"] = 4] = "SoftSurface";
    /** The airport has only water surface runways. */
    AirportClassMask[AirportClassMask["AllWater"] = 8] = "AllWater";
    /** The airport has no runways, but does contain helipads. */
    AirportClassMask[AirportClassMask["HeliportOnly"] = 16] = "HeliportOnly";
    /** The airport is a non-public use airport. */
    AirportClassMask[AirportClassMask["Private"] = 32] = "Private";
})(AirportClassMask || (AirportClassMask = {}));
var UserFacilityType;
(function (UserFacilityType) {
    UserFacilityType[UserFacilityType["RADIAL_RADIAL"] = 0] = "RADIAL_RADIAL";
    UserFacilityType[UserFacilityType["RADIAL_DISTANCE"] = 1] = "RADIAL_DISTANCE";
    UserFacilityType[UserFacilityType["LAT_LONG"] = 2] = "LAT_LONG";
})(UserFacilityType || (UserFacilityType = {}));
/**
 * ARINC 424 Leg Types
 */
var LegType;
(function (LegType) {
    /** An unknown leg type. */
    LegType[LegType["Unknown"] = 0] = "Unknown";
    /** An arc-to-fix leg. This indicates a DME arc leg to a specified fix.*/
    LegType[LegType["AF"] = 1] = "AF";
    /** A course-to-altitude leg. */
    LegType[LegType["CA"] = 2] = "CA";
    /**
     * A course-to-DME-distance leg. This leg is flown on a wind corrected course
     * to a specific DME distance from another fix.
     */
    LegType[LegType["CD"] = 3] = "CD";
    /** A course-to-fix leg.*/
    LegType[LegType["CF"] = 4] = "CF";
    /** A course-to-intercept leg. */
    LegType[LegType["CI"] = 5] = "CI";
    /** A course-to-radial intercept leg. */
    LegType[LegType["CR"] = 6] = "CR";
    /** A direct-to-fix leg, from an unspecified starting position. */
    LegType[LegType["DF"] = 7] = "DF";
    /**
     * A fix-to-altitude leg. A FA leg is flown on a track from a fix to a
     * specified altitude.
     */
    LegType[LegType["FA"] = 8] = "FA";
    /**
     * A fix-to-distance leg. This leg is flown on a track from a fix to a
     * specific distance from the fix.
     */
    LegType[LegType["FC"] = 9] = "FC";
    /**
     * A fix to DME distance leg. This leg is flown on a track from a fix to
     * a specific DME distance from another fix.
     */
    LegType[LegType["FD"] = 10] = "FD";
    /** A course-to-manual-termination leg. */
    LegType[LegType["FM"] = 11] = "FM";
    /** A hold-to-altitude leg. The hold is flown until a specified altitude is reached. */
    LegType[LegType["HA"] = 12] = "HA";
    /**
     * A hold-to-fix leg. This indicates one time around the hold circuit and
     * then an exit.
     */
    LegType[LegType["HF"] = 13] = "HF";
    /** A hold-to-manual-termination leg. */
    LegType[LegType["HM"] = 14] = "HM";
    /** Initial procedure fix. */
    LegType[LegType["IF"] = 15] = "IF";
    /** A procedure turn leg. */
    LegType[LegType["PI"] = 16] = "PI";
    /** A radius-to-fix leg, with endpoint fixes, a center fix, and a radius. */
    LegType[LegType["RF"] = 17] = "RF";
    /** A track-to-fix leg, from the previous fix to the terminator. */
    LegType[LegType["TF"] = 18] = "TF";
    /** A heading-to-altitude leg. */
    LegType[LegType["VA"] = 19] = "VA";
    /** A heading-to-DME-distance leg. */
    LegType[LegType["VD"] = 20] = "VD";
    /** A heading-to-intercept leg. */
    LegType[LegType["VI"] = 21] = "VI";
    /** A heading-to-manual-termination leg. */
    LegType[LegType["VM"] = 22] = "VM";
    /** A heading-to-radial intercept leg. */
    LegType[LegType["VR"] = 23] = "VR";
    /** A leg representing a discontinuity in the flight plan. */
    LegType[LegType["Discontinuity"] = 99] = "Discontinuity";
})(LegType || (LegType = {}));
/**
 * Types of altitude restrictions on procedure legs.
 */
var AltitudeRestrictionType;
(function (AltitudeRestrictionType) {
    AltitudeRestrictionType[AltitudeRestrictionType["Unused"] = 0] = "Unused";
    AltitudeRestrictionType[AltitudeRestrictionType["At"] = 1] = "At";
    AltitudeRestrictionType[AltitudeRestrictionType["AtOrAbove"] = 2] = "AtOrAbove";
    AltitudeRestrictionType[AltitudeRestrictionType["AtOrBelow"] = 3] = "AtOrBelow";
    AltitudeRestrictionType[AltitudeRestrictionType["Between"] = 4] = "Between";
})(AltitudeRestrictionType || (AltitudeRestrictionType = {}));
var LegTurnDirection;
(function (LegTurnDirection) {
    LegTurnDirection[LegTurnDirection["None"] = 0] = "None";
    LegTurnDirection[LegTurnDirection["Left"] = 1] = "Left";
    LegTurnDirection[LegTurnDirection["Right"] = 2] = "Right";
    LegTurnDirection[LegTurnDirection["Either"] = 3] = "Either";
})(LegTurnDirection || (LegTurnDirection = {}));
var AirwayType;
(function (AirwayType) {
    AirwayType[AirwayType["None"] = 0] = "None";
    AirwayType[AirwayType["Victor"] = 1] = "Victor";
    AirwayType[AirwayType["Jet"] = 2] = "Jet";
    AirwayType[AirwayType["Both"] = 3] = "Both";
})(AirwayType || (AirwayType = {}));
var NdbType;
(function (NdbType) {
    NdbType[NdbType["CompassPoint"] = 0] = "CompassPoint";
    NdbType[NdbType["MH"] = 1] = "MH";
    NdbType[NdbType["H"] = 2] = "H";
    NdbType[NdbType["HH"] = 3] = "HH";
})(NdbType || (NdbType = {}));
var VorType;
(function (VorType) {
    VorType[VorType["Unknown"] = 0] = "Unknown";
    VorType[VorType["VOR"] = 1] = "VOR";
    VorType[VorType["VORDME"] = 2] = "VORDME";
    VorType[VorType["DME"] = 3] = "DME";
    VorType[VorType["TACAN"] = 4] = "TACAN";
    VorType[VorType["VORTAC"] = 5] = "VORTAC";
    VorType[VorType["ILS"] = 6] = "ILS";
    VorType[VorType["VOT"] = 7] = "VOT";
})(VorType || (VorType = {}));
var RunwaySurfaceType;
(function (RunwaySurfaceType) {
    RunwaySurfaceType[RunwaySurfaceType["Concrete"] = 0] = "Concrete";
    RunwaySurfaceType[RunwaySurfaceType["Grass"] = 1] = "Grass";
    RunwaySurfaceType[RunwaySurfaceType["WaterFSX"] = 2] = "WaterFSX";
    RunwaySurfaceType[RunwaySurfaceType["GrassBumpy"] = 3] = "GrassBumpy";
    RunwaySurfaceType[RunwaySurfaceType["Asphalt"] = 4] = "Asphalt";
    RunwaySurfaceType[RunwaySurfaceType["ShortGrass"] = 5] = "ShortGrass";
    RunwaySurfaceType[RunwaySurfaceType["LongGrass"] = 6] = "LongGrass";
    RunwaySurfaceType[RunwaySurfaceType["HardTurf"] = 7] = "HardTurf";
    RunwaySurfaceType[RunwaySurfaceType["Snow"] = 8] = "Snow";
    RunwaySurfaceType[RunwaySurfaceType["Ice"] = 9] = "Ice";
    RunwaySurfaceType[RunwaySurfaceType["Urban"] = 10] = "Urban";
    RunwaySurfaceType[RunwaySurfaceType["Forest"] = 11] = "Forest";
    RunwaySurfaceType[RunwaySurfaceType["Dirt"] = 12] = "Dirt";
    RunwaySurfaceType[RunwaySurfaceType["Coral"] = 13] = "Coral";
    RunwaySurfaceType[RunwaySurfaceType["Gravel"] = 14] = "Gravel";
    RunwaySurfaceType[RunwaySurfaceType["OilTreated"] = 15] = "OilTreated";
    RunwaySurfaceType[RunwaySurfaceType["SteelMats"] = 16] = "SteelMats";
    RunwaySurfaceType[RunwaySurfaceType["Bituminous"] = 17] = "Bituminous";
    RunwaySurfaceType[RunwaySurfaceType["Brick"] = 18] = "Brick";
    RunwaySurfaceType[RunwaySurfaceType["Macadam"] = 19] = "Macadam";
    RunwaySurfaceType[RunwaySurfaceType["Planks"] = 20] = "Planks";
    RunwaySurfaceType[RunwaySurfaceType["Sand"] = 21] = "Sand";
    RunwaySurfaceType[RunwaySurfaceType["Shale"] = 22] = "Shale";
    RunwaySurfaceType[RunwaySurfaceType["Tarmac"] = 23] = "Tarmac";
    RunwaySurfaceType[RunwaySurfaceType["WrightFlyerTrack"] = 24] = "WrightFlyerTrack";
    //SURFACE_TYPE_LAST_FSX
    RunwaySurfaceType[RunwaySurfaceType["Ocean"] = 26] = "Ocean";
    RunwaySurfaceType[RunwaySurfaceType["Water"] = 27] = "Water";
    RunwaySurfaceType[RunwaySurfaceType["Pond"] = 28] = "Pond";
    RunwaySurfaceType[RunwaySurfaceType["Lake"] = 29] = "Lake";
    RunwaySurfaceType[RunwaySurfaceType["River"] = 30] = "River";
    RunwaySurfaceType[RunwaySurfaceType["WasteWater"] = 31] = "WasteWater";
    RunwaySurfaceType[RunwaySurfaceType["Paint"] = 32] = "Paint";
    // UNUSED
    // SURFACE_TYPE_ERASE_GRASS
})(RunwaySurfaceType || (RunwaySurfaceType = {}));
var RunwayLightingType;
(function (RunwayLightingType) {
    RunwayLightingType[RunwayLightingType["Unknown"] = 0] = "Unknown";
    RunwayLightingType[RunwayLightingType["None"] = 1] = "None";
    RunwayLightingType[RunwayLightingType["PartTime"] = 2] = "PartTime";
    RunwayLightingType[RunwayLightingType["FullTime"] = 3] = "FullTime";
    RunwayLightingType[RunwayLightingType["Frequency"] = 4] = "Frequency";
})(RunwayLightingType || (RunwayLightingType = {}));
var AirportPrivateType;
(function (AirportPrivateType) {
    AirportPrivateType[AirportPrivateType["Uknown"] = 0] = "Uknown";
    AirportPrivateType[AirportPrivateType["Public"] = 1] = "Public";
    AirportPrivateType[AirportPrivateType["Military"] = 2] = "Military";
    AirportPrivateType[AirportPrivateType["Private"] = 3] = "Private";
})(AirportPrivateType || (AirportPrivateType = {}));
var GpsBoolean;
(function (GpsBoolean) {
    GpsBoolean[GpsBoolean["Unknown"] = 0] = "Unknown";
    GpsBoolean[GpsBoolean["No"] = 1] = "No";
    GpsBoolean[GpsBoolean["Yes"] = 2] = "Yes";
})(GpsBoolean || (GpsBoolean = {}));
var VorClass;
(function (VorClass) {
    VorClass[VorClass["Unknown"] = 0] = "Unknown";
    VorClass[VorClass["Terminal"] = 1] = "Terminal";
    VorClass[VorClass["LowAlt"] = 2] = "LowAlt";
    VorClass[VorClass["HighAlt"] = 3] = "HighAlt";
    VorClass[VorClass["ILS"] = 4] = "ILS";
    VorClass[VorClass["VOT"] = 5] = "VOT";
})(VorClass || (VorClass = {}));
var FacilityType;
(function (FacilityType) {
    FacilityType["Airport"] = "LOAD_AIRPORT";
    FacilityType["Intersection"] = "LOAD_INTERSECTION";
    FacilityType["VOR"] = "LOAD_VOR";
    FacilityType["NDB"] = "LOAD_NDB";
    FacilityType["USR"] = "USR";
    FacilityType["RWY"] = "RWY";
    FacilityType["VIS"] = "VIS";
})(FacilityType || (FacilityType = {}));
var FacilitySearchType;
(function (FacilitySearchType) {
    FacilitySearchType[FacilitySearchType["None"] = 0] = "None";
    FacilitySearchType[FacilitySearchType["Airport"] = 1] = "Airport";
    FacilitySearchType[FacilitySearchType["Intersection"] = 2] = "Intersection";
    FacilitySearchType[FacilitySearchType["Vor"] = 3] = "Vor";
    FacilitySearchType[FacilitySearchType["Ndb"] = 4] = "Ndb";
    FacilitySearchType[FacilitySearchType["Boundary"] = 5] = "Boundary";
    FacilitySearchType[FacilitySearchType["User"] = 6] = "User";
})(FacilitySearchType || (FacilitySearchType = {}));
/**
 * A type of airspace boundary.
 */
var BoundaryType;
(function (BoundaryType) {
    BoundaryType[BoundaryType["None"] = 0] = "None";
    BoundaryType[BoundaryType["Center"] = 1] = "Center";
    BoundaryType[BoundaryType["ClassA"] = 2] = "ClassA";
    BoundaryType[BoundaryType["ClassB"] = 3] = "ClassB";
    BoundaryType[BoundaryType["ClassC"] = 4] = "ClassC";
    BoundaryType[BoundaryType["ClassD"] = 5] = "ClassD";
    BoundaryType[BoundaryType["ClassE"] = 6] = "ClassE";
    BoundaryType[BoundaryType["ClassF"] = 7] = "ClassF";
    BoundaryType[BoundaryType["ClassG"] = 8] = "ClassG";
    BoundaryType[BoundaryType["Tower"] = 9] = "Tower";
    BoundaryType[BoundaryType["Clearance"] = 10] = "Clearance";
    BoundaryType[BoundaryType["Ground"] = 11] = "Ground";
    BoundaryType[BoundaryType["Departure"] = 12] = "Departure";
    BoundaryType[BoundaryType["Approach"] = 13] = "Approach";
    BoundaryType[BoundaryType["MOA"] = 14] = "MOA";
    BoundaryType[BoundaryType["Restricted"] = 15] = "Restricted";
    BoundaryType[BoundaryType["Prohibited"] = 16] = "Prohibited";
    BoundaryType[BoundaryType["Warning"] = 17] = "Warning";
    BoundaryType[BoundaryType["Alert"] = 18] = "Alert";
    BoundaryType[BoundaryType["Danger"] = 19] = "Danger";
    BoundaryType[BoundaryType["NationalPark"] = 20] = "NationalPark";
    BoundaryType[BoundaryType["ModeC"] = 21] = "ModeC";
    BoundaryType[BoundaryType["Radar"] = 22] = "Radar";
    BoundaryType[BoundaryType["Training"] = 23] = "Training";
})(BoundaryType || (BoundaryType = {}));
/**
 * A type of airspace boundary altitude maxima.
 */
var BoundaryAltitudeType;
(function (BoundaryAltitudeType) {
    BoundaryAltitudeType[BoundaryAltitudeType["Unknown"] = 0] = "Unknown";
    BoundaryAltitudeType[BoundaryAltitudeType["MSL"] = 1] = "MSL";
    BoundaryAltitudeType[BoundaryAltitudeType["AGL"] = 2] = "AGL";
    BoundaryAltitudeType[BoundaryAltitudeType["Unlimited"] = 3] = "Unlimited";
})(BoundaryAltitudeType || (BoundaryAltitudeType = {}));
/**
 * A type of boundary geometry vector.
 */
var BoundaryVectorType;
(function (BoundaryVectorType) {
    BoundaryVectorType[BoundaryVectorType["None"] = 0] = "None";
    BoundaryVectorType[BoundaryVectorType["Start"] = 1] = "Start";
    BoundaryVectorType[BoundaryVectorType["Line"] = 2] = "Line";
    BoundaryVectorType[BoundaryVectorType["Origin"] = 3] = "Origin";
    BoundaryVectorType[BoundaryVectorType["ArcCW"] = 4] = "ArcCW";
    BoundaryVectorType[BoundaryVectorType["ArcCCW"] = 5] = "ArcCCW";
    BoundaryVectorType[BoundaryVectorType["Circle"] = 6] = "Circle";
})(BoundaryVectorType || (BoundaryVectorType = {}));
/**
 * Wind speed units used by METAR.
 */
var MetarWindSpeedUnits;
(function (MetarWindSpeedUnits) {
    MetarWindSpeedUnits[MetarWindSpeedUnits["Knot"] = 0] = "Knot";
    MetarWindSpeedUnits[MetarWindSpeedUnits["MeterPerSecond"] = 1] = "MeterPerSecond";
    MetarWindSpeedUnits[MetarWindSpeedUnits["KilometerPerHour"] = 2] = "KilometerPerHour";
})(MetarWindSpeedUnits || (MetarWindSpeedUnits = {}));
/** Visibility distance units used by METAR. */
var MetarVisibilityUnits;
(function (MetarVisibilityUnits) {
    MetarVisibilityUnits[MetarVisibilityUnits["Meter"] = 0] = "Meter";
    MetarVisibilityUnits[MetarVisibilityUnits["StatuteMile"] = 1] = "StatuteMile";
})(MetarVisibilityUnits || (MetarVisibilityUnits = {}));
/**
 * METAR cloud layer coverage/sky condition.
 */
var MetarCloudLayerCoverage;
(function (MetarCloudLayerCoverage) {
    MetarCloudLayerCoverage[MetarCloudLayerCoverage["SkyClear"] = 0] = "SkyClear";
    MetarCloudLayerCoverage[MetarCloudLayerCoverage["Clear"] = 1] = "Clear";
    MetarCloudLayerCoverage[MetarCloudLayerCoverage["NoSignificant"] = 2] = "NoSignificant";
    MetarCloudLayerCoverage[MetarCloudLayerCoverage["Few"] = 3] = "Few";
    MetarCloudLayerCoverage[MetarCloudLayerCoverage["Scattered"] = 4] = "Scattered";
    MetarCloudLayerCoverage[MetarCloudLayerCoverage["Broken"] = 5] = "Broken";
    MetarCloudLayerCoverage[MetarCloudLayerCoverage["Overcast"] = 6] = "Overcast";
})(MetarCloudLayerCoverage || (MetarCloudLayerCoverage = {}));
/**
 * METAR significant cloud types.
 */
var MetarCloudLayerType;
(function (MetarCloudLayerType) {
    MetarCloudLayerType[MetarCloudLayerType["Unspecified"] = -1] = "Unspecified";
    MetarCloudLayerType[MetarCloudLayerType["ToweringCumulus"] = 0] = "ToweringCumulus";
    MetarCloudLayerType[MetarCloudLayerType["Cumulonimbus"] = 1] = "Cumulonimbus";
    MetarCloudLayerType[MetarCloudLayerType["AltocumulusCastellanus"] = 2] = "AltocumulusCastellanus";
})(MetarCloudLayerType || (MetarCloudLayerType = {}));
/** METAR phenomenon types. */
var MetarPhenomenonType;
(function (MetarPhenomenonType) {
    MetarPhenomenonType[MetarPhenomenonType["None"] = 0] = "None";
    MetarPhenomenonType[MetarPhenomenonType["Mist"] = 1] = "Mist";
    MetarPhenomenonType[MetarPhenomenonType["Duststorm"] = 2] = "Duststorm";
    MetarPhenomenonType[MetarPhenomenonType["Dust"] = 3] = "Dust";
    MetarPhenomenonType[MetarPhenomenonType["Drizzle"] = 4] = "Drizzle";
    MetarPhenomenonType[MetarPhenomenonType["FunnelCloud"] = 5] = "FunnelCloud";
    MetarPhenomenonType[MetarPhenomenonType["Fog"] = 6] = "Fog";
    MetarPhenomenonType[MetarPhenomenonType["Smoke"] = 7] = "Smoke";
    MetarPhenomenonType[MetarPhenomenonType["Hail"] = 8] = "Hail";
    MetarPhenomenonType[MetarPhenomenonType["SmallHail"] = 9] = "SmallHail";
    MetarPhenomenonType[MetarPhenomenonType["Haze"] = 10] = "Haze";
    MetarPhenomenonType[MetarPhenomenonType["IceCrystals"] = 11] = "IceCrystals";
    MetarPhenomenonType[MetarPhenomenonType["IcePellets"] = 12] = "IcePellets";
    MetarPhenomenonType[MetarPhenomenonType["DustSandWhorls"] = 13] = "DustSandWhorls";
    MetarPhenomenonType[MetarPhenomenonType["Spray"] = 14] = "Spray";
    MetarPhenomenonType[MetarPhenomenonType["Rain"] = 15] = "Rain";
    MetarPhenomenonType[MetarPhenomenonType["Sand"] = 16] = "Sand";
    MetarPhenomenonType[MetarPhenomenonType["SnowGrains"] = 17] = "SnowGrains";
    MetarPhenomenonType[MetarPhenomenonType["Shower"] = 18] = "Shower";
    MetarPhenomenonType[MetarPhenomenonType["Snow"] = 19] = "Snow";
    MetarPhenomenonType[MetarPhenomenonType["Squalls"] = 20] = "Squalls";
    MetarPhenomenonType[MetarPhenomenonType["Sandstorm"] = 21] = "Sandstorm";
    MetarPhenomenonType[MetarPhenomenonType["UnknownPrecip"] = 22] = "UnknownPrecip";
    MetarPhenomenonType[MetarPhenomenonType["VolcanicAsh"] = 23] = "VolcanicAsh";
})(MetarPhenomenonType || (MetarPhenomenonType = {}));
/** METAR phenomenon intensities. */
var MetarPhenomenonIntensity;
(function (MetarPhenomenonIntensity) {
    MetarPhenomenonIntensity[MetarPhenomenonIntensity["Light"] = -1] = "Light";
    MetarPhenomenonIntensity[MetarPhenomenonIntensity["Normal"] = 0] = "Normal";
    MetarPhenomenonIntensity[MetarPhenomenonIntensity["Heavy"] = 1] = "Heavy";
})(MetarPhenomenonIntensity || (MetarPhenomenonIntensity = {}));

({
    [RunwayDesignator.RUNWAY_DESIGNATOR_NONE]: '',
    [RunwayDesignator.RUNWAY_DESIGNATOR_LEFT]: 'L',
    [RunwayDesignator.RUNWAY_DESIGNATOR_RIGHT]: 'R',
    [RunwayDesignator.RUNWAY_DESIGNATOR_CENTER]: 'C',
    [RunwayDesignator.RUNWAY_DESIGNATOR_WATER]: 'W',
    [RunwayDesignator.RUNWAY_DESIGNATOR_A]: 'A',
    [RunwayDesignator.RUNWAY_DESIGNATOR_B]: 'B',
});
new GeoPoint(0, 0);

/// <reference types="msfstypes/JS/common" />
/**
 * A type map of facility type to facility search type.
 */
({
    /** Airport facility type. */
    [FacilityType.Airport]: FacilitySearchType.Airport,
    /** Intersection facility type. */
    [FacilityType.Intersection]: FacilitySearchType.Intersection,
    /** NDB facility type. */
    [FacilityType.NDB]: FacilitySearchType.Ndb,
    /** VOR facility type. */
    [FacilityType.VOR]: FacilitySearchType.Vor,
    /** USR facility type. */
    [FacilityType.USR]: FacilitySearchType.User
});
[FacilityType.USR];
/**
 * WT Airway Status Enum
 */
var AirwayStatus;
(function (AirwayStatus) {
    /**
     * @readonly
     * @property {number} INCOMPLETE - indicates waypoints have not been loaded yet.
     */
    AirwayStatus[AirwayStatus["INCOMPLETE"] = 0] = "INCOMPLETE";
    /**
     * @readonly
     * @property {number} COMPLETE - indicates all waypoints have been successfully loaded.
     */
    AirwayStatus[AirwayStatus["COMPLETE"] = 1] = "COMPLETE";
    /**
     * @readonly
     * @property {number} PARTIAL - indicates some, but not all, waypoints have been successfully loaded.
     */
    AirwayStatus[AirwayStatus["PARTIAL"] = 2] = "PARTIAL";
})(AirwayStatus || (AirwayStatus = {}));

var FacilityRepositorySyncType;
(function (FacilityRepositorySyncType) {
    FacilityRepositorySyncType[FacilityRepositorySyncType["Add"] = 0] = "Add";
    FacilityRepositorySyncType[FacilityRepositorySyncType["Remove"] = 1] = "Remove";
    FacilityRepositorySyncType[FacilityRepositorySyncType["DumpRequest"] = 2] = "DumpRequest";
    FacilityRepositorySyncType[FacilityRepositorySyncType["DumpResponse"] = 3] = "DumpResponse";
})(FacilityRepositorySyncType || (FacilityRepositorySyncType = {}));

/**
 * A type map of search type to concrete facility loader query type.
 */
new Map([
    [FacilitySearchType.Airport, FacilityType.Airport],
    [FacilitySearchType.Intersection, FacilityType.Intersection],
    [FacilitySearchType.Vor, FacilityType.VOR],
    [FacilitySearchType.Ndb, FacilityType.NDB],
    [FacilitySearchType.User, FacilityType.USR]
]);

[new GeoCircle(new Float64Array(3), 0)];

var IcaoSearchFilter;
(function (IcaoSearchFilter) {
    IcaoSearchFilter[IcaoSearchFilter["ALL"] = 0] = "ALL";
    IcaoSearchFilter[IcaoSearchFilter["AIRPORT"] = 1] = "AIRPORT";
    IcaoSearchFilter[IcaoSearchFilter["VOR"] = 2] = "VOR";
    IcaoSearchFilter[IcaoSearchFilter["NDB"] = 3] = "NDB";
    IcaoSearchFilter[IcaoSearchFilter["INTERSECTION"] = 4] = "INTERSECTION";
    IcaoSearchFilter[IcaoSearchFilter["USR"] = 5] = "USR";
})(IcaoSearchFilter || (IcaoSearchFilter = {}));

/// <reference types="msfstypes/JS/simvar" />
new Map([
    ['ias', { name: 'AIRSPEED INDICATED', type: SimVarValueType.Knots }],
    ['tas', { name: 'AIRSPEED TRUE', type: SimVarValueType.Knots }],
    ['alt', { name: 'INDICATED ALTITUDE', type: SimVarValueType.Feet }],
    ['vs', { name: 'VERTICAL SPEED', type: SimVarValueType.FPM }],
    ['hdg_deg', { name: 'PLANE HEADING DEGREES MAGNETIC', type: SimVarValueType.Degree }],
    ['pitch_deg', { name: 'PLANE PITCH DEGREES', type: SimVarValueType.Degree }],
    ['roll_deg', { name: 'PLANE BANK DEGREES', type: SimVarValueType.Degree }],
    ['hdg_deg_true', { name: 'PLANE HEADING DEGREES TRUE', type: SimVarValueType.Degree }],
    ['kohlsman_setting_hg_1', { name: 'KOHLSMAN SETTING HG', type: SimVarValueType.InHG }],
    ['turn_coordinator_ball', { name: 'TURN COORDINATOR BALL', type: SimVarValueType.Number }],
    ['delta_heading_rate', { name: 'DELTA HEADING RATE', type: SimVarValueType.Degree }],
    ['ambient_temp_c', { name: 'AMBIENT TEMPERATURE', type: SimVarValueType.Celsius }],
    ['ambient_wind_velocity', { name: 'AMBIENT WIND VELOCITY', type: SimVarValueType.Knots }],
    ['ambient_wind_direction', { name: 'AMBIENT WIND DIRECTION', type: SimVarValueType.Degree }],
    ['kohlsman_setting_mb_1', { name: 'KOHLSMAN SETTING MB', type: SimVarValueType.MB }],
    ['baro_units_hpa_1', { name: 'L:XMLVAR_Baro_Selector_HPA_1', type: SimVarValueType.Bool }],
    ['on_ground', { name: 'SIM ON GROUND', type: SimVarValueType.Bool }],
    ['aoa', { name: 'INCIDENCE ALPHA', type: SimVarValueType.Degree }]
]);

// Common definitions relevant to all radio types.
/** The basic radio types. */
var RadioType;
(function (RadioType) {
    RadioType["Com"] = "COM";
    RadioType["Nav"] = "NAV";
    RadioType["Adf"] = "ADF";
})(RadioType || (RadioType = {}));
/** The two frequency "banks", active and standby. */
var FrequencyBank;
(function (FrequencyBank) {
    FrequencyBank[FrequencyBank["Active"] = 0] = "Active";
    FrequencyBank[FrequencyBank["Standby"] = 1] = "Standby";
})(FrequencyBank || (FrequencyBank = {}));
/** COM frequency spacing on COM radios. */
var ComSpacing;
(function (ComSpacing) {
    /** 25Khz spacing */
    ComSpacing[ComSpacing["Spacing25Khz"] = 0] = "Spacing25Khz";
    /** 8.33Khz spacing */
    ComSpacing[ComSpacing["Spacing833Khz"] = 1] = "Spacing833Khz";
})(ComSpacing || (ComSpacing = {}));

/// <reference types="msfstypes/JS/simvar" />
new Map([
    ['nav1_obs', { name: 'NAV OBS:1', type: SimVarValueType.Degree }],
    ['nav1_cdi', { name: 'NAV CDI:1', type: SimVarValueType.Number }],
    ['nav1_dme', { name: 'NAV DME:1', type: SimVarValueType.NM }],
    ['nav1_has_dme', { name: 'NAV HAS DME:1', type: SimVarValueType.Bool }],
    ['nav1_has_nav', { name: 'NAV HAS NAV:1', type: SimVarValueType.Bool }],
    ['nav1_radial', { name: 'NAV RADIAL:1', type: SimVarValueType.Radians }],
    ['nav1_signal', { name: 'NAV SIGNAL:1', type: SimVarValueType.Number }],
    ['nav1_ident', { name: 'NAV IDENT:1', type: SimVarValueType.String }],
    ['nav1_to_from', { name: 'NAV TOFROM:1', type: SimVarValueType.Enum }],
    ['nav1_localizer', { name: 'NAV HAS LOCALIZER:1', type: SimVarValueType.Bool }],
    ['nav1_localizer_crs', { name: 'NAV LOCALIZER:1', type: SimVarValueType.Number }],
    ['nav1_glideslope', { name: 'NAV HAS GLIDE SLOPE:1', type: SimVarValueType.Bool }],
    ['nav1_gs_error', { name: 'NAV GLIDE SLOPE ERROR:1', type: SimVarValueType.Degree }],
    ['nav1_raw_gs', { name: 'NAV RAW GLIDE SLOPE:1', type: SimVarValueType.Degree }],
    ['nav1_gs_lla', { name: 'NAV GS LATLONALT:1', type: SimVarValueType.LLA }],
    ['nav1_lla', { name: 'NAV VOR LATLONALT:1', type: SimVarValueType.LLA }],
    ['nav1_magvar', { name: 'NAV MAGVAR:1', type: SimVarValueType.Number }],
    ['nav2_obs', { name: 'NAV OBS:2', type: SimVarValueType.Degree }],
    ['nav2_cdi', { name: 'NAV CDI:2', type: SimVarValueType.Number }],
    ['nav2_dme', { name: 'NAV DME:2', type: SimVarValueType.NM }],
    ['nav2_has_dme', { name: 'NAV HAS DME:2', type: SimVarValueType.Bool }],
    ['nav2_has_nav', { name: 'NAV HAS NAV:2', type: SimVarValueType.Bool }],
    ['nav2_radial', { name: 'NAV RADIAL:2', type: SimVarValueType.Radians }],
    ['nav2_signal', { name: 'NAV SIGNAL:2', type: SimVarValueType.Number }],
    ['nav2_ident', { name: 'NAV IDENT:2', type: SimVarValueType.String }],
    ['nav2_to_from', { name: 'NAV TOFROM:2', type: SimVarValueType.Enum }],
    ['nav2_localizer', { name: 'NAV HAS LOCALIZER:2', type: SimVarValueType.Bool }],
    ['nav2_localizer_crs', { name: 'NAV LOCALIZER:2', type: SimVarValueType.Number }],
    ['nav2_glideslope', { name: 'NAV HAS GLIDE SLOPE:2', type: SimVarValueType.Bool }],
    ['nav2_gs_error', { name: 'NAV GLIDE SLOPE ERROR:2', type: SimVarValueType.Degree }],
    ['nav2_raw_gs', { name: 'NAV RAW GLIDE SLOPE:2', type: SimVarValueType.Degree }],
    ['nav2_gs_lla', { name: 'NAV GS LATLONALT:2', type: SimVarValueType.LLA }],
    ['nav2_lla', { name: 'NAV VOR LATLONALT:2', type: SimVarValueType.LLA }],
    ['nav2_magvar', { name: 'NAV MAGVAR:2', type: SimVarValueType.Number }],
    ['gps_dtk', { name: 'GPS WP DESIRED TRACK', type: SimVarValueType.Degree }],
    ['gps_xtk', { name: 'GPS WP CROSS TRK', type: SimVarValueType.NM }],
    ['gps_wp', { name: 'GPS WP NEXT ID', type: SimVarValueType.NM }],
    ['gps_wp_bearing', { name: 'GPS WP BEARING', type: SimVarValueType.Degree }],
    ['gps_wp_distance', { name: 'GPS WP DISTANCE', type: SimVarValueType.NM }],
    ['adf1_bearing', { name: 'ADF RADIAL:1', type: SimVarValueType.Radians }],
    ['adf1_signal', { name: 'ADF SIGNAL:1', type: SimVarValueType.Number }],
    ['mkr_bcn_state_simvar', { name: 'MARKER BEACON STATE', type: SimVarValueType.Number }],
    ['gps_obs_active_simvar', { name: 'GPS OBS ACTIVE', type: SimVarValueType.Bool }],
    ['gps_obs_value_simvar', { name: 'GPS OBS VALUE', type: SimVarValueType.Degree }]
]);
//
// Navigation event configurations
//
var NavSourceType;
(function (NavSourceType) {
    NavSourceType[NavSourceType["Nav"] = 0] = "Nav";
    NavSourceType[NavSourceType["Gps"] = 1] = "Gps";
    NavSourceType[NavSourceType["Adf"] = 2] = "Adf";
})(NavSourceType || (NavSourceType = {}));
//* ENUM for VOR To/From Flag */
var VorToFrom;
(function (VorToFrom) {
    VorToFrom[VorToFrom["OFF"] = 0] = "OFF";
    VorToFrom[VorToFrom["TO"] = 1] = "TO";
    VorToFrom[VorToFrom["FROM"] = 2] = "FROM";
})(VorToFrom || (VorToFrom = {}));
/** Marker beacon signal state. */
var MarkerBeaconState;
(function (MarkerBeaconState) {
    MarkerBeaconState[MarkerBeaconState["Inactive"] = 0] = "Inactive";
    MarkerBeaconState[MarkerBeaconState["Outer"] = 1] = "Outer";
    MarkerBeaconState[MarkerBeaconState["Middle"] = 2] = "Middle";
    MarkerBeaconState[MarkerBeaconState["Inner"] = 3] = "Inner";
})(MarkerBeaconState || (MarkerBeaconState = {}));

new Map([
    ['nav1ActiveFreq', { name: 'NAV ACTIVE FREQUENCY:1', type: SimVarValueType.MHz }],
    ['nav1StandbyFreq', { name: 'NAV STANDBY FREQUENCY:1', type: SimVarValueType.MHz }],
    ['nav1Ident', { name: 'NAV IDENT:1', type: SimVarValueType.String }],
    ['nav2ActiveFreq', { name: 'NAV ACTIVE FREQUENCY:2', type: SimVarValueType.MHz }],
    ['nav2StandbyFreq', { name: 'NAV STANDBY FREQUENCY:2', type: SimVarValueType.MHz }],
    ['nav2Ident', { name: 'NAV IDENT:2', type: SimVarValueType.String }],
    ['com1ActiveFreq', { name: 'COM ACTIVE FREQUENCY:1', type: SimVarValueType.MHz }],
    ['com1StandbyFreq', { name: 'COM STANDBY FREQUENCY:1', type: SimVarValueType.MHz }],
    ['com2ActiveFreq', { name: 'COM ACTIVE FREQUENCY:2', type: SimVarValueType.MHz }],
    ['com2StandbyFreq', { name: 'COM STANDBY FREQUENCY:2', type: SimVarValueType.MHz }],
    ['adf1StandbyFreq', { name: 'ADF STANDBY FREQUENCY:1', type: SimVarValueType.KHz }],
    ['adf1ActiveFreq', { name: 'ADF ACTIVE FREQUENCY:1', type: SimVarValueType.KHz }]
]);

/// <reference types="msfstypes/JS/simvar" />
var APLockType;
(function (APLockType) {
    APLockType[APLockType["Heading"] = 0] = "Heading";
    APLockType[APLockType["Nav"] = 1] = "Nav";
    APLockType[APLockType["Alt"] = 2] = "Alt";
    APLockType[APLockType["Bank"] = 3] = "Bank";
    APLockType[APLockType["WingLevel"] = 4] = "WingLevel";
    APLockType[APLockType["Vs"] = 5] = "Vs";
    APLockType[APLockType["Flc"] = 6] = "Flc";
    APLockType[APLockType["Pitch"] = 7] = "Pitch";
    APLockType[APLockType["Approach"] = 8] = "Approach";
    APLockType[APLockType["Backcourse"] = 9] = "Backcourse";
    APLockType[APLockType["Glideslope"] = 10] = "Glideslope";
    APLockType[APLockType["VNav"] = 11] = "VNav";
})(APLockType || (APLockType = {}));
new Map([
    // TODO extend the next two to handle multiple APs?
    ['selected_heading', { name: 'AUTOPILOT HEADING LOCK DIR:1', type: SimVarValueType.Degree }],
    ['selected_altitude', { name: 'AUTOPILOT ALTITUDE LOCK VAR:1', type: SimVarValueType.Feet }],
    ['ap_master_status', { name: 'AUTOPILOT MASTER', type: SimVarValueType.Bool }],
    ['ap_heading_lock', { name: 'AUTOPILOT HEADING LOCK', type: SimVarValueType.Bool }],
    ['ap_nav_lock', { name: 'AUTOPILOT NAV1 LOCK', type: SimVarValueType.Bool }],
    ['ap_bank_hold', { name: 'AUTOPILOT BANK HOLD', type: SimVarValueType.Bool }],
    ['ap_wing_lvl', { name: 'AUTOPILOT WING LEVELER', type: SimVarValueType.Bool }],
    ['ap_approach_hold', { name: 'AUTOPILOT APPROACH HOLD', type: SimVarValueType.Bool }],
    ['ap_backcourse_hold', { name: 'AUTOPILOT BACKCOURSE HOLD', type: SimVarValueType.Bool }],
    ['ap_vs_hold', { name: 'AUTOPILOT VERTICAL HOLD', type: SimVarValueType.Bool }],
    ['ap_flc_hold', { name: 'AUTOPILOT FLIGHT LEVEL CHANGE', type: SimVarValueType.Bool }],
    ['ap_alt_lock', { name: 'AUTOPILOT ALTITUDE LOCK', type: SimVarValueType.Bool }],
    ['ap_glideslope_hold', { name: 'AUTOPILOT GLIDESLOPE HOLD', type: SimVarValueType.Bool }],
    ['ap_pitch_hold', { name: 'AUTOPILOT PITCH HOLD', type: SimVarValueType.Bool }],
    ['vs_hold_fpm', { name: 'AUTOPILOT VERTICAL HOLD VAR:1', type: SimVarValueType.FPM }],
    ['flc_hold_knots', { name: 'AUTOPILOT AIRSPEED HOLD VAR', type: SimVarValueType.Knots }],
    ['flight_director_bank', { name: 'AUTOPILOT FLIGHT DIRECTOR BANK', type: SimVarValueType.Degree }],
    ['flight_director_pitch', { name: 'AUTOPILOT FLIGHT DIRECTOR PITCH', type: SimVarValueType.Degree }],
    ['flight_director_lock', { name: 'AUTOPILOT FLIGHT DIRECTOR ACTIVE', type: SimVarValueType.Bool }],
    ['vnav_active', { name: 'L:XMLVAR_VNAVButtonValue', type: SimVarValueType.Bool }],
    ['alt_lock', { name: 'AUTOPILOT ALTITUDE LOCK', type: SimVarValueType.Bool }],
    ['pitch_ref', { name: 'AUTOPILOT PITCH HOLD REF', type: SimVarValueType.Degree }],
    ['kap_140_simvar', { name: 'L:WT1000_AP_KAP140_INSTALLED', type: SimVarValueType.Bool }]
]);

/// <reference types="msfstypes/JS/simvar" />
new Map([
    ['rpm_1', { name: 'GENERAL ENG RPM:1', type: SimVarValueType.RPM }],
    ['recip_ff_1', { name: 'RECIP ENG FUEL FLOW:1', type: SimVarValueType.PPH }],
    ['oil_press_1', { name: 'ENG OIL PRESSURE:1', type: SimVarValueType.PSI }],
    ['oil_temp_1', { name: 'ENG OIL TEMPERATURE:1', type: SimVarValueType.Farenheit }],
    ['egt_1', { name: 'ENG EXHAUST GAS TEMPERATURE:1', type: SimVarValueType.Farenheit }],
    ['vac', { name: 'SUCTION PRESSURE', type: SimVarValueType.InHG }],
    ['fuel_total', { name: 'FUEL TOTAL QUANTITY', type: SimVarValueType.GAL }],
    ['fuel_left', { name: 'FUEL LEFT QUANTITY', type: SimVarValueType.GAL }],
    ['fuel_right', { name: 'FUEL RIGHT QUANTITY', type: SimVarValueType.GAL }],
    ['eng_hours_1', { name: 'GENERAL ENG ELAPSED TIME:1', type: SimVarValueType.Hours }],
    ['elec_bus_main_v', { name: 'ELECTRICAL MAIN BUS VOLTAGE', type: SimVarValueType.Volts }],
    ['elec_bus_main_a', { name: 'ELECTRICAL MAIN BUS AMPS', type: SimVarValueType.Amps }],
    ['elec_bus_avionics_v', { name: 'ELECTRICAL AVIONICS BUS VOLTAGE', type: SimVarValueType.Volts }],
    ['elec_bus_avionics_a', { name: 'ELECTRICAL AVIONICS BUS AMPS', type: SimVarValueType.Amps }],
    ['elec_bus_genalt_1_v', { name: 'ELECTRICAL GENALT BUS VOLTAGE:1', type: SimVarValueType.Volts }],
    ['elec_bus_genalt_1_a', { name: 'ELECTRICAL GENALT BUS AMPS:1', type: SimVarValueType.Amps }],
    ['elec_bat_a', { name: 'ELECTRICAL BATTERY LOAD', type: SimVarValueType.Amps }],
    ['elec_bat_v', { name: 'ELECTRICAL BATTERY VOLTAGE', type: SimVarValueType.Volts }]
]);

/** Transponder modes. */
var XPDRMode;
(function (XPDRMode) {
    XPDRMode[XPDRMode["OFF"] = 0] = "OFF";
    XPDRMode[XPDRMode["STBY"] = 1] = "STBY";
    XPDRMode[XPDRMode["TEST"] = 2] = "TEST";
    XPDRMode[XPDRMode["ON"] = 3] = "ON";
    XPDRMode[XPDRMode["ALT"] = 4] = "ALT";
    XPDRMode[XPDRMode["GROUND"] = 5] = "GROUND";
})(XPDRMode || (XPDRMode = {}));
new Map([
    ['xpdrMode1', { name: 'TRANSPONDER STATE:1', type: SimVarValueType.Number }],
    ['xpdrCode1', { name: 'TRANSPONDER CODE:1', type: SimVarValueType.Number }],
    ['xpdrIdent', { name: 'TRANSPONDER IDENT:1', type: SimVarValueType.Bool }]
]);

new GeoPoint(0, 0);

/// <reference types="msfstypes/JS/simvar" />
new Map([
    ['elec_master_battery', { name: 'ELECTRICAL MASTER BATTERY', type: SimVarValueType.Bool }],
    ['elec_circuit_avionics_on', { name: 'CIRCUIT AVIONICS ON', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom1_on', { name: 'CIRCUIT NAVCOM1 ON', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom2_on', { name: 'CIRCUIT NAVCOM2 ON', type: SimVarValueType.Bool }],
    ['elec_circuit_navcom3_on', { name: 'CIRCUIT NAVCOM3 ON', type: SimVarValueType.Bool }]
]);

/**
 * The transition type to which a flight path vector belongs.
 */
var FlightPathVectorFlags;
(function (FlightPathVectorFlags) {
    FlightPathVectorFlags[FlightPathVectorFlags["None"] = 0] = "None";
    FlightPathVectorFlags[FlightPathVectorFlags["TurnToCourse"] = 1] = "TurnToCourse";
    FlightPathVectorFlags[FlightPathVectorFlags["Arc"] = 2] = "Arc";
    FlightPathVectorFlags[FlightPathVectorFlags["HoldEntry"] = 4] = "HoldEntry";
    FlightPathVectorFlags[FlightPathVectorFlags["HoldLeg"] = 8] = "HoldLeg";
    FlightPathVectorFlags[FlightPathVectorFlags["CourseReversal"] = 16] = "CourseReversal";
    FlightPathVectorFlags[FlightPathVectorFlags["LegToLegTurn"] = 32] = "LegToLegTurn";
    FlightPathVectorFlags[FlightPathVectorFlags["AnticipatedTurn"] = 64] = "AnticipatedTurn";
})(FlightPathVectorFlags || (FlightPathVectorFlags = {}));
/**
 * A prototype for signalling application-specific type metadata for plan segments.
 */
var FlightPlanSegmentType;
(function (FlightPlanSegmentType) {
    FlightPlanSegmentType["Origin"] = "Origin";
    FlightPlanSegmentType["Departure"] = "Departure";
    FlightPlanSegmentType["Enroute"] = "Enroute";
    FlightPlanSegmentType["Arrival"] = "Arrival";
    FlightPlanSegmentType["Approach"] = "Approach";
    FlightPlanSegmentType["Destination"] = "Destination";
    FlightPlanSegmentType["MissedApproach"] = "MissedApproach";
    FlightPlanSegmentType["RandomDirectTo"] = "RandomDirectTo";
})(FlightPlanSegmentType || (FlightPlanSegmentType = {}));
/**
 * A segment of a flight plan.
 */
class FlightPlanSegment {
    /**
     * Creates a new FlightPlanSegment.
     * @param segmentIndex The index of the segment within the flight plan.
     * @param offset The leg offset within the original flight plan that
     * the segment starts at.
     * @param legs The legs in the flight plan segment.
     * @param segmentType The type of segment this is.
     * @param airway The airway associated with this segment, if any.
     */
    constructor(segmentIndex, offset, legs, segmentType = FlightPlanSegmentType.Enroute, airway) {
        this.segmentIndex = segmentIndex;
        this.offset = offset;
        this.legs = legs;
        this.segmentType = segmentType;
        this.airway = airway;
    }
}
/** An empty flight plan segment. */
FlightPlanSegment.Empty = new FlightPlanSegment(-1, -1, []);
/**
 * Bitflags describing a leg definition.
 */
var LegDefinitionFlags;
(function (LegDefinitionFlags) {
    LegDefinitionFlags[LegDefinitionFlags["None"] = 0] = "None";
    LegDefinitionFlags[LegDefinitionFlags["DirectTo"] = 1] = "DirectTo";
    LegDefinitionFlags[LegDefinitionFlags["MissedApproach"] = 2] = "MissedApproach";
    LegDefinitionFlags[LegDefinitionFlags["Obs"] = 4] = "Obs";
    LegDefinitionFlags[LegDefinitionFlags["VectorsToFinal"] = 8] = "VectorsToFinal";
})(LegDefinitionFlags || (LegDefinitionFlags = {}));

[new GeoPoint(0, 0), new GeoPoint(0, 0)];
[new GeoCircle(new Float64Array(3), 0)];

/* eslint-disable @typescript-eslint/no-non-null-assertion */
[new GeoPoint(0, 0), new GeoPoint(0, 0)];
[new GeoCircle(new Float64Array(3), 0)];
[new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
[new GeoCircle(new Float64Array(3), 0)];
[new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
[new GeoCircle(new Float64Array(3), 0)];
[new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)];
[
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0)
];
[new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)];
[new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)];
[
    new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0),
    new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)
];
[new GeoCircle(new Float64Array(3), 0)];

[new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
[
    new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0),
    new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)
];
[new GeoPoint(0, 0), new GeoPoint(0, 0)];
({
    geoPoint: [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)],
    geoCircle: [new GeoCircle(new Float64Array(3), 0), new GeoCircle(new Float64Array(3), 0)]
});

var PlanChangeType;
(function (PlanChangeType) {
    PlanChangeType["Added"] = "Added";
    PlanChangeType["Inserted"] = "Inserted";
    PlanChangeType["Removed"] = "Removed";
    PlanChangeType["Changed"] = "Changed";
    PlanChangeType["Cleared"] = "Cleared";
})(PlanChangeType || (PlanChangeType = {}));
var ActiveLegType;
(function (ActiveLegType) {
    ActiveLegType["Lateral"] = "Lateral";
    ActiveLegType["Vertical"] = "Vertical";
    ActiveLegType["Calculating"] = "Calculating";
})(ActiveLegType || (ActiveLegType = {}));
var OriginDestChangeType;
(function (OriginDestChangeType) {
    OriginDestChangeType["OriginAdded"] = "OriginAdded";
    OriginDestChangeType["OriginRemoved"] = "OriginRemoved";
    OriginDestChangeType["DestinationAdded"] = "DestinationAdded";
    OriginDestChangeType["DestinationRemoved"] = "DestinationRemoved";
})(OriginDestChangeType || (OriginDestChangeType = {}));

/**
 * TCAS operating modes.
 */
var TCASOperatingMode;
(function (TCASOperatingMode) {
    TCASOperatingMode[TCASOperatingMode["Standby"] = 0] = "Standby";
    TCASOperatingMode[TCASOperatingMode["TAOnly"] = 1] = "TAOnly";
    TCASOperatingMode[TCASOperatingMode["TA_RA"] = 2] = "TA_RA";
})(TCASOperatingMode || (TCASOperatingMode = {}));
/**
 * TCAS alert level.
 */
var TCASAlertLevel;
(function (TCASAlertLevel) {
    TCASAlertLevel[TCASAlertLevel["None"] = 0] = "None";
    TCASAlertLevel[TCASAlertLevel["ProximityAdvisory"] = 1] = "ProximityAdvisory";
    TCASAlertLevel[TCASAlertLevel["TrafficAdvisory"] = 2] = "TrafficAdvisory";
    TCASAlertLevel[TCASAlertLevel["ResolutionAdvisory"] = 3] = "ResolutionAdvisory";
})(TCASAlertLevel || (TCASAlertLevel = {}));
UnitType.KNOT.createNumber(30);

var APVerticalModes;
(function (APVerticalModes) {
    APVerticalModes[APVerticalModes["NONE"] = 0] = "NONE";
    APVerticalModes[APVerticalModes["PITCH"] = 1] = "PITCH";
    APVerticalModes[APVerticalModes["VS"] = 2] = "VS";
    APVerticalModes[APVerticalModes["FLC"] = 3] = "FLC";
    APVerticalModes[APVerticalModes["ALT"] = 4] = "ALT";
    APVerticalModes[APVerticalModes["VNAV"] = 5] = "VNAV";
    APVerticalModes[APVerticalModes["GP"] = 6] = "GP";
    APVerticalModes[APVerticalModes["GS"] = 7] = "GS";
    APVerticalModes[APVerticalModes["CAP"] = 8] = "CAP";
})(APVerticalModes || (APVerticalModes = {}));
var APLateralModes;
(function (APLateralModes) {
    APLateralModes[APLateralModes["NONE"] = 0] = "NONE";
    APLateralModes[APLateralModes["ROLL"] = 1] = "ROLL";
    APLateralModes[APLateralModes["LEVEL"] = 2] = "LEVEL";
    APLateralModes[APLateralModes["GPSS"] = 3] = "GPSS";
    APLateralModes[APLateralModes["HEADING"] = 4] = "HEADING";
    APLateralModes[APLateralModes["VOR"] = 5] = "VOR";
    APLateralModes[APLateralModes["LOC"] = 6] = "LOC";
    APLateralModes[APLateralModes["BC"] = 7] = "BC";
    APLateralModes[APLateralModes["NAV"] = 8] = "NAV";
})(APLateralModes || (APLateralModes = {}));
var APAltitudeModes;
(function (APAltitudeModes) {
    APAltitudeModes[APAltitudeModes["NONE"] = 0] = "NONE";
    APAltitudeModes[APAltitudeModes["ALTS"] = 1] = "ALTS";
    APAltitudeModes[APAltitudeModes["ALTV"] = 2] = "ALTV";
})(APAltitudeModes || (APAltitudeModes = {}));

/** AP Mode Types */
var APModeType;
(function (APModeType) {
    APModeType[APModeType["LATERAL"] = 0] = "LATERAL";
    APModeType[APModeType["VERTICAL"] = 1] = "VERTICAL";
    APModeType[APModeType["APPROACH"] = 2] = "APPROACH";
})(APModeType || (APModeType = {}));

var APStates;
(function (APStates) {
    APStates[APStates["None"] = 0] = "None";
    APStates[APStates["APActive"] = 1] = "APActive";
    APStates[APStates["YawDamper"] = 2] = "YawDamper";
    APStates[APStates["Heading"] = 4] = "Heading";
    APStates[APStates["Nav"] = 8] = "Nav";
    APStates[APStates["NavArmed"] = 16] = "NavArmed";
    APStates[APStates["Approach"] = 32] = "Approach";
    APStates[APStates["ApproachArmed"] = 64] = "ApproachArmed";
    APStates[APStates["Backcourse"] = 128] = "Backcourse";
    APStates[APStates["BackcourseArmed"] = 256] = "BackcourseArmed";
    APStates[APStates["Alt"] = 512] = "Alt";
    APStates[APStates["AltS"] = 1024] = "AltS";
    APStates[APStates["AltV"] = 2048] = "AltV";
    APStates[APStates["VS"] = 4096] = "VS";
    APStates[APStates["FLC"] = 8192] = "FLC";
    APStates[APStates["GP"] = 16384] = "GP";
    APStates[APStates["GPArmed"] = 32768] = "GPArmed";
    APStates[APStates["GS"] = 65536] = "GS";
    APStates[APStates["GSArmed"] = 131072] = "GSArmed";
    APStates[APStates["Path"] = 262144] = "Path";
    APStates[APStates["PathArmed"] = 524288] = "PathArmed";
    APStates[APStates["PathInvalid"] = 1048576] = "PathInvalid";
    APStates[APStates["Pitch"] = 2097152] = "Pitch";
    APStates[APStates["Roll"] = 4194304] = "Roll";
    APStates[APStates["VNAV"] = 8388608] = "VNAV";
    APStates[APStates["ATSpeed"] = 16777216] = "ATSpeed";
    APStates[APStates["ATMach"] = 33554432] = "ATMach";
    APStates[APStates["ATArmed"] = 67108864] = "ATArmed";
    APStates[APStates["FD"] = 134217728] = "FD";
})(APStates || (APStates = {}));

/**
 * The state of a given plane director.
 */
var DirectorState;
(function (DirectorState) {
    /** The plane director is not currently armed or active. */
    DirectorState["Inactive"] = "Inactive";
    /** The plane director is currently armed. */
    DirectorState["Armed"] = "Armed";
    /** The plane director is currently active. */
    DirectorState["Active"] = "Active";
})(DirectorState || (DirectorState = {}));

/**
 * The current vertical navigation state.
 */
var VNavMode;
(function (VNavMode) {
    /** VNAV Disabled. */
    VNavMode[VNavMode["Disabled"] = 0] = "Disabled";
    /** VNAV Enabled. */
    VNavMode[VNavMode["Enabled"] = 1] = "Enabled";
})(VNavMode || (VNavMode = {}));
/**
 * The current VNAV path mode.
 */
var VNavPathMode;
(function (VNavPathMode) {
    /** VNAV path is not active. */
    VNavPathMode[VNavPathMode["None"] = 0] = "None";
    /** VNAV path is armed for capture. */
    VNavPathMode[VNavPathMode["PathArmed"] = 1] = "PathArmed";
    /** VNAV path is actively navigating. */
    VNavPathMode[VNavPathMode["PathActive"] = 2] = "PathActive";
    /** The current VNAV path is not valid. */
    VNavPathMode[VNavPathMode["PathInvalid"] = 3] = "PathInvalid";
})(VNavPathMode || (VNavPathMode = {}));
/**
 * The current VNAV approach guidance mode.
 */
var VNavApproachGuidanceMode;
(function (VNavApproachGuidanceMode) {
    /** VNAV is not currently following approach guidance. */
    VNavApproachGuidanceMode[VNavApproachGuidanceMode["None"] = 0] = "None";
    /** VNAV has armed ILS glideslope guidance for capture. */
    VNavApproachGuidanceMode[VNavApproachGuidanceMode["GSArmed"] = 1] = "GSArmed";
    /** VNAV is actively following ILS glideslope guidance. */
    VNavApproachGuidanceMode[VNavApproachGuidanceMode["GSActive"] = 2] = "GSActive";
    /** VNAV RNAV glidepath guidance is armed for capture. */
    VNavApproachGuidanceMode[VNavApproachGuidanceMode["GPArmed"] = 3] = "GPArmed";
    /** VNAV is actively follow RNAV glidepath guidance. */
    VNavApproachGuidanceMode[VNavApproachGuidanceMode["GPActive"] = 4] = "GPActive";
})(VNavApproachGuidanceMode || (VNavApproachGuidanceMode = {}));
/**
 * The current VNAV altitude capture type.
 */
var VNavAltCaptureType;
(function (VNavAltCaptureType) {
    /** Altitude capture is not armed. */
    VNavAltCaptureType[VNavAltCaptureType["None"] = 0] = "None";
    /** Altitude will capture the selected altitude. */
    VNavAltCaptureType[VNavAltCaptureType["Selected"] = 1] = "Selected";
    /** Altitude will capture the VANV target altitude. */
    VNavAltCaptureType[VNavAltCaptureType["VNAV"] = 2] = "VNAV";
})(VNavAltCaptureType || (VNavAltCaptureType = {}));

// do not edit .js files directly - edit src/index.jst



var fastDeepEqual = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;

    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }



    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];

      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a!==a && b!==b;
};

/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at.
 *
 *      Http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DEFAULT_ID = "__googleMapsScriptId";
/**
 * The status of the [[Loader]].
 */
var LoaderStatus;
(function (LoaderStatus) {
    LoaderStatus[LoaderStatus["INITIALIZED"] = 0] = "INITIALIZED";
    LoaderStatus[LoaderStatus["LOADING"] = 1] = "LOADING";
    LoaderStatus[LoaderStatus["SUCCESS"] = 2] = "SUCCESS";
    LoaderStatus[LoaderStatus["FAILURE"] = 3] = "FAILURE";
})(LoaderStatus || (LoaderStatus = {}));
/**
 * [[Loader]] makes it easier to add Google Maps JavaScript API to your application
 * dynamically using
 * [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
 * It works by dynamically creating and appending a script node to the the
 * document head and wrapping the callback function so as to return a promise.
 *
 * ```
 * const loader = new Loader({
 *   apiKey: "",
 *   version: "weekly",
 *   libraries: ["places"]
 * });
 *
 * loader.load().then((google) => {
 *   const map = new google.maps.Map(...)
 * })
 * ```
 */
class Loader {
    /**
     * Creates an instance of Loader using [[LoaderOptions]]. No defaults are set
     * using this library, instead the defaults are set by the Google Maps
     * JavaScript API server.
     *
     * ```
     * const loader = Loader({apiKey, version: 'weekly', libraries: ['places']});
     * ```
     */
    constructor({ apiKey, channel, client, id = DEFAULT_ID, libraries = [], language, region, version, mapIds, nonce, retries = 3, url = "https://maps.googleapis.com/maps/api/js", }) {
        this.CALLBACK = "__googleMapsCallback";
        this.callbacks = [];
        this.done = false;
        this.loading = false;
        this.errors = [];
        this.version = version;
        this.apiKey = apiKey;
        this.channel = channel;
        this.client = client;
        this.id = id || DEFAULT_ID; // Do not allow empty string
        this.libraries = libraries;
        this.language = language;
        this.region = region;
        this.mapIds = mapIds;
        this.nonce = nonce;
        this.retries = retries;
        this.url = url;
        if (Loader.instance) {
            if (!fastDeepEqual(this.options, Loader.instance.options)) {
                throw new Error(`Loader must not be called again with different options. ${JSON.stringify(this.options)} !== ${JSON.stringify(Loader.instance.options)}`);
            }
            return Loader.instance;
        }
        Loader.instance = this;
    }
    get options() {
        return {
            version: this.version,
            apiKey: this.apiKey,
            channel: this.channel,
            client: this.client,
            id: this.id,
            libraries: this.libraries,
            language: this.language,
            region: this.region,
            mapIds: this.mapIds,
            nonce: this.nonce,
            url: this.url,
        };
    }
    get status() {
        if (this.errors.length) {
            return LoaderStatus.FAILURE;
        }
        if (this.done) {
            return LoaderStatus.SUCCESS;
        }
        if (this.loading) {
            return LoaderStatus.LOADING;
        }
        return LoaderStatus.INITIALIZED;
    }
    get failed() {
        return this.done && !this.loading && this.errors.length >= this.retries + 1;
    }
    /**
     * CreateUrl returns the Google Maps JavaScript API script url given the [[LoaderOptions]].
     *
     * @ignore
     */
    createUrl() {
        let url = this.url;
        url += `?callback=${this.CALLBACK}`;
        if (this.apiKey) {
            url += `&key=${this.apiKey}`;
        }
        if (this.channel) {
            url += `&channel=${this.channel}`;
        }
        if (this.client) {
            url += `&client=${this.client}`;
        }
        if (this.libraries.length > 0) {
            url += `&libraries=${this.libraries.join(",")}`;
        }
        if (this.language) {
            url += `&language=${this.language}`;
        }
        if (this.region) {
            url += `&region=${this.region}`;
        }
        if (this.version) {
            url += `&v=${this.version}`;
        }
        if (this.mapIds) {
            url += `&map_ids=${this.mapIds.join(",")}`;
        }
        return url;
    }
    deleteScript() {
        const script = document.getElementById(this.id);
        if (script) {
            script.remove();
        }
    }
    /**
     * Load the Google Maps JavaScript API script and return a Promise.
     */
    load() {
        return this.loadPromise();
    }
    /**
     * Load the Google Maps JavaScript API script and return a Promise.
     *
     * @ignore
     */
    loadPromise() {
        return new Promise((resolve, reject) => {
            this.loadCallback((err) => {
                if (!err) {
                    resolve(window.google);
                }
                else {
                    reject(err.error);
                }
            });
        });
    }
    /**
     * Load the Google Maps JavaScript API script with a callback.
     */
    loadCallback(fn) {
        this.callbacks.push(fn);
        this.execute();
    }
    /**
     * Set the script on document.
     */
    setScript() {
        if (document.getElementById(this.id)) {
            // TODO wrap onerror callback for cases where the script was loaded elsewhere
            this.callback();
            return;
        }
        const url = this.createUrl();
        const script = document.createElement("script");
        script.id = this.id;
        script.type = "text/javascript";
        script.src = url;
        script.onerror = this.loadErrorCallback.bind(this);
        script.defer = true;
        script.async = true;
        if (this.nonce) {
            script.nonce = this.nonce;
        }
        document.head.appendChild(script);
    }
    /**
     * Reset the loader state.
     */
    reset() {
        this.deleteScript();
        this.done = false;
        this.loading = false;
        this.errors = [];
        this.onerrorEvent = null;
    }
    resetIfRetryingFailed() {
        if (this.failed) {
            this.reset();
        }
    }
    loadErrorCallback(e) {
        this.errors.push(e);
        if (this.errors.length <= this.retries) {
            const delay = this.errors.length * Math.pow(2, this.errors.length);
            console.log(`Failed to load Google Maps script, retrying in ${delay} ms.`);
            setTimeout(() => {
                this.deleteScript();
                this.setScript();
            }, delay);
        }
        else {
            this.onerrorEvent = e;
            this.callback();
        }
    }
    setCallback() {
        window.__googleMapsCallback = this.callback.bind(this);
    }
    callback() {
        this.done = true;
        this.loading = false;
        this.callbacks.forEach((cb) => {
            cb(this.onerrorEvent);
        });
        this.callbacks = [];
    }
    execute() {
        this.resetIfRetryingFailed();
        if (this.done) {
            this.callback();
        }
        else {
            // short circuit and warn if google.maps is already loaded
            if (window.google && window.google.maps && window.google.maps.version) {
                console.warn("Google Maps already loaded outside @googlemaps/js-api-loader." +
                    "This may result in undesirable behavior as options and script parameters may not match.");
                this.callback();
                return;
            }
            if (this.loading) ;
            else {
                this.loading = true;
                this.setCallback();
                this.setScript();
            }
        }
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Deferred {
    constructor() {
        this.reject = () => { };
        this.resolve = () => { };
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    /**
     * Our API internals are not promiseified and cannot because our callback APIs have subtle expectations around
     * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
     * and returns a node-style callback which will resolve or reject the Deferred's promise.
     */
    wrapCallback(callback) {
        return (error, value) => {
            if (error) {
                this.reject(error);
            }
            else {
                this.resolve(value);
            }
            if (typeof callback === 'function') {
                // Attaching noop handler just in case developer wasn't expecting
                // promises
                this.promise.catch(() => { });
                // Some of our callbacks don't expect a value and our own tests
                // assert that the parameter length is 1
                if (callback.length === 1) {
                    callback(error);
                }
                else {
                    callback(error, value);
                }
            }
        };
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Returns navigator.userAgent string or '' if it's not defined.
 * @return user agent string
 */
function getUA() {
    if (typeof navigator !== 'undefined' &&
        typeof navigator['userAgent'] === 'string') {
        return navigator['userAgent'];
    }
    else {
        return '';
    }
}
/**
 * Detect Cordova / PhoneGap / Ionic frameworks on a mobile device.
 *
 * Deliberately does not rely on checking `file://` URLs (as this fails PhoneGap
 * in the Ripple emulator) nor Cordova `onDeviceReady`, which would normally
 * wait for a callback.
 */
function isMobileCordova() {
    return (typeof window !== 'undefined' &&
        // @ts-ignore Setting up an broadly applicable index signature for Window
        // just to deal with this case would probably be a bad idea.
        !!(window['cordova'] || window['phonegap'] || window['PhoneGap']) &&
        /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(getUA()));
}
function isBrowserExtension() {
    const runtime = typeof chrome === 'object'
        ? chrome.runtime
        : typeof browser === 'object'
            ? browser.runtime
            : undefined;
    return typeof runtime === 'object' && runtime.id !== undefined;
}
/**
 * Detect React Native.
 *
 * @return true if ReactNative environment is detected.
 */
function isReactNative() {
    return (typeof navigator === 'object' && navigator['product'] === 'ReactNative');
}
/** Detects Electron apps. */
function isElectron() {
    return getUA().indexOf('Electron/') >= 0;
}
/** Detects Internet Explorer. */
function isIE() {
    const ua = getUA();
    return ua.indexOf('MSIE ') >= 0 || ua.indexOf('Trident/') >= 0;
}
/** Detects Universal Windows Platform apps. */
function isUWP() {
    return getUA().indexOf('MSAppHost/') >= 0;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview Standardized Firebase Error.
 *
 * Usage:
 *
 *   // Typescript string literals for type-safe codes
 *   type Err =
 *     'unknown' |
 *     'object-not-found'
 *     ;
 *
 *   // Closure enum for type-safe error codes
 *   // at-enum {string}
 *   var Err = {
 *     UNKNOWN: 'unknown',
 *     OBJECT_NOT_FOUND: 'object-not-found',
 *   }
 *
 *   let errors: Map<Err, string> = {
 *     'generic-error': "Unknown error",
 *     'file-not-found': "Could not find file: {$file}",
 *   };
 *
 *   // Type-safe function - must pass a valid error code as param.
 *   let error = new ErrorFactory<Err>('service', 'Service', errors);
 *
 *   ...
 *   throw error.create(Err.GENERIC);
 *   ...
 *   throw error.create(Err.FILE_NOT_FOUND, {'file': fileName});
 *   ...
 *   // Service: Could not file file: foo.txt (service/file-not-found).
 *
 *   catch (e) {
 *     assert(e.message === "Could not find file: foo.txt.");
 *     if (e.code === 'service/file-not-found') {
 *       console.log("Could not read file: " + e['file']);
 *     }
 *   }
 */
const ERROR_NAME = 'FirebaseError';
// Based on code from:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types
class FirebaseError extends Error {
    constructor(
    /** The error code for this error. */
    code, message, 
    /** Custom data for this error. */
    customData) {
        super(message);
        this.code = code;
        this.customData = customData;
        /** The custom name for all FirebaseErrors. */
        this.name = ERROR_NAME;
        // Fix For ES5
        // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, FirebaseError.prototype);
        // Maintains proper stack trace for where our error was thrown.
        // Only available on V8.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ErrorFactory.prototype.create);
        }
    }
}
class ErrorFactory {
    constructor(service, serviceName, errors) {
        this.service = service;
        this.serviceName = serviceName;
        this.errors = errors;
    }
    create(code, ...data) {
        const customData = data[0] || {};
        const fullCode = `${this.service}/${code}`;
        const template = this.errors[code];
        const message = template ? replaceTemplate(template, customData) : 'Error';
        // Service Name: Error message (service/code).
        const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
        const error = new FirebaseError(fullCode, fullMessage, customData);
        return error;
    }
}
function replaceTemplate(template, data) {
    return template.replace(PATTERN, (_, key) => {
        const value = data[key];
        return value != null ? String(value) : `<${key}?>`;
    });
}
const PATTERN = /\{\$([^}]+)}/g;
/**
 * Deep equal two objects. Support Arrays and Objects.
 */
function deepEqual(a, b) {
    if (a === b) {
        return true;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    for (const k of aKeys) {
        if (!bKeys.includes(k)) {
            return false;
        }
        const aProp = a[k];
        const bProp = b[k];
        if (isObject(aProp) && isObject(bProp)) {
            if (!deepEqual(aProp, bProp)) {
                return false;
            }
        }
        else if (aProp !== bProp) {
            return false;
        }
    }
    for (const k of bKeys) {
        if (!aKeys.includes(k)) {
            return false;
        }
    }
    return true;
}
function isObject(thing) {
    return thing !== null && typeof thing === 'object';
}

/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function getModularInstance(service) {
    if (service && service._delegate) {
        return service._delegate;
    }
    else {
        return service;
    }
}

/**
 * Component for service name T, e.g. `auth`, `auth-internal`
 */
class Component {
    /**
     *
     * @param name The public service name, e.g. app, auth, firestore, database
     * @param instanceFactory Service factory responsible for creating the public interface
     * @param type whether the service provided by the component is public or private
     */
    constructor(name, instanceFactory, type) {
        this.name = name;
        this.instanceFactory = instanceFactory;
        this.type = type;
        this.multipleInstances = false;
        /**
         * Properties to be added to the service namespace
         */
        this.serviceProps = {};
        this.instantiationMode = "LAZY" /* LAZY */;
        this.onInstanceCreated = null;
    }
    setInstantiationMode(mode) {
        this.instantiationMode = mode;
        return this;
    }
    setMultipleInstances(multipleInstances) {
        this.multipleInstances = multipleInstances;
        return this;
    }
    setServiceProps(props) {
        this.serviceProps = props;
        return this;
    }
    setInstanceCreatedCallback(callback) {
        this.onInstanceCreated = callback;
        return this;
    }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DEFAULT_ENTRY_NAME$1 = '[DEFAULT]';

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Provider for instance for service name T, e.g. 'auth', 'auth-internal'
 * NameServiceMapping[T] is an alias for the type of the instance
 */
class Provider {
    constructor(name, container) {
        this.name = name;
        this.container = container;
        this.component = null;
        this.instances = new Map();
        this.instancesDeferred = new Map();
        this.instancesOptions = new Map();
        this.onInitCallbacks = new Map();
    }
    /**
     * @param identifier A provider can provide mulitple instances of a service
     * if this.component.multipleInstances is true.
     */
    get(identifier) {
        // if multipleInstances is not supported, use the default name
        const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
        if (!this.instancesDeferred.has(normalizedIdentifier)) {
            const deferred = new Deferred();
            this.instancesDeferred.set(normalizedIdentifier, deferred);
            if (this.isInitialized(normalizedIdentifier) ||
                this.shouldAutoInitialize()) {
                // initialize the service if it can be auto-initialized
                try {
                    const instance = this.getOrInitializeService({
                        instanceIdentifier: normalizedIdentifier
                    });
                    if (instance) {
                        deferred.resolve(instance);
                    }
                }
                catch (e) {
                    // when the instance factory throws an exception during get(), it should not cause
                    // a fatal error. We just return the unresolved promise in this case.
                }
            }
        }
        return this.instancesDeferred.get(normalizedIdentifier).promise;
    }
    getImmediate(options) {
        var _a;
        // if multipleInstances is not supported, use the default name
        const normalizedIdentifier = this.normalizeInstanceIdentifier(options === null || options === void 0 ? void 0 : options.identifier);
        const optional = (_a = options === null || options === void 0 ? void 0 : options.optional) !== null && _a !== void 0 ? _a : false;
        if (this.isInitialized(normalizedIdentifier) ||
            this.shouldAutoInitialize()) {
            try {
                return this.getOrInitializeService({
                    instanceIdentifier: normalizedIdentifier
                });
            }
            catch (e) {
                if (optional) {
                    return null;
                }
                else {
                    throw e;
                }
            }
        }
        else {
            // In case a component is not initialized and should/can not be auto-initialized at the moment, return null if the optional flag is set, or throw
            if (optional) {
                return null;
            }
            else {
                throw Error(`Service ${this.name} is not available`);
            }
        }
    }
    getComponent() {
        return this.component;
    }
    setComponent(component) {
        if (component.name !== this.name) {
            throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
        }
        if (this.component) {
            throw Error(`Component for ${this.name} has already been provided`);
        }
        this.component = component;
        // return early without attempting to initialize the component if the component requires explicit initialization (calling `Provider.initialize()`)
        if (!this.shouldAutoInitialize()) {
            return;
        }
        // if the service is eager, initialize the default instance
        if (isComponentEager(component)) {
            try {
                this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME$1 });
            }
            catch (e) {
                // when the instance factory for an eager Component throws an exception during the eager
                // initialization, it should not cause a fatal error.
                // TODO: Investigate if we need to make it configurable, because some component may want to cause
                // a fatal error in this case?
            }
        }
        // Create service instances for the pending promises and resolve them
        // NOTE: if this.multipleInstances is false, only the default instance will be created
        // and all promises with resolve with it regardless of the identifier.
        for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
            const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
            try {
                // `getOrInitializeService()` should always return a valid instance since a component is guaranteed. use ! to make typescript happy.
                const instance = this.getOrInitializeService({
                    instanceIdentifier: normalizedIdentifier
                });
                instanceDeferred.resolve(instance);
            }
            catch (e) {
                // when the instance factory throws an exception, it should not cause
                // a fatal error. We just leave the promise unresolved.
            }
        }
    }
    clearInstance(identifier = DEFAULT_ENTRY_NAME$1) {
        this.instancesDeferred.delete(identifier);
        this.instancesOptions.delete(identifier);
        this.instances.delete(identifier);
    }
    // app.delete() will call this method on every provider to delete the services
    // TODO: should we mark the provider as deleted?
    async delete() {
        const services = Array.from(this.instances.values());
        await Promise.all([
            ...services
                .filter(service => 'INTERNAL' in service) // legacy services
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map(service => service.INTERNAL.delete()),
            ...services
                .filter(service => '_delete' in service) // modularized services
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map(service => service._delete())
        ]);
    }
    isComponentSet() {
        return this.component != null;
    }
    isInitialized(identifier = DEFAULT_ENTRY_NAME$1) {
        return this.instances.has(identifier);
    }
    getOptions(identifier = DEFAULT_ENTRY_NAME$1) {
        return this.instancesOptions.get(identifier) || {};
    }
    initialize(opts = {}) {
        const { options = {} } = opts;
        const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
        if (this.isInitialized(normalizedIdentifier)) {
            throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
        }
        if (!this.isComponentSet()) {
            throw Error(`Component ${this.name} has not been registered yet`);
        }
        const instance = this.getOrInitializeService({
            instanceIdentifier: normalizedIdentifier,
            options
        });
        // resolve any pending promise waiting for the service instance
        for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
            const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
            if (normalizedIdentifier === normalizedDeferredIdentifier) {
                instanceDeferred.resolve(instance);
            }
        }
        return instance;
    }
    /**
     *
     * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
     * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
     *
     * @param identifier An optional instance identifier
     * @returns a function to unregister the callback
     */
    onInit(callback, identifier) {
        var _a;
        const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
        const existingCallbacks = (_a = this.onInitCallbacks.get(normalizedIdentifier)) !== null && _a !== void 0 ? _a : new Set();
        existingCallbacks.add(callback);
        this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
        const existingInstance = this.instances.get(normalizedIdentifier);
        if (existingInstance) {
            callback(existingInstance, normalizedIdentifier);
        }
        return () => {
            existingCallbacks.delete(callback);
        };
    }
    /**
     * Invoke onInit callbacks synchronously
     * @param instance the service instance`
     */
    invokeOnInitCallbacks(instance, identifier) {
        const callbacks = this.onInitCallbacks.get(identifier);
        if (!callbacks) {
            return;
        }
        for (const callback of callbacks) {
            try {
                callback(instance, identifier);
            }
            catch (_a) {
                // ignore errors in the onInit callback
            }
        }
    }
    getOrInitializeService({ instanceIdentifier, options = {} }) {
        let instance = this.instances.get(instanceIdentifier);
        if (!instance && this.component) {
            instance = this.component.instanceFactory(this.container, {
                instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
                options
            });
            this.instances.set(instanceIdentifier, instance);
            this.instancesOptions.set(instanceIdentifier, options);
            /**
             * Invoke onInit listeners.
             * Note this.component.onInstanceCreated is different, which is used by the component creator,
             * while onInit listeners are registered by consumers of the provider.
             */
            this.invokeOnInitCallbacks(instance, instanceIdentifier);
            /**
             * Order is important
             * onInstanceCreated() should be called after this.instances.set(instanceIdentifier, instance); which
             * makes `isInitialized()` return true.
             */
            if (this.component.onInstanceCreated) {
                try {
                    this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
                }
                catch (_a) {
                    // ignore errors in the onInstanceCreatedCallback
                }
            }
        }
        return instance || null;
    }
    normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME$1) {
        if (this.component) {
            return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME$1;
        }
        else {
            return identifier; // assume multiple instances are supported before the component is provided.
        }
    }
    shouldAutoInitialize() {
        return (!!this.component &&
            this.component.instantiationMode !== "EXPLICIT" /* EXPLICIT */);
    }
}
// undefined should be passed to the service factory for the default instance
function normalizeIdentifierForFactory(identifier) {
    return identifier === DEFAULT_ENTRY_NAME$1 ? undefined : identifier;
}
function isComponentEager(component) {
    return component.instantiationMode === "EAGER" /* EAGER */;
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * ComponentContainer that provides Providers for service name T, e.g. `auth`, `auth-internal`
 */
class ComponentContainer {
    constructor(name) {
        this.name = name;
        this.providers = new Map();
    }
    /**
     *
     * @param component Component being added
     * @param overwrite When a component with the same name has already been registered,
     * if overwrite is true: overwrite the existing component with the new component and create a new
     * provider with the new component. It can be useful in tests where you want to use different mocks
     * for different tests.
     * if overwrite is false: throw an exception
     */
    addComponent(component) {
        const provider = this.getProvider(component.name);
        if (provider.isComponentSet()) {
            throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
        }
        provider.setComponent(component);
    }
    addOrOverwriteComponent(component) {
        const provider = this.getProvider(component.name);
        if (provider.isComponentSet()) {
            // delete the existing provider from the container, so we can register the new component
            this.providers.delete(component.name);
        }
        this.addComponent(component);
    }
    /**
     * getProvider provides a type safe interface where it can only be called with a field name
     * present in NameServiceMapping interface.
     *
     * Firebase SDKs providing services should extend NameServiceMapping interface to register
     * themselves.
     */
    getProvider(name) {
        if (this.providers.has(name)) {
            return this.providers.get(name);
        }
        // create a Provider for a service that hasn't registered with Firebase
        const provider = new Provider(name, this);
        this.providers.set(name, provider);
        return provider;
    }
    getProviders() {
        return Array.from(this.providers.values());
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A container for all of the Logger instances
 */
const instances = [];
/**
 * The JS SDK supports 5 log levels and also allows a user the ability to
 * silence the logs altogether.
 *
 * The order is a follows:
 * DEBUG < VERBOSE < INFO < WARN < ERROR
 *
 * All of the log types above the current log level will be captured (i.e. if
 * you set the log level to `INFO`, errors will still be logged, but `DEBUG` and
 * `VERBOSE` logs will not)
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["VERBOSE"] = 1] = "VERBOSE";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
    LogLevel[LogLevel["SILENT"] = 5] = "SILENT";
})(LogLevel || (LogLevel = {}));
const levelStringToEnum = {
    'debug': LogLevel.DEBUG,
    'verbose': LogLevel.VERBOSE,
    'info': LogLevel.INFO,
    'warn': LogLevel.WARN,
    'error': LogLevel.ERROR,
    'silent': LogLevel.SILENT
};
/**
 * The default log level
 */
const defaultLogLevel = LogLevel.INFO;
/**
 * By default, `console.debug` is not displayed in the developer console (in
 * chrome). To avoid forcing users to have to opt-in to these logs twice
 * (i.e. once for firebase, and once in the console), we are sending `DEBUG`
 * logs to the `console.log` function.
 */
const ConsoleMethod = {
    [LogLevel.DEBUG]: 'log',
    [LogLevel.VERBOSE]: 'log',
    [LogLevel.INFO]: 'info',
    [LogLevel.WARN]: 'warn',
    [LogLevel.ERROR]: 'error'
};
/**
 * The default log handler will forward DEBUG, VERBOSE, INFO, WARN, and ERROR
 * messages on to their corresponding console counterparts (if the log method
 * is supported by the current log level)
 */
const defaultLogHandler = (instance, logType, ...args) => {
    if (logType < instance.logLevel) {
        return;
    }
    const now = new Date().toISOString();
    const method = ConsoleMethod[logType];
    if (method) {
        console[method](`[${now}]  ${instance.name}:`, ...args);
    }
    else {
        throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
    }
};
class fireLogger {
    /**
     * Gives you an instance of a Logger to capture messages according to
     * Firebase's logging scheme.
     *
     * @param name The name that the logs will be associated with
     */
    constructor(name) {
        this.name = name;
        /**
         * The log level of the given Logger instance.
         */
        this._logLevel = defaultLogLevel;
        /**
         * The main (internal) log handler for the Logger instance.
         * Can be set to a new function in internal package code but not by user.
         */
        this._logHandler = defaultLogHandler;
        /**
         * The optional, additional, user-defined log handler for the Logger instance.
         */
        this._userLogHandler = null;
        /**
         * Capture the current instance for later use
         */
        instances.push(this);
    }
    get logLevel() {
        return this._logLevel;
    }
    set logLevel(val) {
        if (!(val in LogLevel)) {
            throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
        }
        this._logLevel = val;
    }
    // Workaround for setter/getter having to be the same type.
    setLogLevel(val) {
        this._logLevel = typeof val === 'string' ? levelStringToEnum[val] : val;
    }
    get logHandler() {
        return this._logHandler;
    }
    set logHandler(val) {
        if (typeof val !== 'function') {
            throw new TypeError('Value assigned to `logHandler` must be a function');
        }
        this._logHandler = val;
    }
    get userLogHandler() {
        return this._userLogHandler;
    }
    set userLogHandler(val) {
        this._userLogHandler = val;
    }
    /**
     * The functions below are all based on the `console` interface
     */
    debug(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
        this._logHandler(this, LogLevel.DEBUG, ...args);
    }
    log(...args) {
        this._userLogHandler &&
            this._userLogHandler(this, LogLevel.VERBOSE, ...args);
        this._logHandler(this, LogLevel.VERBOSE, ...args);
    }
    info(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
        this._logHandler(this, LogLevel.INFO, ...args);
    }
    warn(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
        this._logHandler(this, LogLevel.WARN, ...args);
    }
    error(...args) {
        this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
        this._logHandler(this, LogLevel.ERROR, ...args);
    }
}
function setLogLevel$1(level) {
    instances.forEach(inst => {
        inst.setLogLevel(level);
    });
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class PlatformLoggerServiceImpl {
    constructor(container) {
        this.container = container;
    }
    // In initial implementation, this will be called by installations on
    // auth token refresh, and installations will send this string.
    getPlatformInfoString() {
        const providers = this.container.getProviders();
        // Loop through providers and get library/version pairs from any that are
        // version components.
        return providers
            .map(provider => {
            if (isVersionServiceProvider(provider)) {
                const service = provider.getImmediate();
                return `${service.library}/${service.version}`;
            }
            else {
                return null;
            }
        })
            .filter(logString => logString)
            .join(' ');
    }
}
/**
 *
 * @param provider check if this provider provides a VersionService
 *
 * NOTE: Using Provider<'app-version'> is a hack to indicate that the provider
 * provides VersionService. The provider is not necessarily a 'app-version'
 * provider.
 */
function isVersionServiceProvider(provider) {
    const component = provider.getComponent();
    return (component === null || component === void 0 ? void 0 : component.type) === "VERSION" /* VERSION */;
}

const name$o = "@firebase/app";
const version$1 = "0.7.13";

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const logger = new fireLogger('@firebase/app');

const name$n = "@firebase/app-compat";

const name$m = "@firebase/analytics-compat";

const name$l = "@firebase/analytics";

const name$k = "@firebase/app-check-compat";

const name$j = "@firebase/app-check";

const name$i = "@firebase/auth";

const name$h = "@firebase/auth-compat";

const name$g = "@firebase/database";

const name$f = "@firebase/database-compat";

const name$e = "@firebase/functions";

const name$d = "@firebase/functions-compat";

const name$c = "@firebase/installations";

const name$b = "@firebase/installations-compat";

const name$a = "@firebase/messaging";

const name$9 = "@firebase/messaging-compat";

const name$8 = "@firebase/performance";

const name$7 = "@firebase/performance-compat";

const name$6 = "@firebase/remote-config";

const name$5 = "@firebase/remote-config-compat";

const name$4 = "@firebase/storage";

const name$3 = "@firebase/storage-compat";

const name$2 = "@firebase/firestore";

const name$1 = "@firebase/firestore-compat";

const name$p = "firebase";
const version$2 = "9.6.3";

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The default app name
 *
 * @internal
 */
const DEFAULT_ENTRY_NAME = '[DEFAULT]';
const PLATFORM_LOG_STRING = {
    [name$o]: 'fire-core',
    [name$n]: 'fire-core-compat',
    [name$l]: 'fire-analytics',
    [name$m]: 'fire-analytics-compat',
    [name$j]: 'fire-app-check',
    [name$k]: 'fire-app-check-compat',
    [name$i]: 'fire-auth',
    [name$h]: 'fire-auth-compat',
    [name$g]: 'fire-rtdb',
    [name$f]: 'fire-rtdb-compat',
    [name$e]: 'fire-fn',
    [name$d]: 'fire-fn-compat',
    [name$c]: 'fire-iid',
    [name$b]: 'fire-iid-compat',
    [name$a]: 'fire-fcm',
    [name$9]: 'fire-fcm-compat',
    [name$8]: 'fire-perf',
    [name$7]: 'fire-perf-compat',
    [name$6]: 'fire-rc',
    [name$5]: 'fire-rc-compat',
    [name$4]: 'fire-gcs',
    [name$3]: 'fire-gcs-compat',
    [name$2]: 'fire-fst',
    [name$1]: 'fire-fst-compat',
    'fire-js': 'fire-js',
    [name$p]: 'fire-js-all'
};

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @internal
 */
const _apps = new Map();
/**
 * Registered components.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _components = new Map();
/**
 * @param component - the component being added to this app's container
 *
 * @internal
 */
function _addComponent(app, component) {
    try {
        app.container.addComponent(component);
    }
    catch (e) {
        logger.debug(`Component ${component.name} failed to register with FirebaseApp ${app.name}`, e);
    }
}
/**
 *
 * @param component - the component to register
 * @returns whether or not the component is registered successfully
 *
 * @internal
 */
function _registerComponent(component) {
    const componentName = component.name;
    if (_components.has(componentName)) {
        logger.debug(`There were multiple attempts to register component ${componentName}.`);
        return false;
    }
    _components.set(componentName, component);
    // add the component to existing app instances
    for (const app of _apps.values()) {
        _addComponent(app, component);
    }
    return true;
}
/**
 *
 * @param app - FirebaseApp instance
 * @param name - service name
 *
 * @returns the provider for the service with the matching name
 *
 * @internal
 */
function _getProvider(app, name) {
    return app.container.getProvider(name);
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ERRORS = {
    ["no-app" /* NO_APP */]: "No Firebase App '{$appName}' has been created - " +
        'call Firebase App.initializeApp()',
    ["bad-app-name" /* BAD_APP_NAME */]: "Illegal App name: '{$appName}",
    ["duplicate-app" /* DUPLICATE_APP */]: "Firebase App named '{$appName}' already exists with different options or config",
    ["app-deleted" /* APP_DELETED */]: "Firebase App named '{$appName}' already deleted",
    ["invalid-app-argument" /* INVALID_APP_ARGUMENT */]: 'firebase.{$appName}() takes either no argument or a ' +
        'Firebase App instance.',
    ["invalid-log-argument" /* INVALID_LOG_ARGUMENT */]: 'First argument to `onLog` must be null or a function.'
};
const ERROR_FACTORY = new ErrorFactory('app', 'Firebase', ERRORS);

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class FirebaseAppImpl {
    constructor(options, config, container) {
        this._isDeleted = false;
        this._options = Object.assign({}, options);
        this._config = Object.assign({}, config);
        this._name = config.name;
        this._automaticDataCollectionEnabled =
            config.automaticDataCollectionEnabled;
        this._container = container;
        this.container.addComponent(new Component('app', () => this, "PUBLIC" /* PUBLIC */));
    }
    get automaticDataCollectionEnabled() {
        this.checkDestroyed();
        return this._automaticDataCollectionEnabled;
    }
    set automaticDataCollectionEnabled(val) {
        this.checkDestroyed();
        this._automaticDataCollectionEnabled = val;
    }
    get name() {
        this.checkDestroyed();
        return this._name;
    }
    get options() {
        this.checkDestroyed();
        return this._options;
    }
    get config() {
        this.checkDestroyed();
        return this._config;
    }
    get container() {
        return this._container;
    }
    get isDeleted() {
        return this._isDeleted;
    }
    set isDeleted(val) {
        this._isDeleted = val;
    }
    /**
     * This function will throw an Error if the App has already been deleted -
     * use before performing API actions on the App.
     */
    checkDestroyed() {
        if (this.isDeleted) {
            throw ERROR_FACTORY.create("app-deleted" /* APP_DELETED */, { appName: this._name });
        }
    }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The current SDK version.
 *
 * @public
 */
const SDK_VERSION = version$2;
function initializeApp(options, rawConfig = {}) {
    if (typeof rawConfig !== 'object') {
        const name = rawConfig;
        rawConfig = { name };
    }
    const config = Object.assign({ name: DEFAULT_ENTRY_NAME, automaticDataCollectionEnabled: false }, rawConfig);
    const name = config.name;
    if (typeof name !== 'string' || !name) {
        throw ERROR_FACTORY.create("bad-app-name" /* BAD_APP_NAME */, {
            appName: String(name)
        });
    }
    const existingApp = _apps.get(name);
    if (existingApp) {
        // return the existing app if options and config deep equal the ones in the existing app.
        if (deepEqual(options, existingApp.options) &&
            deepEqual(config, existingApp.config)) {
            return existingApp;
        }
        else {
            throw ERROR_FACTORY.create("duplicate-app" /* DUPLICATE_APP */, { appName: name });
        }
    }
    const container = new ComponentContainer(name);
    for (const component of _components.values()) {
        container.addComponent(component);
    }
    const newApp = new FirebaseAppImpl(options, config, container);
    _apps.set(name, newApp);
    return newApp;
}
/**
 * Retrieves a {@link @firebase/app#FirebaseApp} instance.
 *
 * When called with no arguments, the default app is returned. When an app name
 * is provided, the app corresponding to that name is returned.
 *
 * An exception is thrown if the app being retrieved has not yet been
 * initialized.
 *
 * @example
 * ```javascript
 * // Return the default app
 * const app = getApp();
 * ```
 *
 * @example
 * ```javascript
 * // Return a named app
 * const otherApp = getApp("otherApp");
 * ```
 *
 * @param name - Optional name of the app to return. If no name is
 *   provided, the default is `"[DEFAULT]"`.
 *
 * @returns The app corresponding to the provided app name.
 *   If no app name is provided, the default app is returned.
 *
 * @public
 */
function getApp(name = DEFAULT_ENTRY_NAME) {
    const app = _apps.get(name);
    if (!app) {
        throw ERROR_FACTORY.create("no-app" /* NO_APP */, { appName: name });
    }
    return app;
}
/**
 * Registers a library's name and version for platform logging purposes.
 * @param library - Name of 1p or 3p library (e.g. firestore, angularfire)
 * @param version - Current version of that library.
 * @param variant - Bundle variant, e.g., node, rn, etc.
 *
 * @public
 */
function registerVersion(libraryKeyOrName, version, variant) {
    var _a;
    // TODO: We can use this check to whitelist strings when/if we set up
    // a good whitelist system.
    let library = (_a = PLATFORM_LOG_STRING[libraryKeyOrName]) !== null && _a !== void 0 ? _a : libraryKeyOrName;
    if (variant) {
        library += `-${variant}`;
    }
    const libraryMismatch = library.match(/\s|\//);
    const versionMismatch = version.match(/\s|\//);
    if (libraryMismatch || versionMismatch) {
        const warning = [
            `Unable to register library "${library}" with version "${version}":`
        ];
        if (libraryMismatch) {
            warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
        }
        if (libraryMismatch && versionMismatch) {
            warning.push('and');
        }
        if (versionMismatch) {
            warning.push(`version name "${version}" contains illegal characters (whitespace or "/")`);
        }
        logger.warn(warning.join(' '));
        return;
    }
    _registerComponent(new Component(`${library}-version`, () => ({ library, version }), "VERSION" /* VERSION */));
}
/**
 * Sets log level for all Firebase SDKs.
 *
 * All of the log types above the current log level are captured (i.e. if
 * you set the log level to `info`, errors are logged, but `debug` and
 * `verbose` logs are not).
 *
 * @public
 */
function setLogLevel(logLevel) {
    setLogLevel$1(logLevel);
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function registerCoreComponents(variant) {
    _registerComponent(new Component('platform-logger', container => new PlatformLoggerServiceImpl(container), "PRIVATE" /* PRIVATE */));
    // Register `app` package.
    registerVersion(name$o, version$1, variant);
    // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
    registerVersion(name$o, version$1, 'esm2017');
    // Register platform SDK identifier (no version).
    registerVersion('fire-js', '');
}

/**
 * Firebase App
 *
 * @remarks This package coordinates the communication between the different Firebase components
 * @packageDocumentation
 */
registerCoreComponents('');

var name = "firebase";
var version = "9.6.3";

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
registerVersion(name, version, 'app');

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

/*

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/
var k$1,goog=goog||{},l=commonjsGlobal||self;function aa(){}function ba(a){var b=typeof a;b="object"!=b?b:a?Array.isArray(a)?"array":b:"null";return "array"==b||"object"==b&&"number"==typeof a.length}function p(a){var b=typeof a;return "object"==b&&null!=a||"function"==b}function da$1(a){return Object.prototype.hasOwnProperty.call(a,ea)&&a[ea]||(a[ea]=++fa)}var ea="closure_uid_"+(1E9*Math.random()>>>0),fa=0;function ha(a,b,c){return a.call.apply(a.bind,arguments)}
function ia(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var e=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(e,d);return a.apply(b,e)}}return function(){return a.apply(b,arguments)}}function q(a,b,c){Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?q=ha:q=ia;return q.apply(null,arguments)}
function ja(a,b){var c=Array.prototype.slice.call(arguments,1);return function(){var d=c.slice();d.push.apply(d,arguments);return a.apply(this,d)}}function t(a,b){function c(){}c.prototype=b.prototype;a.Z=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.Vb=function(d,e,f){for(var h=Array(arguments.length-2),n=2;n<arguments.length;n++)h[n-2]=arguments[n];return b.prototype[e].apply(d,h)};}function v(){this.s=this.s;this.o=this.o;}var ka=0,la={};v.prototype.s=!1;v.prototype.na=function(){if(!this.s&&(this.s=!0,this.M(),0!=ka)){var a=da$1(this);delete la[a];}};v.prototype.M=function(){if(this.o)for(;this.o.length;)this.o.shift()();};const ma$1=Array.prototype.indexOf?function(a,b){return Array.prototype.indexOf.call(a,b,void 0)}:function(a,b){if("string"===typeof a)return "string"!==typeof b||1!=b.length?-1:a.indexOf(b,0);for(let c=0;c<a.length;c++)if(c in a&&a[c]===b)return c;return -1},na$1=Array.prototype.forEach?function(a,b,c){Array.prototype.forEach.call(a,b,c);}:function(a,b,c){const d=a.length,e="string"===typeof a?a.split(""):a;for(let f=0;f<d;f++)f in e&&b.call(c,e[f],f,a);};
function oa$1(a){a:{var b=pa;const c=a.length,d="string"===typeof a?a.split(""):a;for(let e=0;e<c;e++)if(e in d&&b.call(void 0,d[e],e,a)){b=e;break a}b=-1;}return 0>b?null:"string"===typeof a?a.charAt(b):a[b]}function qa$1(a){return Array.prototype.concat.apply([],arguments)}function ra$1(a){const b=a.length;if(0<b){const c=Array(b);for(let d=0;d<b;d++)c[d]=a[d];return c}return []}function sa(a){return /^[\s\xa0]*$/.test(a)}var ta=String.prototype.trim?function(a){return a.trim()}:function(a){return /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(a)[1]};function w(a,b){return -1!=a.indexOf(b)}function ua(a,b){return a<b?-1:a>b?1:0}var x$1;a:{var va$1=l.navigator;if(va$1){var wa$1=va$1.userAgent;if(wa$1){x$1=wa$1;break a}}x$1="";}function xa$1(a,b,c){for(const d in a)b.call(c,a[d],d,a);}function ya$1(a){const b={};for(const c in a)b[c]=a[c];return b}var za="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Aa$1(a,b){let c,d;for(let e=1;e<arguments.length;e++){d=arguments[e];for(c in d)a[c]=d[c];for(let f=0;f<za.length;f++)c=za[f],Object.prototype.hasOwnProperty.call(d,c)&&(a[c]=d[c]);}}function Ca$1(a){Ca$1[" "](a);return a}Ca$1[" "]=aa;function Fa$1(a){var b=Ga;return Object.prototype.hasOwnProperty.call(b,9)?b[9]:b[9]=a(9)}var Ha=w(x$1,"Opera"),y=w(x$1,"Trident")||w(x$1,"MSIE"),Ia=w(x$1,"Edge"),Ja=Ia||y,Ka=w(x$1,"Gecko")&&!(w(x$1.toLowerCase(),"webkit")&&!w(x$1,"Edge"))&&!(w(x$1,"Trident")||w(x$1,"MSIE"))&&!w(x$1,"Edge"),La=w(x$1.toLowerCase(),"webkit")&&!w(x$1,"Edge");function Ma(){var a=l.document;return a?a.documentMode:void 0}var Na;
a:{var Oa="",Pa$1=function(){var a=x$1;if(Ka)return /rv:([^\);]+)(\)|;)/.exec(a);if(Ia)return /Edge\/([\d\.]+)/.exec(a);if(y)return /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);if(La)return /WebKit\/(\S+)/.exec(a);if(Ha)return /(?:Version)[ \/]?(\S+)/.exec(a)}();Pa$1&&(Oa=Pa$1?Pa$1[1]:"");if(y){var Qa=Ma();if(null!=Qa&&Qa>parseFloat(Oa)){Na=String(Qa);break a}}Na=Oa;}var Ga={};
function Ra$1(){return Fa$1(function(){let a=0;const b=ta(String(Na)).split("."),c=ta("9").split("."),d=Math.max(b.length,c.length);for(let h=0;0==a&&h<d;h++){var e=b[h]||"",f=c[h]||"";do{e=/(\d*)(\D*)(.*)/.exec(e)||["","","",""];f=/(\d*)(\D*)(.*)/.exec(f)||["","","",""];if(0==e[0].length&&0==f[0].length)break;a=ua(0==e[1].length?0:parseInt(e[1],10),0==f[1].length?0:parseInt(f[1],10))||ua(0==e[2].length,0==f[2].length)||ua(e[2],f[2]);e=e[3];f=f[3];}while(0==a)}return 0<=a})}var Sa;
if(l.document&&y){var Ta$1=Ma();Sa=Ta$1?Ta$1:parseInt(Na,10)||void 0;}else Sa=void 0;var Ua$1=Sa;var Va$1=function(){if(!l.addEventListener||!Object.defineProperty)return !1;var a=!1,b=Object.defineProperty({},"passive",{get:function(){a=!0;}});try{l.addEventListener("test",aa,b),l.removeEventListener("test",aa,b);}catch(c){}return a}();function z$1(a,b){this.type=a;this.g=this.target=b;this.defaultPrevented=!1;}z$1.prototype.h=function(){this.defaultPrevented=!0;};function A(a,b){z$1.call(this,a?a.type:"");this.relatedTarget=this.g=this.target=null;this.button=this.screenY=this.screenX=this.clientY=this.clientX=0;this.key="";this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1;this.state=null;this.pointerId=0;this.pointerType="";this.i=null;if(a){var c=this.type=a.type,d=a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:null;this.target=a.target||a.srcElement;this.g=b;if(b=a.relatedTarget){if(Ka){a:{try{Ca$1(b.nodeName);var e=!0;break a}catch(f){}e=
!1;}e||(b=null);}}else "mouseover"==c?b=a.fromElement:"mouseout"==c&&(b=a.toElement);this.relatedTarget=b;d?(this.clientX=void 0!==d.clientX?d.clientX:d.pageX,this.clientY=void 0!==d.clientY?d.clientY:d.pageY,this.screenX=d.screenX||0,this.screenY=d.screenY||0):(this.clientX=void 0!==a.clientX?a.clientX:a.pageX,this.clientY=void 0!==a.clientY?a.clientY:a.pageY,this.screenX=a.screenX||0,this.screenY=a.screenY||0);this.button=a.button;this.key=a.key||"";this.ctrlKey=a.ctrlKey;this.altKey=a.altKey;this.shiftKey=
a.shiftKey;this.metaKey=a.metaKey;this.pointerId=a.pointerId||0;this.pointerType="string"===typeof a.pointerType?a.pointerType:Wa[a.pointerType]||"";this.state=a.state;this.i=a;a.defaultPrevented&&A.Z.h.call(this);}}t(A,z$1);var Wa={2:"touch",3:"pen",4:"mouse"};A.prototype.h=function(){A.Z.h.call(this);var a=this.i;a.preventDefault?a.preventDefault():a.returnValue=!1;};var B$1="closure_listenable_"+(1E6*Math.random()|0);var Xa=0;function Ya(a,b,c,d,e){this.listener=a;this.proxy=null;this.src=b;this.type=c;this.capture=!!d;this.ia=e;this.key=++Xa;this.ca=this.fa=!1;}function Za(a){a.ca=!0;a.listener=null;a.proxy=null;a.src=null;a.ia=null;}function $a(a){this.src=a;this.g={};this.h=0;}$a.prototype.add=function(a,b,c,d,e){var f=a.toString();a=this.g[f];a||(a=this.g[f]=[],this.h++);var h=ab(a,b,d,e);-1<h?(b=a[h],c||(b.fa=!1)):(b=new Ya(b,this.src,f,!!d,e),b.fa=c,a.push(b));return b};function bb(a,b){var c=b.type;if(c in a.g){var d=a.g[c],e=ma$1(d,b),f;(f=0<=e)&&Array.prototype.splice.call(d,e,1);f&&(Za(b),0==a.g[c].length&&(delete a.g[c],a.h--));}}
function ab(a,b,c,d){for(var e=0;e<a.length;++e){var f=a[e];if(!f.ca&&f.listener==b&&f.capture==!!c&&f.ia==d)return e}return -1}var cb="closure_lm_"+(1E6*Math.random()|0),db$1={};function fb(a,b,c,d,e){if(d&&d.once)return gb(a,b,c,d,e);if(Array.isArray(b)){for(var f=0;f<b.length;f++)fb(a,b[f],c,d,e);return null}c=hb(c);return a&&a[B$1]?a.N(b,c,p(d)?!!d.capture:!!d,e):ib(a,b,c,!1,d,e)}
function ib(a,b,c,d,e,f){if(!b)throw Error("Invalid event type");var h=p(e)?!!e.capture:!!e,n=jb(a);n||(a[cb]=n=new $a(a));c=n.add(b,c,d,h,f);if(c.proxy)return c;d=kb();c.proxy=d;d.src=a;d.listener=c;if(a.addEventListener)Va$1||(e=h),void 0===e&&(e=!1),a.addEventListener(b.toString(),d,e);else if(a.attachEvent)a.attachEvent(lb(b.toString()),d);else if(a.addListener&&a.removeListener)a.addListener(d);else throw Error("addEventListener and attachEvent are unavailable.");return c}
function kb(){function a(c){return b.call(a.src,a.listener,c)}var b=mb;return a}function gb(a,b,c,d,e){if(Array.isArray(b)){for(var f=0;f<b.length;f++)gb(a,b[f],c,d,e);return null}c=hb(c);return a&&a[B$1]?a.O(b,c,p(d)?!!d.capture:!!d,e):ib(a,b,c,!0,d,e)}
function nb(a,b,c,d,e){if(Array.isArray(b))for(var f=0;f<b.length;f++)nb(a,b[f],c,d,e);else (d=p(d)?!!d.capture:!!d,c=hb(c),a&&a[B$1])?(a=a.i,b=String(b).toString(),b in a.g&&(f=a.g[b],c=ab(f,c,d,e),-1<c&&(Za(f[c]),Array.prototype.splice.call(f,c,1),0==f.length&&(delete a.g[b],a.h--)))):a&&(a=jb(a))&&(b=a.g[b.toString()],a=-1,b&&(a=ab(b,c,d,e)),(c=-1<a?b[a]:null)&&ob(c));}
function ob(a){if("number"!==typeof a&&a&&!a.ca){var b=a.src;if(b&&b[B$1])bb(b.i,a);else {var c=a.type,d=a.proxy;b.removeEventListener?b.removeEventListener(c,d,a.capture):b.detachEvent?b.detachEvent(lb(c),d):b.addListener&&b.removeListener&&b.removeListener(d);(c=jb(b))?(bb(c,a),0==c.h&&(c.src=null,b[cb]=null)):Za(a);}}}function lb(a){return a in db$1?db$1[a]:db$1[a]="on"+a}function mb(a,b){if(a.ca)a=!0;else {b=new A(b,this);var c=a.listener,d=a.ia||a.src;a.fa&&ob(a);a=c.call(d,b);}return a}
function jb(a){a=a[cb];return a instanceof $a?a:null}var pb="__closure_events_fn_"+(1E9*Math.random()>>>0);function hb(a){if("function"===typeof a)return a;a[pb]||(a[pb]=function(b){return a.handleEvent(b)});return a[pb]}function C$1(){v.call(this);this.i=new $a(this);this.P=this;this.I=null;}t(C$1,v);C$1.prototype[B$1]=!0;C$1.prototype.removeEventListener=function(a,b,c,d){nb(this,a,b,c,d);};
function D$1(a,b){var c,d=a.I;if(d)for(c=[];d;d=d.I)c.push(d);a=a.P;d=b.type||b;if("string"===typeof b)b=new z$1(b,a);else if(b instanceof z$1)b.target=b.target||a;else {var e=b;b=new z$1(d,a);Aa$1(b,e);}e=!0;if(c)for(var f=c.length-1;0<=f;f--){var h=b.g=c[f];e=qb(h,d,!0,b)&&e;}h=b.g=a;e=qb(h,d,!0,b)&&e;e=qb(h,d,!1,b)&&e;if(c)for(f=0;f<c.length;f++)h=b.g=c[f],e=qb(h,d,!1,b)&&e;}
C$1.prototype.M=function(){C$1.Z.M.call(this);if(this.i){var a=this.i,c;for(c in a.g){for(var d=a.g[c],e=0;e<d.length;e++)Za(d[e]);delete a.g[c];a.h--;}}this.I=null;};C$1.prototype.N=function(a,b,c,d){return this.i.add(String(a),b,!1,c,d)};C$1.prototype.O=function(a,b,c,d){return this.i.add(String(a),b,!0,c,d)};
function qb(a,b,c,d){b=a.i.g[String(b)];if(!b)return !0;b=b.concat();for(var e=!0,f=0;f<b.length;++f){var h=b[f];if(h&&!h.ca&&h.capture==c){var n=h.listener,u=h.ia||h.src;h.fa&&bb(a.i,h);e=!1!==n.call(u,d)&&e;}}return e&&!d.defaultPrevented}var rb=l.JSON.stringify;function sb(){var a=tb;let b=null;a.g&&(b=a.g,a.g=a.g.next,a.g||(a.h=null),b.next=null);return b}class ub{constructor(){this.h=this.g=null;}add(a,b){const c=vb.get();c.set(a,b);this.h?this.h.next=c:this.g=c;this.h=c;}}var vb=new class{constructor(a,b){this.i=a;this.j=b;this.h=0;this.g=null;}get(){let a;0<this.h?(this.h--,a=this.g,this.g=a.next,a.next=null):a=this.i();return a}}(()=>new wb,a=>a.reset());
class wb{constructor(){this.next=this.g=this.h=null;}set(a,b){this.h=a;this.g=b;this.next=null;}reset(){this.next=this.g=this.h=null;}}function yb(a){l.setTimeout(()=>{throw a;},0);}function zb(a,b){Ab||Bb();Cb||(Ab(),Cb=!0);tb.add(a,b);}var Ab;function Bb(){var a=l.Promise.resolve(void 0);Ab=function(){a.then(Db);};}var Cb=!1,tb=new ub;function Db(){for(var a;a=sb();){try{a.h.call(a.g);}catch(c){yb(c);}var b=vb;b.j(a);100>b.h&&(b.h++,a.next=b.g,b.g=a);}Cb=!1;}function Eb(a,b){C$1.call(this);this.h=a||1;this.g=b||l;this.j=q(this.kb,this);this.l=Date.now();}t(Eb,C$1);k$1=Eb.prototype;k$1.da=!1;k$1.S=null;k$1.kb=function(){if(this.da){var a=Date.now()-this.l;0<a&&a<.8*this.h?this.S=this.g.setTimeout(this.j,this.h-a):(this.S&&(this.g.clearTimeout(this.S),this.S=null),D$1(this,"tick"),this.da&&(Fb(this),this.start()));}};k$1.start=function(){this.da=!0;this.S||(this.S=this.g.setTimeout(this.j,this.h),this.l=Date.now());};
function Fb(a){a.da=!1;a.S&&(a.g.clearTimeout(a.S),a.S=null);}k$1.M=function(){Eb.Z.M.call(this);Fb(this);delete this.g;};function Gb(a,b,c){if("function"===typeof a)c&&(a=q(a,c));else if(a&&"function"==typeof a.handleEvent)a=q(a.handleEvent,a);else throw Error("Invalid listener argument");return 2147483647<Number(b)?-1:l.setTimeout(a,b||0)}function Hb(a){a.g=Gb(()=>{a.g=null;a.i&&(a.i=!1,Hb(a));},a.j);const b=a.h;a.h=null;a.m.apply(null,b);}class Ib extends v{constructor(a,b){super();this.m=a;this.j=b;this.h=null;this.i=!1;this.g=null;}l(a){this.h=arguments;this.g?this.i=!0:Hb(this);}M(){super.M();this.g&&(l.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null);}}function E(a){v.call(this);this.h=a;this.g={};}t(E,v);var Jb=[];function Kb(a,b,c,d){Array.isArray(c)||(c&&(Jb[0]=c.toString()),c=Jb);for(var e=0;e<c.length;e++){var f=fb(b,c[e],d||a.handleEvent,!1,a.h||a);if(!f)break;a.g[f.key]=f;}}function Lb(a){xa$1(a.g,function(b,c){this.g.hasOwnProperty(c)&&ob(b);},a);a.g={};}E.prototype.M=function(){E.Z.M.call(this);Lb(this);};E.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented");};function Mb(){this.g=!0;}Mb.prototype.Aa=function(){this.g=!1;};function Nb(a,b,c,d,e,f){a.info(function(){if(a.g)if(f){var h="";for(var n=f.split("&"),u=0;u<n.length;u++){var m=n[u].split("=");if(1<m.length){var r=m[0];m=m[1];var G=r.split("_");h=2<=G.length&&"type"==G[1]?h+(r+"="+m+"&"):h+(r+"=redacted&");}}}else h=null;else h=f;return "XMLHTTP REQ ("+d+") [attempt "+e+"]: "+b+"\n"+c+"\n"+h});}
function Ob(a,b,c,d,e,f,h){a.info(function(){return "XMLHTTP RESP ("+d+") [ attempt "+e+"]: "+b+"\n"+c+"\n"+f+" "+h});}function F$1(a,b,c,d){a.info(function(){return "XMLHTTP TEXT ("+b+"): "+Pb(a,c)+(d?" "+d:"")});}function Qb(a,b){a.info(function(){return "TIMEOUT: "+b});}Mb.prototype.info=function(){};
function Pb(a,b){if(!a.g)return b;if(!b)return null;try{var c=JSON.parse(b);if(c)for(a=0;a<c.length;a++)if(Array.isArray(c[a])){var d=c[a];if(!(2>d.length)){var e=d[1];if(Array.isArray(e)&&!(1>e.length)){var f=e[0];if("noop"!=f&&"stop"!=f&&"close"!=f)for(var h=1;h<e.length;h++)e[h]="";}}}return rb(c)}catch(n){return b}}var H={},Rb=null;function Sb(){return Rb=Rb||new C$1}H.Ma="serverreachability";function Tb(a){z$1.call(this,H.Ma,a);}t(Tb,z$1);function I(a){const b=Sb();D$1(b,new Tb(b,a));}H.STAT_EVENT="statevent";function Ub(a,b){z$1.call(this,H.STAT_EVENT,a);this.stat=b;}t(Ub,z$1);function J$1(a){const b=Sb();D$1(b,new Ub(b,a));}H.Na="timingevent";function Vb(a,b){z$1.call(this,H.Na,a);this.size=b;}t(Vb,z$1);
function K$1(a,b){if("function"!==typeof a)throw Error("Fn must not be null and must be a function");return l.setTimeout(function(){a();},b)}var Wb={NO_ERROR:0,lb:1,yb:2,xb:3,sb:4,wb:5,zb:6,Ja:7,TIMEOUT:8,Cb:9};var Xb={qb:"complete",Mb:"success",Ka:"error",Ja:"abort",Eb:"ready",Fb:"readystatechange",TIMEOUT:"timeout",Ab:"incrementaldata",Db:"progress",tb:"downloadprogress",Ub:"uploadprogress"};function Yb(){}Yb.prototype.h=null;function Zb(a){return a.h||(a.h=a.i())}function $b(){}var L$1={OPEN:"a",pb:"b",Ka:"c",Bb:"d"};function ac$1(){z$1.call(this,"d");}t(ac$1,z$1);function bc$1(){z$1.call(this,"c");}t(bc$1,z$1);var cc$1;function dc(){}t(dc,Yb);dc.prototype.g=function(){return new XMLHttpRequest};dc.prototype.i=function(){return {}};cc$1=new dc;function M$1(a,b,c,d){this.l=a;this.j=b;this.m=c;this.X=d||1;this.V=new E(this);this.P=ec$1;a=Ja?125:void 0;this.W=new Eb(a);this.H=null;this.i=!1;this.s=this.A=this.v=this.K=this.F=this.Y=this.B=null;this.D=[];this.g=null;this.C=0;this.o=this.u=null;this.N=-1;this.I=!1;this.O=0;this.L=null;this.aa=this.J=this.$=this.U=!1;this.h=new fc$1;}function fc$1(){this.i=null;this.g="";this.h=!1;}var ec$1=45E3,gc={},hc$1={};k$1=M$1.prototype;k$1.setTimeout=function(a){this.P=a;};
function ic$1(a,b,c){a.K=1;a.v=jc(N$1(b));a.s=c;a.U=!0;kc(a,null);}function kc(a,b){a.F=Date.now();lc$1(a);a.A=N$1(a.v);var c=a.A,d=a.X;Array.isArray(d)||(d=[String(d)]);mc(c.h,"t",d);a.C=0;c=a.l.H;a.h=new fc$1;a.g=nc$1(a.l,c?b:null,!a.s);0<a.O&&(a.L=new Ib(q(a.Ia,a,a.g),a.O));Kb(a.V,a.g,"readystatechange",a.gb);b=a.H?ya$1(a.H):{};a.s?(a.u||(a.u="POST"),b["Content-Type"]="application/x-www-form-urlencoded",a.g.ea(a.A,a.u,a.s,b)):(a.u="GET",a.g.ea(a.A,a.u,null,b));I(1);Nb(a.j,a.u,a.A,a.m,a.X,a.s);}
k$1.gb=function(a){a=a.target;const b=this.L;b&&3==O$1(a)?b.l():this.Ia(a);};
k$1.Ia=function(a){try{if(a==this.g)a:{const r=O$1(this.g);var b=this.g.Da();const G=this.g.ba();if(!(3>r)&&(3!=r||Ja||this.g&&(this.h.h||this.g.ga()||oc$1(this.g)))){this.I||4!=r||7==b||(8==b||0>=G?I(3):I(2));pc$1(this);var c=this.g.ba();this.N=c;b:if(qc(this)){var d=oc$1(this.g);a="";var e=d.length,f=4==O$1(this.g);if(!this.h.i){if("undefined"===typeof TextDecoder){P(this);rc$1(this);var h="";break b}this.h.i=new l.TextDecoder;}for(b=0;b<e;b++)this.h.h=!0,a+=this.h.i.decode(d[b],{stream:f&&b==e-1});d.splice(0,
e);this.h.g+=a;this.C=0;h=this.h.g;}else h=this.g.ga();this.i=200==c;Ob(this.j,this.u,this.A,this.m,this.X,r,c);if(this.i){if(this.$&&!this.J){b:{if(this.g){var n,u=this.g;if((n=u.g?u.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!sa(n)){var m=n;break b}}m=null;}if(c=m)F$1(this.j,this.m,c,"Initial handshake response via X-HTTP-Initial-Response"),this.J=!0,sc$1(this,c);else {this.i=!1;this.o=3;J$1(12);P(this);rc$1(this);break a}}this.U?(tc$1(this,r,h),Ja&&this.i&&3==r&&(Kb(this.V,this.W,"tick",this.fb),
this.W.start())):(F$1(this.j,this.m,h,null),sc$1(this,h));4==r&&P(this);this.i&&!this.I&&(4==r?uc(this.l,this):(this.i=!1,lc$1(this)));}else 400==c&&0<h.indexOf("Unknown SID")?(this.o=3,J$1(12)):(this.o=0,J$1(13)),P(this),rc$1(this);}}}catch(r){}finally{}};function qc(a){return a.g?"GET"==a.u&&2!=a.K&&a.l.Ba:!1}
function tc$1(a,b,c){let d=!0,e;for(;!a.I&&a.C<c.length;)if(e=vc(a,c),e==hc$1){4==b&&(a.o=4,J$1(14),d=!1);F$1(a.j,a.m,null,"[Incomplete Response]");break}else if(e==gc){a.o=4;J$1(15);F$1(a.j,a.m,c,"[Invalid Chunk]");d=!1;break}else F$1(a.j,a.m,e,null),sc$1(a,e);qc(a)&&e!=hc$1&&e!=gc&&(a.h.g="",a.C=0);4!=b||0!=c.length||a.h.h||(a.o=1,J$1(16),d=!1);a.i=a.i&&d;d?0<c.length&&!a.aa&&(a.aa=!0,b=a.l,b.g==a&&b.$&&!b.L&&(b.h.info("Great, no buffering proxy detected. Bytes received: "+c.length),wc(b),b.L=!0,J$1(11))):(F$1(a.j,a.m,
c,"[Invalid Chunked Response]"),P(a),rc$1(a));}k$1.fb=function(){if(this.g){var a=O$1(this.g),b=this.g.ga();this.C<b.length&&(pc$1(this),tc$1(this,a,b),this.i&&4!=a&&lc$1(this));}};function vc(a,b){var c=a.C,d=b.indexOf("\n",c);if(-1==d)return hc$1;c=Number(b.substring(c,d));if(isNaN(c))return gc;d+=1;if(d+c>b.length)return hc$1;b=b.substr(d,c);a.C=d+c;return b}k$1.cancel=function(){this.I=!0;P(this);};function lc$1(a){a.Y=Date.now()+a.P;xc(a,a.P);}
function xc(a,b){if(null!=a.B)throw Error("WatchDog timer not null");a.B=K$1(q(a.eb,a),b);}function pc$1(a){a.B&&(l.clearTimeout(a.B),a.B=null);}k$1.eb=function(){this.B=null;const a=Date.now();0<=a-this.Y?(Qb(this.j,this.A),2!=this.K&&(I(3),J$1(17)),P(this),this.o=2,rc$1(this)):xc(this,this.Y-a);};function rc$1(a){0==a.l.G||a.I||uc(a.l,a);}function P(a){pc$1(a);var b=a.L;b&&"function"==typeof b.na&&b.na();a.L=null;Fb(a.W);Lb(a.V);a.g&&(b=a.g,a.g=null,b.abort(),b.na());}
function sc$1(a,b){try{var c=a.l;if(0!=c.G&&(c.g==a||yc$1(c.i,a)))if(c.I=a.N,!a.J&&yc$1(c.i,a)&&3==c.G){try{var d=c.Ca.g.parse(b);}catch(m){d=null;}if(Array.isArray(d)&&3==d.length){var e=d;if(0==e[0])a:{if(!c.u){if(c.g)if(c.g.F+3E3<a.F)zc$1(c),Ac$1(c);else break a;Bc(c);J$1(18);}}else c.ta=e[1],0<c.ta-c.U&&37500>e[2]&&c.N&&0==c.A&&!c.v&&(c.v=K$1(q(c.ab,c),6E3));if(1>=Cc(c.i)&&c.ka){try{c.ka();}catch(m){}c.ka=void 0;}}else Q$1(c,11);}else if((a.J||c.g==a)&&zc$1(c),!sa(b))for(e=c.Ca.g.parse(b),b=0;b<e.length;b++){let m=e[b];
c.U=m[0];m=m[1];if(2==c.G)if("c"==m[0]){c.J=m[1];c.la=m[2];const r=m[3];null!=r&&(c.ma=r,c.h.info("VER="+c.ma));const G=m[4];null!=G&&(c.za=G,c.h.info("SVER="+c.za));const Da=m[5];null!=Da&&"number"===typeof Da&&0<Da&&(d=1.5*Da,c.K=d,c.h.info("backChannelRequestTimeoutMs_="+d));d=c;const ca=a.g;if(ca){const Ea=ca.g?ca.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Ea){var f=d.i;!f.g&&(w(Ea,"spdy")||w(Ea,"quic")||w(Ea,"h2"))&&(f.j=f.l,f.g=new Set,f.h&&(Dc(f,f.h),f.h=null));}if(d.D){const xb=
ca.g?ca.g.getResponseHeader("X-HTTP-Session-Id"):null;xb&&(d.sa=xb,R(d.F,d.D,xb));}}c.G=3;c.j&&c.j.xa();c.$&&(c.O=Date.now()-a.F,c.h.info("Handshake RTT: "+c.O+"ms"));d=c;var h=a;d.oa=Ec$1(d,d.H?d.la:null,d.W);if(h.J){Fc$1(d.i,h);var n=h,u=d.K;u&&n.setTimeout(u);n.B&&(pc$1(n),lc$1(n));d.g=h;}else Gc$1(d);0<c.l.length&&Hc$1(c);}else "stop"!=m[0]&&"close"!=m[0]||Q$1(c,7);else 3==c.G&&("stop"==m[0]||"close"==m[0]?"stop"==m[0]?Q$1(c,7):Ic$1(c):"noop"!=m[0]&&c.j&&c.j.wa(m),c.A=0);}I(4);}catch(m){}}function Jc$1(a){if(a.R&&"function"==typeof a.R)return a.R();if("string"===typeof a)return a.split("");if(ba(a)){for(var b=[],c=a.length,d=0;d<c;d++)b.push(a[d]);return b}b=[];c=0;for(d in a)b[c++]=a[d];return b}
function Kc$1(a,b){if(a.forEach&&"function"==typeof a.forEach)a.forEach(b,void 0);else if(ba(a)||"string"===typeof a)na$1(a,b,void 0);else {if(a.T&&"function"==typeof a.T)var c=a.T();else if(a.R&&"function"==typeof a.R)c=void 0;else if(ba(a)||"string"===typeof a){c=[];for(var d=a.length,e=0;e<d;e++)c.push(e);}else for(e in c=[],d=0,a)c[d++]=e;d=Jc$1(a);e=d.length;for(var f=0;f<e;f++)b.call(void 0,d[f],c&&c[f],a);}}function S(a,b){this.h={};this.g=[];this.i=0;var c=arguments.length;if(1<c){if(c%2)throw Error("Uneven number of arguments");for(var d=0;d<c;d+=2)this.set(arguments[d],arguments[d+1]);}else if(a)if(a instanceof S)for(c=a.T(),d=0;d<c.length;d++)this.set(c[d],a.get(c[d]));else for(d in a)this.set(d,a[d]);}k$1=S.prototype;k$1.R=function(){Lc(this);for(var a=[],b=0;b<this.g.length;b++)a.push(this.h[this.g[b]]);return a};k$1.T=function(){Lc(this);return this.g.concat()};
function Lc(a){if(a.i!=a.g.length){for(var b=0,c=0;b<a.g.length;){var d=a.g[b];T(a.h,d)&&(a.g[c++]=d);b++;}a.g.length=c;}if(a.i!=a.g.length){var e={};for(c=b=0;b<a.g.length;)d=a.g[b],T(e,d)||(a.g[c++]=d,e[d]=1),b++;a.g.length=c;}}k$1.get=function(a,b){return T(this.h,a)?this.h[a]:b};k$1.set=function(a,b){T(this.h,a)||(this.i++,this.g.push(a));this.h[a]=b;};k$1.forEach=function(a,b){for(var c=this.T(),d=0;d<c.length;d++){var e=c[d],f=this.get(e);a.call(b,f,e,this);}};
function T(a,b){return Object.prototype.hasOwnProperty.call(a,b)}var Mc=/^(?:([^:/?#.]+):)?(?:\/\/(?:([^\\/?#]*)@)?([^\\/?#]*?)(?::([0-9]+))?(?=[\\/?#]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/;function Nc(a,b){if(a){a=a.split("&");for(var c=0;c<a.length;c++){var d=a[c].indexOf("="),e=null;if(0<=d){var f=a[c].substring(0,d);e=a[c].substring(d+1);}else f=a[c];b(f,e?decodeURIComponent(e.replace(/\+/g," ")):"");}}}function U$1(a,b){this.i=this.s=this.j="";this.m=null;this.o=this.l="";this.g=!1;if(a instanceof U$1){this.g=void 0!==b?b:a.g;Oc(this,a.j);this.s=a.s;Pc(this,a.i);Qc(this,a.m);this.l=a.l;b=a.h;var c=new Rc$1;c.i=b.i;b.g&&(c.g=new S(b.g),c.h=b.h);Sc(this,c);this.o=a.o;}else a&&(c=String(a).match(Mc))?(this.g=!!b,Oc(this,c[1]||"",!0),this.s=Tc$1(c[2]||""),Pc(this,c[3]||"",!0),Qc(this,c[4]),this.l=Tc$1(c[5]||"",!0),Sc(this,c[6]||"",!0),this.o=Tc$1(c[7]||"")):(this.g=!!b,this.h=new Rc$1(null,this.g));}
U$1.prototype.toString=function(){var a=[],b=this.j;b&&a.push(Uc$1(b,Vc,!0),":");var c=this.i;if(c||"file"==b)a.push("//"),(b=this.s)&&a.push(Uc$1(b,Vc,!0),"@"),a.push(encodeURIComponent(String(c)).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),c=this.m,null!=c&&a.push(":",String(c));if(c=this.l)this.i&&"/"!=c.charAt(0)&&a.push("/"),a.push(Uc$1(c,"/"==c.charAt(0)?Wc:Xc,!0));(c=this.h.toString())&&a.push("?",c);(c=this.o)&&a.push("#",Uc$1(c,Yc$1));return a.join("")};function N$1(a){return new U$1(a)}
function Oc(a,b,c){a.j=c?Tc$1(b,!0):b;a.j&&(a.j=a.j.replace(/:$/,""));}function Pc(a,b,c){a.i=c?Tc$1(b,!0):b;}function Qc(a,b){if(b){b=Number(b);if(isNaN(b)||0>b)throw Error("Bad port number "+b);a.m=b;}else a.m=null;}function Sc(a,b,c){b instanceof Rc$1?(a.h=b,Zc$1(a.h,a.g)):(c||(b=Uc$1(b,$c$1)),a.h=new Rc$1(b,a.g));}function R(a,b,c){a.h.set(b,c);}function jc(a){R(a,"zx",Math.floor(2147483648*Math.random()).toString(36)+Math.abs(Math.floor(2147483648*Math.random())^Date.now()).toString(36));return a}
function ad(a){return a instanceof U$1?N$1(a):new U$1(a,void 0)}function bd(a,b,c,d){var e=new U$1(null,void 0);a&&Oc(e,a);b&&Pc(e,b);c&&Qc(e,c);d&&(e.l=d);return e}function Tc$1(a,b){return a?b?decodeURI(a.replace(/%25/g,"%2525")):decodeURIComponent(a):""}function Uc$1(a,b,c){return "string"===typeof a?(a=encodeURI(a).replace(b,cd),c&&(a=a.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),a):null}function cd(a){a=a.charCodeAt(0);return "%"+(a>>4&15).toString(16)+(a&15).toString(16)}
var Vc=/[#\/\?@]/g,Xc=/[#\?:]/g,Wc=/[#\?]/g,$c$1=/[#\?@]/g,Yc$1=/#/g;function Rc$1(a,b){this.h=this.g=null;this.i=a||null;this.j=!!b;}function V(a){a.g||(a.g=new S,a.h=0,a.i&&Nc(a.i,function(b,c){a.add(decodeURIComponent(b.replace(/\+/g," ")),c);}));}k$1=Rc$1.prototype;k$1.add=function(a,b){V(this);this.i=null;a=W$1(this,a);var c=this.g.get(a);c||this.g.set(a,c=[]);c.push(b);this.h+=1;return this};
function dd(a,b){V(a);b=W$1(a,b);T(a.g.h,b)&&(a.i=null,a.h-=a.g.get(b).length,a=a.g,T(a.h,b)&&(delete a.h[b],a.i--,a.g.length>2*a.i&&Lc(a)));}function ed(a,b){V(a);b=W$1(a,b);return T(a.g.h,b)}k$1.forEach=function(a,b){V(this);this.g.forEach(function(c,d){na$1(c,function(e){a.call(b,e,d,this);},this);},this);};k$1.T=function(){V(this);for(var a=this.g.R(),b=this.g.T(),c=[],d=0;d<b.length;d++)for(var e=a[d],f=0;f<e.length;f++)c.push(b[d]);return c};
k$1.R=function(a){V(this);var b=[];if("string"===typeof a)ed(this,a)&&(b=qa$1(b,this.g.get(W$1(this,a))));else {a=this.g.R();for(var c=0;c<a.length;c++)b=qa$1(b,a[c]);}return b};k$1.set=function(a,b){V(this);this.i=null;a=W$1(this,a);ed(this,a)&&(this.h-=this.g.get(a).length);this.g.set(a,[b]);this.h+=1;return this};k$1.get=function(a,b){if(!a)return b;a=this.R(a);return 0<a.length?String(a[0]):b};function mc(a,b,c){dd(a,b);0<c.length&&(a.i=null,a.g.set(W$1(a,b),ra$1(c)),a.h+=c.length);}
k$1.toString=function(){if(this.i)return this.i;if(!this.g)return "";for(var a=[],b=this.g.T(),c=0;c<b.length;c++){var d=b[c],e=encodeURIComponent(String(d));d=this.R(d);for(var f=0;f<d.length;f++){var h=e;""!==d[f]&&(h+="="+encodeURIComponent(String(d[f])));a.push(h);}}return this.i=a.join("&")};function W$1(a,b){b=String(b);a.j&&(b=b.toLowerCase());return b}function Zc$1(a,b){b&&!a.j&&(V(a),a.i=null,a.g.forEach(function(c,d){var e=d.toLowerCase();d!=e&&(dd(this,d),mc(this,e,c));},a));a.j=b;}var fd=class{constructor(a,b){this.h=a;this.g=b;}};function gd(a){this.l=a||hd;l.PerformanceNavigationTiming?(a=l.performance.getEntriesByType("navigation"),a=0<a.length&&("hq"==a[0].nextHopProtocol||"h2"==a[0].nextHopProtocol)):a=!!(l.g&&l.g.Ea&&l.g.Ea()&&l.g.Ea().Zb);this.j=a?this.l:1;this.g=null;1<this.j&&(this.g=new Set);this.h=null;this.i=[];}var hd=10;function id(a){return a.h?!0:a.g?a.g.size>=a.j:!1}function Cc(a){return a.h?1:a.g?a.g.size:0}function yc$1(a,b){return a.h?a.h==b:a.g?a.g.has(b):!1}function Dc(a,b){a.g?a.g.add(b):a.h=b;}
function Fc$1(a,b){a.h&&a.h==b?a.h=null:a.g&&a.g.has(b)&&a.g.delete(b);}gd.prototype.cancel=function(){this.i=jd(this);if(this.h)this.h.cancel(),this.h=null;else if(this.g&&0!==this.g.size){for(const a of this.g.values())a.cancel();this.g.clear();}};function jd(a){if(null!=a.h)return a.i.concat(a.h.D);if(null!=a.g&&0!==a.g.size){let b=a.i;for(const c of a.g.values())b=b.concat(c.D);return b}return ra$1(a.i)}function kd(){}kd.prototype.stringify=function(a){return l.JSON.stringify(a,void 0)};kd.prototype.parse=function(a){return l.JSON.parse(a,void 0)};function ld(){this.g=new kd;}function md(a,b,c){const d=c||"";try{Kc$1(a,function(e,f){let h=e;p(e)&&(h=rb(e));b.push(d+f+"="+encodeURIComponent(h));});}catch(e){throw b.push(d+"type="+encodeURIComponent("_badmap")),e;}}function nd(a,b){const c=new Mb;if(l.Image){const d=new Image;d.onload=ja(od,c,d,"TestLoadImage: loaded",!0,b);d.onerror=ja(od,c,d,"TestLoadImage: error",!1,b);d.onabort=ja(od,c,d,"TestLoadImage: abort",!1,b);d.ontimeout=ja(od,c,d,"TestLoadImage: timeout",!1,b);l.setTimeout(function(){if(d.ontimeout)d.ontimeout();},1E4);d.src=a;}else b(!1);}function od(a,b,c,d,e){try{b.onload=null,b.onerror=null,b.onabort=null,b.ontimeout=null,e(d);}catch(f){}}function pd(a){this.l=a.$b||null;this.j=a.ib||!1;}t(pd,Yb);pd.prototype.g=function(){return new qd(this.l,this.j)};pd.prototype.i=function(a){return function(){return a}}({});function qd(a,b){C$1.call(this);this.D=a;this.u=b;this.m=void 0;this.readyState=rd;this.status=0;this.responseType=this.responseText=this.response=this.statusText="";this.onreadystatechange=null;this.v=new Headers;this.h=null;this.C="GET";this.B="";this.g=!1;this.A=this.j=this.l=null;}t(qd,C$1);var rd=0;k$1=qd.prototype;
k$1.open=function(a,b){if(this.readyState!=rd)throw this.abort(),Error("Error reopening a connection");this.C=a;this.B=b;this.readyState=1;sd(this);};k$1.send=function(a){if(1!=this.readyState)throw this.abort(),Error("need to call open() first. ");this.g=!0;const b={headers:this.v,method:this.C,credentials:this.m,cache:void 0};a&&(b.body=a);(this.D||l).fetch(new Request(this.B,b)).then(this.Va.bind(this),this.ha.bind(this));};
k$1.abort=function(){this.response=this.responseText="";this.v=new Headers;this.status=0;this.j&&this.j.cancel("Request was aborted.");1<=this.readyState&&this.g&&4!=this.readyState&&(this.g=!1,td(this));this.readyState=rd;};
k$1.Va=function(a){if(this.g&&(this.l=a,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=a.headers,this.readyState=2,sd(this)),this.g&&(this.readyState=3,sd(this),this.g)))if("arraybuffer"===this.responseType)a.arrayBuffer().then(this.Ta.bind(this),this.ha.bind(this));else if("undefined"!==typeof l.ReadableStream&&"body"in a){this.j=a.body.getReader();if(this.u){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=
[];}else this.response=this.responseText="",this.A=new TextDecoder;ud(this);}else a.text().then(this.Ua.bind(this),this.ha.bind(this));};function ud(a){a.j.read().then(a.Sa.bind(a)).catch(a.ha.bind(a));}k$1.Sa=function(a){if(this.g){if(this.u&&a.value)this.response.push(a.value);else if(!this.u){var b=a.value?a.value:new Uint8Array(0);if(b=this.A.decode(b,{stream:!a.done}))this.response=this.responseText+=b;}a.done?td(this):sd(this);3==this.readyState&&ud(this);}};
k$1.Ua=function(a){this.g&&(this.response=this.responseText=a,td(this));};k$1.Ta=function(a){this.g&&(this.response=a,td(this));};k$1.ha=function(){this.g&&td(this);};function td(a){a.readyState=4;a.l=null;a.j=null;a.A=null;sd(a);}k$1.setRequestHeader=function(a,b){this.v.append(a,b);};k$1.getResponseHeader=function(a){return this.h?this.h.get(a.toLowerCase())||"":""};
k$1.getAllResponseHeaders=function(){if(!this.h)return "";const a=[],b=this.h.entries();for(var c=b.next();!c.done;)c=c.value,a.push(c[0]+": "+c[1]),c=b.next();return a.join("\r\n")};function sd(a){a.onreadystatechange&&a.onreadystatechange.call(a);}Object.defineProperty(qd.prototype,"withCredentials",{get:function(){return "include"===this.m},set:function(a){this.m=a?"include":"same-origin";}});var vd=l.JSON.parse;function X$1(a){C$1.call(this);this.headers=new S;this.u=a||null;this.h=!1;this.C=this.g=null;this.H="";this.m=0;this.j="";this.l=this.F=this.v=this.D=!1;this.B=0;this.A=null;this.J=wd;this.K=this.L=!1;}t(X$1,C$1);var wd="",xd=/^https?$/i,yd=["POST","PUT"];k$1=X$1.prototype;
k$1.ea=function(a,b,c,d){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.H+"; newUri="+a);b=b?b.toUpperCase():"GET";this.H=a;this.j="";this.m=0;this.D=!1;this.h=!0;this.g=this.u?this.u.g():cc$1.g();this.C=this.u?Zb(this.u):Zb(cc$1);this.g.onreadystatechange=q(this.Fa,this);try{this.F=!0,this.g.open(b,String(a),!0),this.F=!1;}catch(f){zd(this,f);return}a=c||"";const e=new S(this.headers);d&&Kc$1(d,function(f,h){e.set(h,f);});d=oa$1(e.T());c=l.FormData&&a instanceof l.FormData;
!(0<=ma$1(yd,b))||d||c||e.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");e.forEach(function(f,h){this.g.setRequestHeader(h,f);},this);this.J&&(this.g.responseType=this.J);"withCredentials"in this.g&&this.g.withCredentials!==this.L&&(this.g.withCredentials=this.L);try{Ad(this),0<this.B&&((this.K=Bd(this.g))?(this.g.timeout=this.B,this.g.ontimeout=q(this.pa,this)):this.A=Gb(this.pa,this.B,this)),this.v=!0,this.g.send(a),this.v=!1;}catch(f){zd(this,f);}};
function Bd(a){return y&&Ra$1()&&"number"===typeof a.timeout&&void 0!==a.ontimeout}function pa(a){return "content-type"==a.toLowerCase()}k$1.pa=function(){"undefined"!=typeof goog&&this.g&&(this.j="Timed out after "+this.B+"ms, aborting",this.m=8,D$1(this,"timeout"),this.abort(8));};function zd(a,b){a.h=!1;a.g&&(a.l=!0,a.g.abort(),a.l=!1);a.j=b;a.m=5;Cd(a);Dd(a);}function Cd(a){a.D||(a.D=!0,D$1(a,"complete"),D$1(a,"error"));}
k$1.abort=function(a){this.g&&this.h&&(this.h=!1,this.l=!0,this.g.abort(),this.l=!1,this.m=a||7,D$1(this,"complete"),D$1(this,"abort"),Dd(this));};k$1.M=function(){this.g&&(this.h&&(this.h=!1,this.l=!0,this.g.abort(),this.l=!1),Dd(this,!0));X$1.Z.M.call(this);};k$1.Fa=function(){this.s||(this.F||this.v||this.l?Ed(this):this.cb());};k$1.cb=function(){Ed(this);};
function Ed(a){if(a.h&&"undefined"!=typeof goog&&(!a.C[1]||4!=O$1(a)||2!=a.ba()))if(a.v&&4==O$1(a))Gb(a.Fa,0,a);else if(D$1(a,"readystatechange"),4==O$1(a)){a.h=!1;try{const n=a.ba();a:switch(n){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var b=!0;break a;default:b=!1;}var c;if(!(c=b)){var d;if(d=0===n){var e=String(a.H).match(Mc)[1]||null;if(!e&&l.self&&l.self.location){var f=l.self.location.protocol;e=f.substr(0,f.length-1);}d=!xd.test(e?e.toLowerCase():"");}c=d;}if(c)D$1(a,"complete"),D$1(a,
"success");else {a.m=6;try{var h=2<O$1(a)?a.g.statusText:"";}catch(u){h="";}a.j=h+" ["+a.ba()+"]";Cd(a);}}finally{Dd(a);}}}function Dd(a,b){if(a.g){Ad(a);const c=a.g,d=a.C[0]?aa:null;a.g=null;a.C=null;b||D$1(a,"ready");try{c.onreadystatechange=d;}catch(e){}}}function Ad(a){a.g&&a.K&&(a.g.ontimeout=null);a.A&&(l.clearTimeout(a.A),a.A=null);}function O$1(a){return a.g?a.g.readyState:0}k$1.ba=function(){try{return 2<O$1(this)?this.g.status:-1}catch(a){return -1}};
k$1.ga=function(){try{return this.g?this.g.responseText:""}catch(a){return ""}};k$1.Qa=function(a){if(this.g){var b=this.g.responseText;a&&0==b.indexOf(a)&&(b=b.substring(a.length));return vd(b)}};function oc$1(a){try{if(!a.g)return null;if("response"in a.g)return a.g.response;switch(a.J){case wd:case "text":return a.g.responseText;case "arraybuffer":if("mozResponseArrayBuffer"in a.g)return a.g.mozResponseArrayBuffer}return null}catch(b){return null}}k$1.Da=function(){return this.m};
k$1.La=function(){return "string"===typeof this.j?this.j:String(this.j)};function Fd(a){let b="";xa$1(a,function(c,d){b+=d;b+=":";b+=c;b+="\r\n";});return b}function Gd(a,b,c){a:{for(d in c){var d=!1;break a}d=!0;}d||(c=Fd(c),"string"===typeof a?(null!=c&&encodeURIComponent(String(c))):R(a,b,c));}function Hd(a,b,c){return c&&c.internalChannelParams?c.internalChannelParams[a]||b:b}
function Id(a){this.za=0;this.l=[];this.h=new Mb;this.la=this.oa=this.F=this.W=this.g=this.sa=this.D=this.aa=this.o=this.P=this.s=null;this.Za=this.V=0;this.Xa=Hd("failFast",!1,a);this.N=this.v=this.u=this.m=this.j=null;this.X=!0;this.I=this.ta=this.U=-1;this.Y=this.A=this.C=0;this.Pa=Hd("baseRetryDelayMs",5E3,a);this.$a=Hd("retryDelaySeedMs",1E4,a);this.Ya=Hd("forwardChannelMaxRetries",2,a);this.ra=Hd("forwardChannelRequestTimeoutMs",2E4,a);this.qa=a&&a.xmlHttpFactory||void 0;this.Ba=a&&a.Yb||!1;
this.K=void 0;this.H=a&&a.supportsCrossDomainXhr||!1;this.J="";this.i=new gd(a&&a.concurrentRequestLimit);this.Ca=new ld;this.ja=a&&a.fastHandshake||!1;this.Ra=a&&a.Wb||!1;a&&a.Aa&&this.h.Aa();a&&a.forceLongPolling&&(this.X=!1);this.$=!this.ja&&this.X&&a&&a.detectBufferingProxy||!1;this.ka=void 0;this.O=0;this.L=!1;this.B=null;this.Wa=!a||!1!==a.Xb;}k$1=Id.prototype;k$1.ma=8;k$1.G=1;
function Ic$1(a){Jd(a);if(3==a.G){var b=a.V++,c=N$1(a.F);R(c,"SID",a.J);R(c,"RID",b);R(c,"TYPE","terminate");Kd(a,c);b=new M$1(a,a.h,b,void 0);b.K=2;b.v=jc(N$1(c));c=!1;l.navigator&&l.navigator.sendBeacon&&(c=l.navigator.sendBeacon(b.v.toString(),""));!c&&l.Image&&((new Image).src=b.v,c=!0);c||(b.g=nc$1(b.l,null),b.g.ea(b.v));b.F=Date.now();lc$1(b);}Ld(a);}k$1.hb=function(a){try{this.h.info("Origin Trials invoked: "+a);}catch(b){}};function Ac$1(a){a.g&&(wc(a),a.g.cancel(),a.g=null);}
function Jd(a){Ac$1(a);a.u&&(l.clearTimeout(a.u),a.u=null);zc$1(a);a.i.cancel();a.m&&("number"===typeof a.m&&l.clearTimeout(a.m),a.m=null);}function Md(a,b){a.l.push(new fd(a.Za++,b));3==a.G&&Hc$1(a);}function Hc$1(a){id(a.i)||a.m||(a.m=!0,zb(a.Ha,a),a.C=0);}function Nd(a,b){if(Cc(a.i)>=a.i.j-(a.m?1:0))return !1;if(a.m)return a.l=b.D.concat(a.l),!0;if(1==a.G||2==a.G||a.C>=(a.Xa?0:a.Ya))return !1;a.m=K$1(q(a.Ha,a,b),Od(a,a.C));a.C++;return !0}
k$1.Ha=function(a){if(this.m)if(this.m=null,1==this.G){if(!a){this.V=Math.floor(1E5*Math.random());a=this.V++;const e=new M$1(this,this.h,a,void 0);let f=this.s;this.P&&(f?(f=ya$1(f),Aa$1(f,this.P)):f=this.P);null===this.o&&(e.H=f);if(this.ja)a:{var b=0;for(var c=0;c<this.l.length;c++){b:{var d=this.l[c];if("__data__"in d.g&&(d=d.g.__data__,"string"===typeof d)){d=d.length;break b}d=void 0;}if(void 0===d)break;b+=d;if(4096<b){b=c;break a}if(4096===b||c===this.l.length-1){b=c+1;break a}}b=1E3;}else b=1E3;b=
Pd(this,e,b);c=N$1(this.F);R(c,"RID",a);R(c,"CVER",22);this.D&&R(c,"X-HTTP-Session-Id",this.D);Kd(this,c);this.o&&f&&Gd(c,this.o,f);Dc(this.i,e);this.Ra&&R(c,"TYPE","init");this.ja?(R(c,"$req",b),R(c,"SID","null"),e.$=!0,ic$1(e,c,null)):ic$1(e,c,b);this.G=2;}}else 3==this.G&&(a?Qd(this,a):0==this.l.length||id(this.i)||Qd(this));};
function Qd(a,b){var c;b?c=b.m:c=a.V++;const d=N$1(a.F);R(d,"SID",a.J);R(d,"RID",c);R(d,"AID",a.U);Kd(a,d);a.o&&a.s&&Gd(d,a.o,a.s);c=new M$1(a,a.h,c,a.C+1);null===a.o&&(c.H=a.s);b&&(a.l=b.D.concat(a.l));b=Pd(a,c,1E3);c.setTimeout(Math.round(.5*a.ra)+Math.round(.5*a.ra*Math.random()));Dc(a.i,c);ic$1(c,d,b);}function Kd(a,b){a.j&&Kc$1({},function(c,d){R(b,d,c);});}
function Pd(a,b,c){c=Math.min(a.l.length,c);var d=a.j?q(a.j.Oa,a.j,a):null;a:{var e=a.l;let f=-1;for(;;){const h=["count="+c];-1==f?0<c?(f=e[0].h,h.push("ofs="+f)):f=0:h.push("ofs="+f);let n=!0;for(let u=0;u<c;u++){let m=e[u].h;const r=e[u].g;m-=f;if(0>m)f=Math.max(0,e[u].h-100),n=!1;else try{md(r,h,"req"+m+"_");}catch(G){d&&d(r);}}if(n){d=h.join("&");break a}}}a=a.l.splice(0,c);b.D=a;return d}function Gc$1(a){a.g||a.u||(a.Y=1,zb(a.Ga,a),a.A=0);}
function Bc(a){if(a.g||a.u||3<=a.A)return !1;a.Y++;a.u=K$1(q(a.Ga,a),Od(a,a.A));a.A++;return !0}k$1.Ga=function(){this.u=null;Rd(this);if(this.$&&!(this.L||null==this.g||0>=this.O)){var a=2*this.O;this.h.info("BP detection timer enabled: "+a);this.B=K$1(q(this.bb,this),a);}};k$1.bb=function(){this.B&&(this.B=null,this.h.info("BP detection timeout reached."),this.h.info("Buffering proxy detected and switch to long-polling!"),this.N=!1,this.L=!0,J$1(10),Ac$1(this),Rd(this));};
function wc(a){null!=a.B&&(l.clearTimeout(a.B),a.B=null);}function Rd(a){a.g=new M$1(a,a.h,"rpc",a.Y);null===a.o&&(a.g.H=a.s);a.g.O=0;var b=N$1(a.oa);R(b,"RID","rpc");R(b,"SID",a.J);R(b,"CI",a.N?"0":"1");R(b,"AID",a.U);Kd(a,b);R(b,"TYPE","xmlhttp");a.o&&a.s&&Gd(b,a.o,a.s);a.K&&a.g.setTimeout(a.K);var c=a.g;a=a.la;c.K=1;c.v=jc(N$1(b));c.s=null;c.U=!0;kc(c,a);}k$1.ab=function(){null!=this.v&&(this.v=null,Ac$1(this),Bc(this),J$1(19));};function zc$1(a){null!=a.v&&(l.clearTimeout(a.v),a.v=null);}
function uc(a,b){var c=null;if(a.g==b){zc$1(a);wc(a);a.g=null;var d=2;}else if(yc$1(a.i,b))c=b.D,Fc$1(a.i,b),d=1;else return;a.I=b.N;if(0!=a.G)if(b.i)if(1==d){c=b.s?b.s.length:0;b=Date.now()-b.F;var e=a.C;d=Sb();D$1(d,new Vb(d,c,b,e));Hc$1(a);}else Gc$1(a);else if(e=b.o,3==e||0==e&&0<a.I||!(1==d&&Nd(a,b)||2==d&&Bc(a)))switch(c&&0<c.length&&(b=a.i,b.i=b.i.concat(c)),e){case 1:Q$1(a,5);break;case 4:Q$1(a,10);break;case 3:Q$1(a,6);break;default:Q$1(a,2);}}
function Od(a,b){let c=a.Pa+Math.floor(Math.random()*a.$a);a.j||(c*=2);return c*b}function Q$1(a,b){a.h.info("Error code "+b);if(2==b){var c=null;a.j&&(c=null);var d=q(a.jb,a);c||(c=new U$1("//www.google.com/images/cleardot.gif"),l.location&&"http"==l.location.protocol||Oc(c,"https"),jc(c));nd(c.toString(),d);}else J$1(2);a.G=0;a.j&&a.j.va(b);Ld(a);Jd(a);}k$1.jb=function(a){a?(this.h.info("Successfully pinged google.com"),J$1(2)):(this.h.info("Failed to ping google.com"),J$1(1));};
function Ld(a){a.G=0;a.I=-1;if(a.j){if(0!=jd(a.i).length||0!=a.l.length)a.i.i.length=0,ra$1(a.l),a.l.length=0;a.j.ua();}}function Ec$1(a,b,c){let d=ad(c);if(""!=d.i)b&&Pc(d,b+"."+d.i),Qc(d,d.m);else {const e=l.location;d=bd(e.protocol,b?b+"."+e.hostname:e.hostname,+e.port,c);}a.aa&&xa$1(a.aa,function(e,f){R(d,f,e);});b=a.D;c=a.sa;b&&c&&R(d,b,c);R(d,"VER",a.ma);Kd(a,d);return d}
function nc$1(a,b,c){if(b&&!a.H)throw Error("Can't create secondary domain capable XhrIo object.");b=c&&a.Ba&&!a.qa?new X$1(new pd({ib:!0})):new X$1(a.qa);b.L=a.H;return b}function Sd(){}k$1=Sd.prototype;k$1.xa=function(){};k$1.wa=function(){};k$1.va=function(){};k$1.ua=function(){};k$1.Oa=function(){};function Td(){if(y&&!(10<=Number(Ua$1)))throw Error("Environmental error: no available transport.");}Td.prototype.g=function(a,b){return new Y$1(a,b)};
function Y$1(a,b){C$1.call(this);this.g=new Id(b);this.l=a;this.h=b&&b.messageUrlParams||null;a=b&&b.messageHeaders||null;b&&b.clientProtocolHeaderRequired&&(a?a["X-Client-Protocol"]="webchannel":a={"X-Client-Protocol":"webchannel"});this.g.s=a;a=b&&b.initMessageHeaders||null;b&&b.messageContentType&&(a?a["X-WebChannel-Content-Type"]=b.messageContentType:a={"X-WebChannel-Content-Type":b.messageContentType});b&&b.ya&&(a?a["X-WebChannel-Client-Profile"]=b.ya:a={"X-WebChannel-Client-Profile":b.ya});this.g.P=
a;(a=b&&b.httpHeadersOverwriteParam)&&!sa(a)&&(this.g.o=a);this.A=b&&b.supportsCrossDomainXhr||!1;this.v=b&&b.sendRawJson||!1;(b=b&&b.httpSessionIdParam)&&!sa(b)&&(this.g.D=b,a=this.h,null!==a&&b in a&&(a=this.h,b in a&&delete a[b]));this.j=new Z$1(this);}t(Y$1,C$1);Y$1.prototype.m=function(){this.g.j=this.j;this.A&&(this.g.H=!0);var a=this.g,b=this.l,c=this.h||void 0;a.Wa&&(a.h.info("Origin Trials enabled."),zb(q(a.hb,a,b)));J$1(0);a.W=b;a.aa=c||{};a.N=a.X;a.F=Ec$1(a,null,a.W);Hc$1(a);};Y$1.prototype.close=function(){Ic$1(this.g);};
Y$1.prototype.u=function(a){if("string"===typeof a){var b={};b.__data__=a;Md(this.g,b);}else this.v?(b={},b.__data__=rb(a),Md(this.g,b)):Md(this.g,a);};Y$1.prototype.M=function(){this.g.j=null;delete this.j;Ic$1(this.g);delete this.g;Y$1.Z.M.call(this);};function Ud(a){ac$1.call(this);var b=a.__sm__;if(b){a:{for(const c in b){a=c;break a}a=void 0;}if(this.i=a)a=this.i,b=null!==b&&a in b?b[a]:void 0;this.data=b;}else this.data=a;}t(Ud,ac$1);function Vd(){bc$1.call(this);this.status=1;}t(Vd,bc$1);function Z$1(a){this.g=a;}
t(Z$1,Sd);Z$1.prototype.xa=function(){D$1(this.g,"a");};Z$1.prototype.wa=function(a){D$1(this.g,new Ud(a));};Z$1.prototype.va=function(a){D$1(this.g,new Vd(a));};Z$1.prototype.ua=function(){D$1(this.g,"b");};/*

 Copyright 2017 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
Td.prototype.createWebChannel=Td.prototype.g;Y$1.prototype.send=Y$1.prototype.u;Y$1.prototype.open=Y$1.prototype.m;Y$1.prototype.close=Y$1.prototype.close;Wb.NO_ERROR=0;Wb.TIMEOUT=8;Wb.HTTP_ERROR=6;Xb.COMPLETE="complete";$b.EventType=L$1;L$1.OPEN="a";L$1.CLOSE="b";L$1.ERROR="c";L$1.MESSAGE="d";C$1.prototype.listen=C$1.prototype.N;X$1.prototype.listenOnce=X$1.prototype.O;X$1.prototype.getLastError=X$1.prototype.La;X$1.prototype.getLastErrorCode=X$1.prototype.Da;X$1.prototype.getStatus=X$1.prototype.ba;X$1.prototype.getResponseJson=X$1.prototype.Qa;
X$1.prototype.getResponseText=X$1.prototype.ga;X$1.prototype.send=X$1.prototype.ea;var createWebChannelTransport = function(){return new Td};var getStatEventTarget = function(){return Sb()};var ErrorCode = Wb;var EventType = Xb;var Event = H;var Stat = {rb:0,ub:1,vb:2,Ob:3,Tb:4,Qb:5,Rb:6,Pb:7,Nb:8,Sb:9,PROXY:10,NOPROXY:11,Lb:12,Hb:13,Ib:14,Gb:15,Jb:16,Kb:17,nb:18,mb:19,ob:20};var FetchXmlHttpFactory = pd;var WebChannel = $b;
var XhrIo = X$1;

const D = "@firebase/firestore";

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Simple wrapper around a nullable UID. Mostly exists to make code more
 * readable.
 */
class C {
    constructor(t) {
        this.uid = t;
    }
    isAuthenticated() {
        return null != this.uid;
    }
    /**
     * Returns a key representing this user, suitable for inclusion in a
     * dictionary.
     */    toKey() {
        return this.isAuthenticated() ? "uid:" + this.uid : "anonymous-user";
    }
    isEqual(t) {
        return t.uid === this.uid;
    }
}

/** A user with a null UID. */ C.UNAUTHENTICATED = new C(null), 
// TODO(mikelehen): Look into getting a proper uid-equivalent for
// non-FirebaseAuth providers.
C.GOOGLE_CREDENTIALS = new C("google-credentials-uid"), C.FIRST_PARTY = new C("first-party-uid"), 
C.MOCK_USER = new C("mock-user");

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let N = "9.6.3";

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const k = new fireLogger("@firebase/firestore");

// Helper methods are needed because variables can't be exported as read/write
function x() {
    return k.logLevel;
}

function O(t, ...e) {
    if (k.logLevel <= LogLevel.DEBUG) {
        const n = e.map(L);
        k.debug(`Firestore (${N}): ${t}`, ...n);
    }
}

function M(t, ...e) {
    if (k.logLevel <= LogLevel.ERROR) {
        const n = e.map(L);
        k.error(`Firestore (${N}): ${t}`, ...n);
    }
}

/**
 * @internal
 */ function F(t, ...e) {
    if (k.logLevel <= LogLevel.WARN) {
        const n = e.map(L);
        k.warn(`Firestore (${N}): ${t}`, ...n);
    }
}

/**
 * Converts an additional log parameter to a string representation.
 */ function L(t) {
    if ("string" == typeof t) return t;
    try {
        return e = t, JSON.stringify(e);
    } catch (e) {
        // Converting to JSON failed, just log the object directly
        return t;
    }
    /**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
    /** Formats an object as a JSON string, suitable for logging. */
    var e;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Unconditionally fails, throwing an Error with the given message.
 * Messages are stripped in production builds.
 *
 * Returns `never` and can be used in expressions:
 * @example
 * let futureVar = fail('not implemented yet');
 */ function B(t = "Unexpected state") {
    // Log the failure in addition to throw an exception, just in case the
    // exception is swallowed.
    const e = `FIRESTORE (${N}) INTERNAL ASSERTION FAILED: ` + t;
    // NOTE: We don't use FirestoreError here because these are internal failures
    // that cannot be handled by the user. (Also it would create a circular
    // dependency between the error and assert modules which doesn't work.)
    throw M(e), new Error(e);
}

/**
 * Fails if the given assertion condition is false, throwing an Error with the
 * given message if it did.
 *
 * Messages are stripped in production builds.
 */ function U(t, e) {
    t || B();
}

/**
 * Casts `obj` to `T`. In non-production builds, verifies that `obj` is an
 * instance of `T` before casting.
 */ function K(t, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
e) {
    return t;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ const j = {
    // Causes are copied from:
    // https://github.com/grpc/grpc/blob/bceec94ea4fc5f0085d81235d8e1c06798dc341a/include/grpc%2B%2B/impl/codegen/status_code_enum.h
    /** Not an error; returned on success. */
    OK: "ok",
    /** The operation was cancelled (typically by the caller). */
    CANCELLED: "cancelled",
    /** Unknown error or an error from a different error domain. */
    UNKNOWN: "unknown",
    /**
     * Client specified an invalid argument. Note that this differs from
     * FAILED_PRECONDITION. INVALID_ARGUMENT indicates arguments that are
     * problematic regardless of the state of the system (e.g., a malformed file
     * name).
     */
    INVALID_ARGUMENT: "invalid-argument",
    /**
     * Deadline expired before operation could complete. For operations that
     * change the state of the system, this error may be returned even if the
     * operation has completed successfully. For example, a successful response
     * from a server could have been delayed long enough for the deadline to
     * expire.
     */
    DEADLINE_EXCEEDED: "deadline-exceeded",
    /** Some requested entity (e.g., file or directory) was not found. */
    NOT_FOUND: "not-found",
    /**
     * Some entity that we attempted to create (e.g., file or directory) already
     * exists.
     */
    ALREADY_EXISTS: "already-exists",
    /**
     * The caller does not have permission to execute the specified operation.
     * PERMISSION_DENIED must not be used for rejections caused by exhausting
     * some resource (use RESOURCE_EXHAUSTED instead for those errors).
     * PERMISSION_DENIED must not be used if the caller can not be identified
     * (use UNAUTHENTICATED instead for those errors).
     */
    PERMISSION_DENIED: "permission-denied",
    /**
     * The request does not have valid authentication credentials for the
     * operation.
     */
    UNAUTHENTICATED: "unauthenticated",
    /**
     * Some resource has been exhausted, perhaps a per-user quota, or perhaps the
     * entire file system is out of space.
     */
    RESOURCE_EXHAUSTED: "resource-exhausted",
    /**
     * Operation was rejected because the system is not in a state required for
     * the operation's execution. For example, directory to be deleted may be
     * non-empty, an rmdir operation is applied to a non-directory, etc.
     *
     * A litmus test that may help a service implementor in deciding
     * between FAILED_PRECONDITION, ABORTED, and UNAVAILABLE:
     *  (a) Use UNAVAILABLE if the client can retry just the failing call.
     *  (b) Use ABORTED if the client should retry at a higher-level
     *      (e.g., restarting a read-modify-write sequence).
     *  (c) Use FAILED_PRECONDITION if the client should not retry until
     *      the system state has been explicitly fixed. E.g., if an "rmdir"
     *      fails because the directory is non-empty, FAILED_PRECONDITION
     *      should be returned since the client should not retry unless
     *      they have first fixed up the directory by deleting files from it.
     *  (d) Use FAILED_PRECONDITION if the client performs conditional
     *      REST Get/Update/Delete on a resource and the resource on the
     *      server does not match the condition. E.g., conflicting
     *      read-modify-write on the same resource.
     */
    FAILED_PRECONDITION: "failed-precondition",
    /**
     * The operation was aborted, typically due to a concurrency issue like
     * sequencer check failures, transaction aborts, etc.
     *
     * See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
     * and UNAVAILABLE.
     */
    ABORTED: "aborted",
    /**
     * Operation was attempted past the valid range. E.g., seeking or reading
     * past end of file.
     *
     * Unlike INVALID_ARGUMENT, this error indicates a problem that may be fixed
     * if the system state changes. For example, a 32-bit file system will
     * generate INVALID_ARGUMENT if asked to read at an offset that is not in the
     * range [0,2^32-1], but it will generate OUT_OF_RANGE if asked to read from
     * an offset past the current file size.
     *
     * There is a fair bit of overlap between FAILED_PRECONDITION and
     * OUT_OF_RANGE. We recommend using OUT_OF_RANGE (the more specific error)
     * when it applies so that callers who are iterating through a space can
     * easily look for an OUT_OF_RANGE error to detect when they are done.
     */
    OUT_OF_RANGE: "out-of-range",
    /** Operation is not implemented or not supported/enabled in this service. */
    UNIMPLEMENTED: "unimplemented",
    /**
     * Internal errors. Means some invariants expected by underlying System has
     * been broken. If you see one of these errors, Something is very broken.
     */
    INTERNAL: "internal",
    /**
     * The service is currently unavailable. This is a most likely a transient
     * condition and may be corrected by retrying with a backoff.
     *
     * See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
     * and UNAVAILABLE.
     */
    UNAVAILABLE: "unavailable",
    /** Unrecoverable data loss or corruption. */
    DATA_LOSS: "data-loss"
};

/** An error returned by a Firestore operation. */ class Q extends FirebaseError {
    /** @hideconstructor */
    constructor(
    /**
     * The backend error code associated with this error.
     */
    t, 
    /**
     * A custom error description.
     */
    e) {
        super(t, e), this.code = t, this.message = e, 
        // HACK: We write a toString property directly because Error is not a real
        // class and so inheritance does not work correctly. We could alternatively
        // do the same "back-door inheritance" trick that FirebaseError does.
        this.toString = () => `${this.name}: [code=${this.code}]: ${this.message}`;
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class W {
    constructor() {
        this.promise = new Promise(((t, e) => {
            this.resolve = t, this.reject = e;
        }));
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class G {
    constructor(t, e) {
        this.user = e, this.type = "OAuth", this.headers = new Map, this.headers.set("Authorization", `Bearer ${t}`);
    }
}

/**
 * A CredentialsProvider that always yields an empty token.
 * @internal
 */ class z {
    getToken() {
        return Promise.resolve(null);
    }
    invalidateToken() {}
    start(t, e) {
        // Fire with initial user.
        t.enqueueRetryable((() => e(C.UNAUTHENTICATED)));
    }
    shutdown() {}
}

class J {
    constructor(t) {
        this.t = t, 
        /** Tracks the current User. */
        this.currentUser = C.UNAUTHENTICATED, 
        /**
         * Counter used to detect if the token changed while a getToken request was
         * outstanding.
         */
        this.i = 0, this.forceRefresh = !1, this.auth = null;
    }
    start(t, e) {
        let n = this.i;
        // A change listener that prevents double-firing for the same token change.
                const s = t => this.i !== n ? (n = this.i, e(t)) : Promise.resolve();
        // A promise that can be waited on to block on the next token change.
        // This promise is re-created after each change.
                let i = new W;
        this.o = () => {
            this.i++, this.currentUser = this.u(), i.resolve(), i = new W, t.enqueueRetryable((() => s(this.currentUser)));
        };
        const r = () => {
            const e = i;
            t.enqueueRetryable((async () => {
                await e.promise, await s(this.currentUser);
            }));
        }, o = t => {
            O("FirebaseAuthCredentialsProvider", "Auth detected"), this.auth = t, this.auth.addAuthTokenListener(this.o), 
            r();
        };
        this.t.onInit((t => o(t))), 
        // Our users can initialize Auth right after Firestore, so we give it
        // a chance to register itself with the component framework before we
        // determine whether to start up in unauthenticated mode.
        setTimeout((() => {
            if (!this.auth) {
                const t = this.t.getImmediate({
                    optional: !0
                });
                t ? o(t) : (
                // If auth is still not available, proceed with `null` user
                O("FirebaseAuthCredentialsProvider", "Auth not yet detected"), i.resolve(), i = new W);
            }
        }), 0), r();
    }
    getToken() {
        // Take note of the current value of the tokenCounter so that this method
        // can fail (with an ABORTED error) if there is a token change while the
        // request is outstanding.
        const t = this.i, e = this.forceRefresh;
        return this.forceRefresh = !1, this.auth ? this.auth.getToken(e).then((e => 
        // Cancel the request since the token changed while the request was
        // outstanding so the response is potentially for a previous user (which
        // user, we can't be sure).
        this.i !== t ? (O("FirebaseAuthCredentialsProvider", "getToken aborted due to token change."), 
        this.getToken()) : e ? (U("string" == typeof e.accessToken), new G(e.accessToken, this.currentUser)) : null)) : Promise.resolve(null);
    }
    invalidateToken() {
        this.forceRefresh = !0;
    }
    shutdown() {
        this.auth && this.auth.removeAuthTokenListener(this.o);
    }
    // Auth.getUid() can return null even with a user logged in. It is because
    // getUid() is synchronous, but the auth code populating Uid is asynchronous.
    // This method should only be called in the AuthTokenListener callback
    // to guarantee to get the actual user.
    u() {
        const t = this.auth && this.auth.getUid();
        return U(null === t || "string" == typeof t), new C(t);
    }
}

/*
 * FirstPartyToken provides a fresh token each time its value
 * is requested, because if the token is too old, requests will be rejected.
 * Technically this may no longer be necessary since the SDK should gracefully
 * recover from unauthenticated errors (see b/33147818 for context), but it's
 * safer to keep the implementation as-is.
 */ class Y {
    constructor(t, e, n) {
        this.type = "FirstParty", this.user = C.FIRST_PARTY, this.headers = new Map, this.headers.set("X-Goog-AuthUser", e);
        const s = t.auth.getAuthHeaderValueForFirstParty([]);
        s && this.headers.set("Authorization", s), n && this.headers.set("X-Goog-Iam-Authorization-Token", n);
    }
}

/*
 * Provides user credentials required for the Firestore JavaScript SDK
 * to authenticate the user, using technique that is only available
 * to applications hosted by Google.
 */ class X {
    constructor(t, e, n) {
        this.h = t, this.l = e, this.m = n;
    }
    getToken() {
        return Promise.resolve(new Y(this.h, this.l, this.m));
    }
    start(t, e) {
        // Fire with initial uid.
        t.enqueueRetryable((() => e(C.FIRST_PARTY)));
    }
    shutdown() {}
    invalidateToken() {}
}

class Z {
    constructor(t) {
        this.value = t, this.type = "AppCheck", this.headers = new Map, t && t.length > 0 && this.headers.set("x-firebase-appcheck", this.value);
    }
}

class tt {
    constructor(t) {
        this.g = t, this.forceRefresh = !1, this.appCheck = null;
    }
    start(t, e) {
        this.o = n => {
            t.enqueueRetryable((() => (t => (null != t.error && O("FirebaseAppCheckTokenProvider", `Error getting App Check token; using placeholder token instead. Error: ${t.error.message}`), 
            e(t.token)))(n)));
        };
        const n = t => {
            O("FirebaseAppCheckTokenProvider", "AppCheck detected"), this.appCheck = t, this.appCheck.addTokenListener(this.o);
        };
        this.g.onInit((t => n(t))), 
        // Our users can initialize AppCheck after Firestore, so we give it
        // a chance to register itself with the component framework.
        setTimeout((() => {
            if (!this.appCheck) {
                const t = this.g.getImmediate({
                    optional: !0
                });
                t ? n(t) : 
                // If AppCheck is still not available, proceed without it.
                O("FirebaseAppCheckTokenProvider", "AppCheck not yet detected");
            }
        }), 0);
    }
    getToken() {
        const t = this.forceRefresh;
        return this.forceRefresh = !1, this.appCheck ? this.appCheck.getToken(t).then((t => t ? (U("string" == typeof t.token), 
        new Z(t.token)) : null)) : Promise.resolve(null);
    }
    invalidateToken() {
        this.forceRefresh = !0;
    }
    shutdown() {
        this.appCheck && this.appCheck.removeTokenListener(this.o);
    }
}

/**
 * Builds a CredentialsProvider depending on the type of
 * the credentials passed in.
 */
/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * `ListenSequence` is a monotonic sequence. It is initialized with a minimum value to
 * exceed. All subsequent calls to next will return increasing values. If provided with a
 * `SequenceNumberSyncer`, it will additionally bump its next value when told of a new value, as
 * well as write out sequence numbers that it produces via `next()`.
 */
class nt {
    constructor(t, e) {
        this.previousValue = t, e && (e.sequenceNumberHandler = t => this.p(t), this.T = t => e.writeSequenceNumber(t));
    }
    p(t) {
        return this.previousValue = Math.max(t, this.previousValue), this.previousValue;
    }
    next() {
        const t = ++this.previousValue;
        return this.T && this.T(t), t;
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Generates `nBytes` of random bytes.
 *
 * If `nBytes < 0` , an error will be thrown.
 */
function st(t) {
    // Polyfills for IE and WebWorker by using `self` and `msCrypto` when `crypto` is not available.
    const e = 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "undefined" != typeof self && (self.crypto || self.msCrypto), n = new Uint8Array(t);
    if (e && "function" == typeof e.getRandomValues) e.getRandomValues(n); else 
    // Falls back to Math.random
    for (let e = 0; e < t; e++) n[e] = Math.floor(256 * Math.random());
    return n;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ nt.I = -1;

class it {
    static A() {
        // Alphanumeric characters
        const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", e = Math.floor(256 / t.length) * t.length;
        // The largest byte value that is a multiple of `char.length`.
                let n = "";
        for (;n.length < 20; ) {
            const s = st(40);
            for (let i = 0; i < s.length; ++i) 
            // Only accept values that are [0, maxMultiple), this ensures they can
            // be evenly mapped to indices of `chars` via a modulo operation.
            n.length < 20 && s[i] < e && (n += t.charAt(s[i] % t.length));
        }
        return n;
    }
}

function rt(t, e) {
    return t < e ? -1 : t > e ? 1 : 0;
}

/** Helper to compare arrays using isEqual(). */ function ot(t, e, n) {
    return t.length === e.length && t.every(((t, s) => n(t, e[s])));
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// The earliest date supported by Firestore timestamps (0001-01-01T00:00:00Z).
/**
 * A `Timestamp` represents a point in time independent of any time zone or
 * calendar, represented as seconds and fractions of seconds at nanosecond
 * resolution in UTC Epoch time.
 *
 * It is encoded using the Proleptic Gregorian Calendar which extends the
 * Gregorian calendar backwards to year one. It is encoded assuming all minutes
 * are 60 seconds long, i.e. leap seconds are "smeared" so that no leap second
 * table is needed for interpretation. Range is from 0001-01-01T00:00:00Z to
 * 9999-12-31T23:59:59.999999999Z.
 *
 * For examples and further specifications, refer to the
 * {@link https://github.com/google/protobuf/blob/master/src/google/protobuf/timestamp.proto | Timestamp definition}.
 */
class at {
    /**
     * Creates a new timestamp.
     *
     * @param seconds - The number of seconds of UTC time since Unix epoch
     *     1970-01-01T00:00:00Z. Must be from 0001-01-01T00:00:00Z to
     *     9999-12-31T23:59:59Z inclusive.
     * @param nanoseconds - The non-negative fractions of a second at nanosecond
     *     resolution. Negative second values with fractions must still have
     *     non-negative nanoseconds values that count forward in time. Must be
     *     from 0 to 999,999,999 inclusive.
     */
    constructor(
    /**
     * The number of seconds of UTC time since Unix epoch 1970-01-01T00:00:00Z.
     */
    t, 
    /**
     * The fractions of a second at nanosecond resolution.*
     */
    e) {
        if (this.seconds = t, this.nanoseconds = e, e < 0) throw new Q(j.INVALID_ARGUMENT, "Timestamp nanoseconds out of range: " + e);
        if (e >= 1e9) throw new Q(j.INVALID_ARGUMENT, "Timestamp nanoseconds out of range: " + e);
        if (t < -62135596800) throw new Q(j.INVALID_ARGUMENT, "Timestamp seconds out of range: " + t);
        // This will break in the year 10,000.
                if (t >= 253402300800) throw new Q(j.INVALID_ARGUMENT, "Timestamp seconds out of range: " + t);
    }
    /**
     * Creates a new timestamp with the current date, with millisecond precision.
     *
     * @returns a new timestamp representing the current date.
     */    static now() {
        return at.fromMillis(Date.now());
    }
    /**
     * Creates a new timestamp from the given date.
     *
     * @param date - The date to initialize the `Timestamp` from.
     * @returns A new `Timestamp` representing the same point in time as the given
     *     date.
     */    static fromDate(t) {
        return at.fromMillis(t.getTime());
    }
    /**
     * Creates a new timestamp from the given number of milliseconds.
     *
     * @param milliseconds - Number of milliseconds since Unix epoch
     *     1970-01-01T00:00:00Z.
     * @returns A new `Timestamp` representing the same point in time as the given
     *     number of milliseconds.
     */    static fromMillis(t) {
        const e = Math.floor(t / 1e3), n = Math.floor(1e6 * (t - 1e3 * e));
        return new at(e, n);
    }
    /**
     * Converts a `Timestamp` to a JavaScript `Date` object. This conversion
     * causes a loss of precision since `Date` objects only support millisecond
     * precision.
     *
     * @returns JavaScript `Date` object representing the same point in time as
     *     this `Timestamp`, with millisecond precision.
     */    toDate() {
        return new Date(this.toMillis());
    }
    /**
     * Converts a `Timestamp` to a numeric timestamp (in milliseconds since
     * epoch). This operation causes a loss of precision.
     *
     * @returns The point in time corresponding to this timestamp, represented as
     *     the number of milliseconds since Unix epoch 1970-01-01T00:00:00Z.
     */    toMillis() {
        return 1e3 * this.seconds + this.nanoseconds / 1e6;
    }
    _compareTo(t) {
        return this.seconds === t.seconds ? rt(this.nanoseconds, t.nanoseconds) : rt(this.seconds, t.seconds);
    }
    /**
     * Returns true if this `Timestamp` is equal to the provided one.
     *
     * @param other - The `Timestamp` to compare against.
     * @returns true if this `Timestamp` is equal to the provided one.
     */    isEqual(t) {
        return t.seconds === this.seconds && t.nanoseconds === this.nanoseconds;
    }
    /** Returns a textual representation of this `Timestamp`. */    toString() {
        return "Timestamp(seconds=" + this.seconds + ", nanoseconds=" + this.nanoseconds + ")";
    }
    /** Returns a JSON-serializable representation of this `Timestamp`. */    toJSON() {
        return {
            seconds: this.seconds,
            nanoseconds: this.nanoseconds
        };
    }
    /**
     * Converts this object to a primitive string, which allows `Timestamp` objects
     * to be compared using the `>`, `<=`, `>=` and `>` operators.
     */    valueOf() {
        // This method returns a string of the form <seconds>.<nanoseconds> where
        // <seconds> is translated to have a non-negative value and both <seconds>
        // and <nanoseconds> are left-padded with zeroes to be a consistent length.
        // Strings with this format then have a lexiographical ordering that matches
        // the expected ordering. The <seconds> translation is done to avoid having
        // a leading negative sign (i.e. a leading '-' character) in its string
        // representation, which would affect its lexiographical ordering.
        const t = this.seconds - -62135596800;
        // Note: Up to 12 decimal digits are required to represent all valid
        // 'seconds' values.
                return String(t).padStart(12, "0") + "." + String(this.nanoseconds).padStart(9, "0");
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A version of a document in Firestore. This corresponds to the version
 * timestamp, such as update_time or read_time.
 */ class ut {
    constructor(t) {
        this.timestamp = t;
    }
    static fromTimestamp(t) {
        return new ut(t);
    }
    static min() {
        return new ut(new at(0, 0));
    }
    compareTo(t) {
        return this.timestamp._compareTo(t.timestamp);
    }
    isEqual(t) {
        return this.timestamp.isEqual(t.timestamp);
    }
    /** Returns a number representation of the version for use in spec tests. */    toMicroseconds() {
        // Convert to microseconds.
        return 1e6 * this.timestamp.seconds + this.timestamp.nanoseconds / 1e3;
    }
    toString() {
        return "SnapshotVersion(" + this.timestamp.toString() + ")";
    }
    toTimestamp() {
        return this.timestamp;
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ function ht(t) {
    let e = 0;
    for (const n in t) Object.prototype.hasOwnProperty.call(t, n) && e++;
    return e;
}

function lt(t, e) {
    for (const n in t) Object.prototype.hasOwnProperty.call(t, n) && e(n, t[n]);
}

function ft(t) {
    for (const e in t) if (Object.prototype.hasOwnProperty.call(t, e)) return !1;
    return !0;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Path represents an ordered sequence of string segments.
 */
class dt {
    constructor(t, e, n) {
        void 0 === e ? e = 0 : e > t.length && B(), void 0 === n ? n = t.length - e : n > t.length - e && B(), 
        this.segments = t, this.offset = e, this.len = n;
    }
    get length() {
        return this.len;
    }
    isEqual(t) {
        return 0 === dt.comparator(this, t);
    }
    child(t) {
        const e = this.segments.slice(this.offset, this.limit());
        return t instanceof dt ? t.forEach((t => {
            e.push(t);
        })) : e.push(t), this.construct(e);
    }
    /** The index of one past the last segment of the path. */    limit() {
        return this.offset + this.length;
    }
    popFirst(t) {
        return t = void 0 === t ? 1 : t, this.construct(this.segments, this.offset + t, this.length - t);
    }
    popLast() {
        return this.construct(this.segments, this.offset, this.length - 1);
    }
    firstSegment() {
        return this.segments[this.offset];
    }
    lastSegment() {
        return this.get(this.length - 1);
    }
    get(t) {
        return this.segments[this.offset + t];
    }
    isEmpty() {
        return 0 === this.length;
    }
    isPrefixOf(t) {
        if (t.length < this.length) return !1;
        for (let e = 0; e < this.length; e++) if (this.get(e) !== t.get(e)) return !1;
        return !0;
    }
    isImmediateParentOf(t) {
        if (this.length + 1 !== t.length) return !1;
        for (let e = 0; e < this.length; e++) if (this.get(e) !== t.get(e)) return !1;
        return !0;
    }
    forEach(t) {
        for (let e = this.offset, n = this.limit(); e < n; e++) t(this.segments[e]);
    }
    toArray() {
        return this.segments.slice(this.offset, this.limit());
    }
    static comparator(t, e) {
        const n = Math.min(t.length, e.length);
        for (let s = 0; s < n; s++) {
            const n = t.get(s), i = e.get(s);
            if (n < i) return -1;
            if (n > i) return 1;
        }
        return t.length < e.length ? -1 : t.length > e.length ? 1 : 0;
    }
}

/**
 * A slash-separated path for navigating resources (documents and collections)
 * within Firestore.
 *
 * @internal
 */ class wt extends dt {
    construct(t, e, n) {
        return new wt(t, e, n);
    }
    canonicalString() {
        // NOTE: The client is ignorant of any path segments containing escape
        // sequences (e.g. __id123__) and just passes them through raw (they exist
        // for legacy reasons and should not be used frequently).
        return this.toArray().join("/");
    }
    toString() {
        return this.canonicalString();
    }
    /**
     * Creates a resource path from the given slash-delimited string. If multiple
     * arguments are provided, all components are combined. Leading and trailing
     * slashes from all components are ignored.
     */    static fromString(...t) {
        // NOTE: The client is ignorant of any path segments containing escape
        // sequences (e.g. __id123__) and just passes them through raw (they exist
        // for legacy reasons and should not be used frequently).
        const e = [];
        for (const n of t) {
            if (n.indexOf("//") >= 0) throw new Q(j.INVALID_ARGUMENT, `Invalid segment (${n}). Paths must not contain // in them.`);
            // Strip leading and traling slashed.
                        e.push(...n.split("/").filter((t => t.length > 0)));
        }
        return new wt(e);
    }
    static emptyPath() {
        return new wt([]);
    }
}

const _t = /^[_a-zA-Z][_a-zA-Z0-9]*$/;

/**
 * A dot-separated path for navigating sub-objects within a document.
 * @internal
 */ class mt extends dt {
    construct(t, e, n) {
        return new mt(t, e, n);
    }
    /**
     * Returns true if the string could be used as a segment in a field path
     * without escaping.
     */    static isValidIdentifier(t) {
        return _t.test(t);
    }
    canonicalString() {
        return this.toArray().map((t => (t = t.replace(/\\/g, "\\\\").replace(/`/g, "\\`"), 
        mt.isValidIdentifier(t) || (t = "`" + t + "`"), t))).join(".");
    }
    toString() {
        return this.canonicalString();
    }
    /**
     * Returns true if this field references the key of a document.
     */    isKeyField() {
        return 1 === this.length && "__name__" === this.get(0);
    }
    /**
     * The field designating the key of a document.
     */    static keyField() {
        return new mt([ "__name__" ]);
    }
    /**
     * Parses a field string from the given server-formatted string.
     *
     * - Splitting the empty string is not allowed (for now at least).
     * - Empty segments within the string (e.g. if there are two consecutive
     *   separators) are not allowed.
     *
     * TODO(b/37244157): we should make this more strict. Right now, it allows
     * non-identifier path components, even if they aren't escaped.
     */    static fromServerFormat(t) {
        const e = [];
        let n = "", s = 0;
        const i = () => {
            if (0 === n.length) throw new Q(j.INVALID_ARGUMENT, `Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);
            e.push(n), n = "";
        };
        let r = !1;
        for (;s < t.length; ) {
            const e = t[s];
            if ("\\" === e) {
                if (s + 1 === t.length) throw new Q(j.INVALID_ARGUMENT, "Path has trailing escape character: " + t);
                const e = t[s + 1];
                if ("\\" !== e && "." !== e && "`" !== e) throw new Q(j.INVALID_ARGUMENT, "Path has invalid escape sequence: " + t);
                n += e, s += 2;
            } else "`" === e ? (r = !r, s++) : "." !== e || r ? (n += e, s++) : (i(), s++);
        }
        if (i(), r) throw new Q(j.INVALID_ARGUMENT, "Unterminated ` in path: " + t);
        return new mt(e);
    }
    static emptyPath() {
        return new mt([]);
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Immutable class that represents a "proto" byte string.
 *
 * Proto byte strings can either be Base64-encoded strings or Uint8Arrays when
 * sent on the wire. This class abstracts away this differentiation by holding
 * the proto byte string in a common class that must be converted into a string
 * before being sent as a proto.
 * @internal
 */ class pt {
    constructor(t) {
        this.binaryString = t;
    }
    static fromBase64String(t) {
        const e = atob(t);
        return new pt(e);
    }
    static fromUint8Array(t) {
        const e = 
        /**
 * Helper function to convert an Uint8array to a binary string.
 */
        function(t) {
            let e = "";
            for (let n = 0; n < t.length; ++n) e += String.fromCharCode(t[n]);
            return e;
        }
        /**
 * Helper function to convert a binary string to an Uint8Array.
 */ (t);
        return new pt(e);
    }
    [Symbol.iterator]() {
        let t = 0;
        return {
            next: () => t < this.binaryString.length ? {
                value: this.binaryString.charCodeAt(t++),
                done: !1
            } : {
                value: void 0,
                done: !0
            }
        };
    }
    toBase64() {
        return t = this.binaryString, btoa(t);
        /** Converts a binary string to a Base64 encoded string. */
        var t;
    }
    toUint8Array() {
        return function(t) {
            const e = new Uint8Array(t.length);
            for (let n = 0; n < t.length; n++) e[n] = t.charCodeAt(n);
            return e;
        }
        /**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
        // A RegExp matching ISO 8601 UTC timestamps with optional fraction.
        (this.binaryString);
    }
    approximateByteSize() {
        return 2 * this.binaryString.length;
    }
    compareTo(t) {
        return rt(this.binaryString, t.binaryString);
    }
    isEqual(t) {
        return this.binaryString === t.binaryString;
    }
}

pt.EMPTY_BYTE_STRING = new pt("");

const Tt = new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);

/**
 * Converts the possible Proto values for a timestamp value into a "seconds and
 * nanos" representation.
 */ function Et(t) {
    // The json interface (for the browser) will return an iso timestamp string,
    // while the proto js library (for node) will return a
    // google.protobuf.Timestamp instance.
    if (U(!!t), "string" == typeof t) {
        // The date string can have higher precision (nanos) than the Date class
        // (millis), so we do some custom parsing here.
        // Parse the nanos right out of the string.
        let e = 0;
        const n = Tt.exec(t);
        if (U(!!n), n[1]) {
            // Pad the fraction out to 9 digits (nanos).
            let t = n[1];
            t = (t + "000000000").substr(0, 9), e = Number(t);
        }
        // Parse the date to get the seconds.
                const s = new Date(t);
        return {
            seconds: Math.floor(s.getTime() / 1e3),
            nanos: e
        };
    }
    return {
        seconds: It(t.seconds),
        nanos: It(t.nanos)
    };
}

/**
 * Converts the possible Proto types for numbers into a JavaScript number.
 * Returns 0 if the value is not numeric.
 */ function It(t) {
    // TODO(bjornick): Handle int64 greater than 53 bits.
    return "number" == typeof t ? t : "string" == typeof t ? Number(t) : 0;
}

/** Converts the possible Proto types for Blobs into a ByteString. */ function At(t) {
    return "string" == typeof t ? pt.fromBase64String(t) : pt.fromUint8Array(t);
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Represents a locally-applied ServerTimestamp.
 *
 * Server Timestamps are backed by MapValues that contain an internal field
 * `__type__` with a value of `server_timestamp`. The previous value and local
 * write time are stored in its `__previous_value__` and `__local_write_time__`
 * fields respectively.
 *
 * Notes:
 * - ServerTimestampValue instances are created as the result of applying a
 *   transform. They can only exist in the local view of a document. Therefore
 *   they do not need to be parsed or serialized.
 * - When evaluated locally (e.g. for snapshot.data()), they by default
 *   evaluate to `null`. This behavior can be configured by passing custom
 *   FieldValueOptions to value().
 * - With respect to other ServerTimestampValues, they sort by their
 *   localWriteTime.
 */ function Rt(t) {
    var e, n;
    return "server_timestamp" === (null === (n = ((null === (e = null == t ? void 0 : t.mapValue) || void 0 === e ? void 0 : e.fields) || {}).__type__) || void 0 === n ? void 0 : n.stringValue);
}

/**
 * Creates a new ServerTimestamp proto value (using the internal format).
 */
/**
 * Returns the value of the field before this ServerTimestamp was set.
 *
 * Preserving the previous values allows the user to display the last resoled
 * value until the backend responds with the timestamp.
 */
function bt(t) {
    const e = t.mapValue.fields.__previous_value__;
    return Rt(e) ? bt(e) : e;
}

/**
 * Returns the local time at which this timestamp was first set.
 */ function Pt(t) {
    const e = Et(t.mapValue.fields.__local_write_time__.timestampValue);
    return new at(e.seconds, e.nanos);
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** Sentinel value that sorts before any Mutation Batch ID. */
/**
 * Returns whether a variable is either undefined or null.
 */
function vt(t) {
    return null == t;
}

/** Returns whether the value represents -0. */ function Vt(t) {
    // Detect if the value is -0.0. Based on polyfill from
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
    return 0 === t && 1 / t == -1 / 0;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @internal
 */ class Dt {
    constructor(t) {
        this.path = t;
    }
    static fromPath(t) {
        return new Dt(wt.fromString(t));
    }
    static fromName(t) {
        return new Dt(wt.fromString(t).popFirst(5));
    }
    /** Returns true if the document is in the specified collectionId. */    hasCollectionId(t) {
        return this.path.length >= 2 && this.path.get(this.path.length - 2) === t;
    }
    isEqual(t) {
        return null !== t && 0 === wt.comparator(this.path, t.path);
    }
    toString() {
        return this.path.toString();
    }
    static comparator(t, e) {
        return wt.comparator(t.path, e.path);
    }
    static isDocumentKey(t) {
        return t.length % 2 == 0;
    }
    /**
     * Creates and returns a new document key with the given segments.
     *
     * @param segments - The segments of the path to the document
     * @returns A new instance of DocumentKey
     */    static fromSegments(t) {
        return new Dt(new wt(t.slice()));
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** Extracts the backend's type order for the provided value. */ function Ct(t) {
    return "nullValue" in t ? 0 /* NullValue */ : "booleanValue" in t ? 1 /* BooleanValue */ : "integerValue" in t || "doubleValue" in t ? 2 /* NumberValue */ : "timestampValue" in t ? 3 /* TimestampValue */ : "stringValue" in t ? 5 /* StringValue */ : "bytesValue" in t ? 6 /* BlobValue */ : "referenceValue" in t ? 7 /* RefValue */ : "geoPointValue" in t ? 8 /* GeoPointValue */ : "arrayValue" in t ? 9 /* ArrayValue */ : "mapValue" in t ? Rt(t) ? 4 /* ServerTimestampValue */ : 10 /* ObjectValue */ : B();
}

/** Tests `left` and `right` for equality based on the backend semantics. */ function Nt(t, e) {
    if (t === e) return !0;
    const n = Ct(t);
    if (n !== Ct(e)) return !1;
    switch (n) {
      case 0 /* NullValue */ :
        return !0;

      case 1 /* BooleanValue */ :
        return t.booleanValue === e.booleanValue;

      case 4 /* ServerTimestampValue */ :
        return Pt(t).isEqual(Pt(e));

      case 3 /* TimestampValue */ :
        return function(t, e) {
            if ("string" == typeof t.timestampValue && "string" == typeof e.timestampValue && t.timestampValue.length === e.timestampValue.length) 
            // Use string equality for ISO 8601 timestamps
            return t.timestampValue === e.timestampValue;
            const n = Et(t.timestampValue), s = Et(e.timestampValue);
            return n.seconds === s.seconds && n.nanos === s.nanos;
        }(t, e);

      case 5 /* StringValue */ :
        return t.stringValue === e.stringValue;

      case 6 /* BlobValue */ :
        return function(t, e) {
            return At(t.bytesValue).isEqual(At(e.bytesValue));
        }(t, e);

      case 7 /* RefValue */ :
        return t.referenceValue === e.referenceValue;

      case 8 /* GeoPointValue */ :
        return function(t, e) {
            return It(t.geoPointValue.latitude) === It(e.geoPointValue.latitude) && It(t.geoPointValue.longitude) === It(e.geoPointValue.longitude);
        }(t, e);

      case 2 /* NumberValue */ :
        return function(t, e) {
            if ("integerValue" in t && "integerValue" in e) return It(t.integerValue) === It(e.integerValue);
            if ("doubleValue" in t && "doubleValue" in e) {
                const n = It(t.doubleValue), s = It(e.doubleValue);
                return n === s ? Vt(n) === Vt(s) : isNaN(n) && isNaN(s);
            }
            return !1;
        }(t, e);

      case 9 /* ArrayValue */ :
        return ot(t.arrayValue.values || [], e.arrayValue.values || [], Nt);

      case 10 /* ObjectValue */ :
        return function(t, e) {
            const n = t.mapValue.fields || {}, s = e.mapValue.fields || {};
            if (ht(n) !== ht(s)) return !1;
            for (const t in n) if (n.hasOwnProperty(t) && (void 0 === s[t] || !Nt(n[t], s[t]))) return !1;
            return !0;
        }
        /** Returns true if the ArrayValue contains the specified element. */ (t, e);

      default:
        return B();
    }
}

function kt(t, e) {
    return void 0 !== (t.values || []).find((t => Nt(t, e)));
}

function xt(t, e) {
    if (t === e) return 0;
    const n = Ct(t), s = Ct(e);
    if (n !== s) return rt(n, s);
    switch (n) {
      case 0 /* NullValue */ :
        return 0;

      case 1 /* BooleanValue */ :
        return rt(t.booleanValue, e.booleanValue);

      case 2 /* NumberValue */ :
        return function(t, e) {
            const n = It(t.integerValue || t.doubleValue), s = It(e.integerValue || e.doubleValue);
            return n < s ? -1 : n > s ? 1 : n === s ? 0 : 
            // one or both are NaN.
            isNaN(n) ? isNaN(s) ? 0 : -1 : 1;
        }(t, e);

      case 3 /* TimestampValue */ :
        return $t(t.timestampValue, e.timestampValue);

      case 4 /* ServerTimestampValue */ :
        return $t(Pt(t), Pt(e));

      case 5 /* StringValue */ :
        return rt(t.stringValue, e.stringValue);

      case 6 /* BlobValue */ :
        return function(t, e) {
            const n = At(t), s = At(e);
            return n.compareTo(s);
        }(t.bytesValue, e.bytesValue);

      case 7 /* RefValue */ :
        return function(t, e) {
            const n = t.split("/"), s = e.split("/");
            for (let t = 0; t < n.length && t < s.length; t++) {
                const e = rt(n[t], s[t]);
                if (0 !== e) return e;
            }
            return rt(n.length, s.length);
        }(t.referenceValue, e.referenceValue);

      case 8 /* GeoPointValue */ :
        return function(t, e) {
            const n = rt(It(t.latitude), It(e.latitude));
            if (0 !== n) return n;
            return rt(It(t.longitude), It(e.longitude));
        }(t.geoPointValue, e.geoPointValue);

      case 9 /* ArrayValue */ :
        return function(t, e) {
            const n = t.values || [], s = e.values || [];
            for (let t = 0; t < n.length && t < s.length; ++t) {
                const e = xt(n[t], s[t]);
                if (e) return e;
            }
            return rt(n.length, s.length);
        }(t.arrayValue, e.arrayValue);

      case 10 /* ObjectValue */ :
        return function(t, e) {
            const n = t.fields || {}, s = Object.keys(n), i = e.fields || {}, r = Object.keys(i);
            // Even though MapValues are likely sorted correctly based on their insertion
            // order (e.g. when received from the backend), local modifications can bring
            // elements out of order. We need to re-sort the elements to ensure that
            // canonical IDs are independent of insertion order.
            s.sort(), r.sort();
            for (let t = 0; t < s.length && t < r.length; ++t) {
                const e = rt(s[t], r[t]);
                if (0 !== e) return e;
                const o = xt(n[s[t]], i[r[t]]);
                if (0 !== o) return o;
            }
            return rt(s.length, r.length);
        }
        /**
 * Generates the canonical ID for the provided field value (as used in Target
 * serialization).
 */ (t.mapValue, e.mapValue);

      default:
        throw B();
    }
}

function $t(t, e) {
    if ("string" == typeof t && "string" == typeof e && t.length === e.length) return rt(t, e);
    const n = Et(t), s = Et(e), i = rt(n.seconds, s.seconds);
    return 0 !== i ? i : rt(n.nanos, s.nanos);
}

function Ot(t) {
    return Mt(t);
}

function Mt(t) {
    return "nullValue" in t ? "null" : "booleanValue" in t ? "" + t.booleanValue : "integerValue" in t ? "" + t.integerValue : "doubleValue" in t ? "" + t.doubleValue : "timestampValue" in t ? function(t) {
        const e = Et(t);
        return `time(${e.seconds},${e.nanos})`;
    }(t.timestampValue) : "stringValue" in t ? t.stringValue : "bytesValue" in t ? At(t.bytesValue).toBase64() : "referenceValue" in t ? (n = t.referenceValue, 
    Dt.fromName(n).toString()) : "geoPointValue" in t ? `geo(${(e = t.geoPointValue).latitude},${e.longitude})` : "arrayValue" in t ? function(t) {
        let e = "[", n = !0;
        for (const s of t.values || []) n ? n = !1 : e += ",", e += Mt(s);
        return e + "]";
    }
    /** Returns a reference value for the provided database and key. */ (t.arrayValue) : "mapValue" in t ? function(t) {
        // Iteration order in JavaScript is not guaranteed. To ensure that we generate
        // matching canonical IDs for identical maps, we need to sort the keys.
        const e = Object.keys(t.fields || {}).sort();
        let n = "{", s = !0;
        for (const i of e) s ? s = !1 : n += ",", n += `${i}:${Mt(t.fields[i])}`;
        return n + "}";
    }(t.mapValue) : B();
    var e, n;
}

/** Returns true if `value` is an IntegerValue . */ function Lt(t) {
    return !!t && "integerValue" in t;
}

/** Returns true if `value` is a DoubleValue. */
/** Returns true if `value` is an ArrayValue. */
function Bt(t) {
    return !!t && "arrayValue" in t;
}

/** Returns true if `value` is a NullValue. */ function Ut(t) {
    return !!t && "nullValue" in t;
}

/** Returns true if `value` is NaN. */ function qt(t) {
    return !!t && "doubleValue" in t && isNaN(Number(t.doubleValue));
}

/** Returns true if `value` is a MapValue. */ function Kt(t) {
    return !!t && "mapValue" in t;
}

/** Creates a deep copy of `source`. */ function jt(t) {
    if (t.geoPointValue) return {
        geoPointValue: Object.assign({}, t.geoPointValue)
    };
    if (t.timestampValue && "object" == typeof t.timestampValue) return {
        timestampValue: Object.assign({}, t.timestampValue)
    };
    if (t.mapValue) {
        const e = {
            mapValue: {
                fields: {}
            }
        };
        return lt(t.mapValue.fields, ((t, n) => e.mapValue.fields[t] = jt(n))), e;
    }
    if (t.arrayValue) {
        const e = {
            arrayValue: {
                values: []
            }
        };
        for (let n = 0; n < (t.arrayValue.values || []).length; ++n) e.arrayValue.values[n] = jt(t.arrayValue.values[n]);
        return e;
    }
    return Object.assign({}, t);
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * An ObjectValue represents a MapValue in the Firestore Proto and offers the
 * ability to add and remove fields (via the ObjectValueBuilder).
 */ class Qt {
    constructor(t) {
        this.value = t;
    }
    static empty() {
        return new Qt({
            mapValue: {}
        });
    }
    /**
     * Returns the value at the given path or null.
     *
     * @param path - the path to search
     * @returns The value at the path or null if the path is not set.
     */    field(t) {
        if (t.isEmpty()) return this.value;
        {
            let e = this.value;
            for (let n = 0; n < t.length - 1; ++n) if (e = (e.mapValue.fields || {})[t.get(n)], 
            !Kt(e)) return null;
            return e = (e.mapValue.fields || {})[t.lastSegment()], e || null;
        }
    }
    /**
     * Sets the field to the provided value.
     *
     * @param path - The field path to set.
     * @param value - The value to set.
     */    set(t, e) {
        this.getFieldsMap(t.popLast())[t.lastSegment()] = jt(e);
    }
    /**
     * Sets the provided fields to the provided values.
     *
     * @param data - A map of fields to values (or null for deletes).
     */    setAll(t) {
        let e = mt.emptyPath(), n = {}, s = [];
        t.forEach(((t, i) => {
            if (!e.isImmediateParentOf(i)) {
                // Insert the accumulated changes at this parent location
                const t = this.getFieldsMap(e);
                this.applyChanges(t, n, s), n = {}, s = [], e = i.popLast();
            }
            t ? n[i.lastSegment()] = jt(t) : s.push(i.lastSegment());
        }));
        const i = this.getFieldsMap(e);
        this.applyChanges(i, n, s);
    }
    /**
     * Removes the field at the specified path. If there is no field at the
     * specified path, nothing is changed.
     *
     * @param path - The field path to remove.
     */    delete(t) {
        const e = this.field(t.popLast());
        Kt(e) && e.mapValue.fields && delete e.mapValue.fields[t.lastSegment()];
    }
    isEqual(t) {
        return Nt(this.value, t.value);
    }
    /**
     * Returns the map that contains the leaf element of `path`. If the parent
     * entry does not yet exist, or if it is not a map, a new map will be created.
     */    getFieldsMap(t) {
        let e = this.value;
        e.mapValue.fields || (e.mapValue = {
            fields: {}
        });
        for (let n = 0; n < t.length; ++n) {
            let s = e.mapValue.fields[t.get(n)];
            Kt(s) && s.mapValue.fields || (s = {
                mapValue: {
                    fields: {}
                }
            }, e.mapValue.fields[t.get(n)] = s), e = s;
        }
        return e.mapValue.fields;
    }
    /**
     * Modifies `fieldsMap` by adding, replacing or deleting the specified
     * entries.
     */    applyChanges(t, e, n) {
        lt(e, ((e, n) => t[e] = n));
        for (const e of n) delete t[e];
    }
    clone() {
        return new Qt(jt(this.value));
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Represents a document in Firestore with a key, version, data and whether it
 * has local mutations applied to it.
 *
 * Documents can transition between states via `convertToFoundDocument()`,
 * `convertToNoDocument()` and `convertToUnknownDocument()`. If a document does
 * not transition to one of these states even after all mutations have been
 * applied, `isValidDocument()` returns false and the document should be removed
 * from all views.
 */ class Gt {
    constructor(t, e, n, s, i) {
        this.key = t, this.documentType = e, this.version = n, this.data = s, this.documentState = i;
    }
    /**
     * Creates a document with no known version or data, but which can serve as
     * base document for mutations.
     */    static newInvalidDocument(t) {
        return new Gt(t, 0 /* INVALID */ , ut.min(), Qt.empty(), 0 /* SYNCED */);
    }
    /**
     * Creates a new document that is known to exist with the given data at the
     * given version.
     */    static newFoundDocument(t, e, n) {
        return new Gt(t, 1 /* FOUND_DOCUMENT */ , e, n, 0 /* SYNCED */);
    }
    /** Creates a new document that is known to not exist at the given version. */    static newNoDocument(t, e) {
        return new Gt(t, 2 /* NO_DOCUMENT */ , e, Qt.empty(), 0 /* SYNCED */);
    }
    /**
     * Creates a new document that is known to exist at the given version but
     * whose data is not known (e.g. a document that was updated without a known
     * base document).
     */    static newUnknownDocument(t, e) {
        return new Gt(t, 3 /* UNKNOWN_DOCUMENT */ , e, Qt.empty(), 2 /* HAS_COMMITTED_MUTATIONS */);
    }
    /**
     * Changes the document type to indicate that it exists and that its version
     * and data are known.
     */    convertToFoundDocument(t, e) {
        return this.version = t, this.documentType = 1 /* FOUND_DOCUMENT */ , this.data = e, 
        this.documentState = 0 /* SYNCED */ , this;
    }
    /**
     * Changes the document type to indicate that it doesn't exist at the given
     * version.
     */    convertToNoDocument(t) {
        return this.version = t, this.documentType = 2 /* NO_DOCUMENT */ , this.data = Qt.empty(), 
        this.documentState = 0 /* SYNCED */ , this;
    }
    /**
     * Changes the document type to indicate that it exists at a given version but
     * that its data is not known (e.g. a document that was updated without a known
     * base document).
     */    convertToUnknownDocument(t) {
        return this.version = t, this.documentType = 3 /* UNKNOWN_DOCUMENT */ , this.data = Qt.empty(), 
        this.documentState = 2 /* HAS_COMMITTED_MUTATIONS */ , this;
    }
    setHasCommittedMutations() {
        return this.documentState = 2 /* HAS_COMMITTED_MUTATIONS */ , this;
    }
    setHasLocalMutations() {
        return this.documentState = 1 /* HAS_LOCAL_MUTATIONS */ , this;
    }
    get hasLocalMutations() {
        return 1 /* HAS_LOCAL_MUTATIONS */ === this.documentState;
    }
    get hasCommittedMutations() {
        return 2 /* HAS_COMMITTED_MUTATIONS */ === this.documentState;
    }
    get hasPendingWrites() {
        return this.hasLocalMutations || this.hasCommittedMutations;
    }
    isValidDocument() {
        return 0 /* INVALID */ !== this.documentType;
    }
    isFoundDocument() {
        return 1 /* FOUND_DOCUMENT */ === this.documentType;
    }
    isNoDocument() {
        return 2 /* NO_DOCUMENT */ === this.documentType;
    }
    isUnknownDocument() {
        return 3 /* UNKNOWN_DOCUMENT */ === this.documentType;
    }
    isEqual(t) {
        return t instanceof Gt && this.key.isEqual(t.key) && this.version.isEqual(t.version) && this.documentType === t.documentType && this.documentState === t.documentState && this.data.isEqual(t.data);
    }
    mutableCopy() {
        return new Gt(this.key, this.documentType, this.version, this.data.clone(), this.documentState);
    }
    toString() {
        return `Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`;
    }
}

/**
 * Compares the value for field `field` in the provided documents. Throws if
 * the field does not exist in both documents.
 */
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Visible for testing
class zt {
    constructor(t, e = null, n = [], s = [], i = null, r = null, o = null) {
        this.path = t, this.collectionGroup = e, this.orderBy = n, this.filters = s, this.limit = i, 
        this.startAt = r, this.endAt = o, this.R = null;
    }
}

/**
 * Initializes a Target with a path and optional additional query constraints.
 * Path must currently be empty if this is a collection group query.
 *
 * NOTE: you should always construct `Target` from `Query.toTarget` instead of
 * using this factory method, because `Query` provides an implicit `orderBy`
 * property.
 */ function Ht(t, e = null, n = [], s = [], i = null, r = null, o = null) {
    return new zt(t, e, n, s, i, r, o);
}

function Jt(t) {
    const e = K(t);
    if (null === e.R) {
        let t = e.path.canonicalString();
        null !== e.collectionGroup && (t += "|cg:" + e.collectionGroup), t += "|f:", t += e.filters.map((t => ee(t))).join(","), 
        t += "|ob:", t += e.orderBy.map((t => function(t) {
            // TODO(b/29183165): Make this collision robust.
            return t.field.canonicalString() + t.dir;
        }(t))).join(","), vt(e.limit) || (t += "|l:", t += e.limit), e.startAt && (t += "|lb:", 
        t += le(e.startAt)), e.endAt && (t += "|ub:", t += le(e.endAt)), e.R = t;
    }
    return e.R;
}

function Yt(t) {
    let e = t.path.canonicalString();
    return null !== t.collectionGroup && (e += " collectionGroup=" + t.collectionGroup), 
    t.filters.length > 0 && (e += `, filters: [${t.filters.map((t => {
        return `${(e = t).field.canonicalString()} ${e.op} ${Ot(e.value)}`;
        /** Returns a debug description for `filter`. */
        var e;
        /** Filter that matches on key fields (i.e. '__name__'). */    })).join(", ")}]`), 
    vt(t.limit) || (e += ", limit: " + t.limit), t.orderBy.length > 0 && (e += `, orderBy: [${t.orderBy.map((t => function(t) {
        return `${t.field.canonicalString()} (${t.dir})`;
    }(t))).join(", ")}]`), t.startAt && (e += ", startAt: " + le(t.startAt)), t.endAt && (e += ", endAt: " + le(t.endAt)), 
    `Target(${e})`;
}

function Xt(t, e) {
    if (t.limit !== e.limit) return !1;
    if (t.orderBy.length !== e.orderBy.length) return !1;
    for (let n = 0; n < t.orderBy.length; n++) if (!de(t.orderBy[n], e.orderBy[n])) return !1;
    if (t.filters.length !== e.filters.length) return !1;
    for (let i = 0; i < t.filters.length; i++) if (n = t.filters[i], s = e.filters[i], 
    n.op !== s.op || !n.field.isEqual(s.field) || !Nt(n.value, s.value)) return !1;
    var n, s;
    return t.collectionGroup === e.collectionGroup && (!!t.path.isEqual(e.path) && (!!_e(t.startAt, e.startAt) && _e(t.endAt, e.endAt)));
}

function Zt(t) {
    return Dt.isDocumentKey(t.path) && null === t.collectionGroup && 0 === t.filters.length;
}

class te extends class {} {
    constructor(t, e, n) {
        super(), this.field = t, this.op = e, this.value = n;
    }
    /**
     * Creates a filter based on the provided arguments.
     */    static create(t, e, n) {
        return t.isKeyField() ? "in" /* IN */ === e || "not-in" /* NOT_IN */ === e ? this.P(t, e, n) : new ne(t, e, n) : "array-contains" /* ARRAY_CONTAINS */ === e ? new oe(t, n) : "in" /* IN */ === e ? new ce(t, n) : "not-in" /* NOT_IN */ === e ? new ae(t, n) : "array-contains-any" /* ARRAY_CONTAINS_ANY */ === e ? new ue(t, n) : new te(t, e, n);
    }
    static P(t, e, n) {
        return "in" /* IN */ === e ? new se(t, n) : new ie(t, n);
    }
    matches(t) {
        const e = t.data.field(this.field);
        // Types do not have to match in NOT_EQUAL filters.
                return "!=" /* NOT_EQUAL */ === this.op ? null !== e && this.v(xt(e, this.value)) : null !== e && Ct(this.value) === Ct(e) && this.v(xt(e, this.value));
        // Only compare types with matching backend order (such as double and int).
        }
    v(t) {
        switch (this.op) {
          case "<" /* LESS_THAN */ :
            return t < 0;

          case "<=" /* LESS_THAN_OR_EQUAL */ :
            return t <= 0;

          case "==" /* EQUAL */ :
            return 0 === t;

          case "!=" /* NOT_EQUAL */ :
            return 0 !== t;

          case ">" /* GREATER_THAN */ :
            return t > 0;

          case ">=" /* GREATER_THAN_OR_EQUAL */ :
            return t >= 0;

          default:
            return B();
        }
    }
    V() {
        return [ "<" /* LESS_THAN */ , "<=" /* LESS_THAN_OR_EQUAL */ , ">" /* GREATER_THAN */ , ">=" /* GREATER_THAN_OR_EQUAL */ , "!=" /* NOT_EQUAL */ , "not-in" /* NOT_IN */ ].indexOf(this.op) >= 0;
    }
}

function ee(t) {
    // TODO(b/29183165): Technically, this won't be unique if two values have
    // the same description, such as the int 3 and the string "3". So we should
    // add the types in here somehow, too.
    return t.field.canonicalString() + t.op.toString() + Ot(t.value);
}

class ne extends te {
    constructor(t, e, n) {
        super(t, e, n), this.key = Dt.fromName(n.referenceValue);
    }
    matches(t) {
        const e = Dt.comparator(t.key, this.key);
        return this.v(e);
    }
}

/** Filter that matches on key fields within an array. */ class se extends te {
    constructor(t, e) {
        super(t, "in" /* IN */ , e), this.keys = re("in" /* IN */ , e);
    }
    matches(t) {
        return this.keys.some((e => e.isEqual(t.key)));
    }
}

/** Filter that matches on key fields not present within an array. */ class ie extends te {
    constructor(t, e) {
        super(t, "not-in" /* NOT_IN */ , e), this.keys = re("not-in" /* NOT_IN */ , e);
    }
    matches(t) {
        return !this.keys.some((e => e.isEqual(t.key)));
    }
}

function re(t, e) {
    var n;
    return ((null === (n = e.arrayValue) || void 0 === n ? void 0 : n.values) || []).map((t => Dt.fromName(t.referenceValue)));
}

/** A Filter that implements the array-contains operator. */ class oe extends te {
    constructor(t, e) {
        super(t, "array-contains" /* ARRAY_CONTAINS */ , e);
    }
    matches(t) {
        const e = t.data.field(this.field);
        return Bt(e) && kt(e.arrayValue, this.value);
    }
}

/** A Filter that implements the IN operator. */ class ce extends te {
    constructor(t, e) {
        super(t, "in" /* IN */ , e);
    }
    matches(t) {
        const e = t.data.field(this.field);
        return null !== e && kt(this.value.arrayValue, e);
    }
}

/** A Filter that implements the not-in operator. */ class ae extends te {
    constructor(t, e) {
        super(t, "not-in" /* NOT_IN */ , e);
    }
    matches(t) {
        if (kt(this.value.arrayValue, {
            nullValue: "NULL_VALUE"
        })) return !1;
        const e = t.data.field(this.field);
        return null !== e && !kt(this.value.arrayValue, e);
    }
}

/** A Filter that implements the array-contains-any operator. */ class ue extends te {
    constructor(t, e) {
        super(t, "array-contains-any" /* ARRAY_CONTAINS_ANY */ , e);
    }
    matches(t) {
        const e = t.data.field(this.field);
        return !(!Bt(e) || !e.arrayValue.values) && e.arrayValue.values.some((t => kt(this.value.arrayValue, t)));
    }
}

/**
 * Represents a bound of a query.
 *
 * The bound is specified with the given components representing a position and
 * whether it's just before or just after the position (relative to whatever the
 * query order is).
 *
 * The position represents a logical index position for a query. It's a prefix
 * of values for the (potentially implicit) order by clauses of a query.
 *
 * Bound provides a function to determine whether a document comes before or
 * after a bound. This is influenced by whether the position is just before or
 * just after the provided values.
 */ class he {
    constructor(t, e) {
        this.position = t, this.before = e;
    }
}

function le(t) {
    // TODO(b/29183165): Make this collision robust.
    return `${t.before ? "b" : "a"}:${t.position.map((t => Ot(t))).join(",")}`;
}

/**
 * An ordering on a field, in some Direction. Direction defaults to ASCENDING.
 */ class fe {
    constructor(t, e = "asc" /* ASCENDING */) {
        this.field = t, this.dir = e;
    }
}

function de(t, e) {
    return t.dir === e.dir && t.field.isEqual(e.field);
}

/**
 * Returns true if a document sorts before a bound using the provided sort
 * order.
 */ function we(t, e, n) {
    let s = 0;
    for (let i = 0; i < t.position.length; i++) {
        const r = e[i], o = t.position[i];
        if (r.field.isKeyField()) s = Dt.comparator(Dt.fromName(o.referenceValue), n.key); else {
            s = xt(o, n.data.field(r.field));
        }
        if ("desc" /* DESCENDING */ === r.dir && (s *= -1), 0 !== s) break;
    }
    return t.before ? s <= 0 : s < 0;
}

function _e(t, e) {
    if (null === t) return null === e;
    if (null === e) return !1;
    if (t.before !== e.before || t.position.length !== e.position.length) return !1;
    for (let n = 0; n < t.position.length; n++) {
        if (!Nt(t.position[n], e.position[n])) return !1;
    }
    return !0;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Query encapsulates all the query attributes we support in the SDK. It can
 * be run against the LocalStore, as well as be converted to a `Target` to
 * query the RemoteStore results.
 *
 * Visible for testing.
 */ class me {
    /**
     * Initializes a Query with a path and optional additional query constraints.
     * Path must currently be empty if this is a collection group query.
     */
    constructor(t, e = null, n = [], s = [], i = null, r = "F" /* First */ , o = null, c = null) {
        this.path = t, this.collectionGroup = e, this.explicitOrderBy = n, this.filters = s, 
        this.limit = i, this.limitType = r, this.startAt = o, this.endAt = c, this.S = null, 
        // The corresponding `Target` of this `Query` instance.
        this.D = null, this.startAt, this.endAt;
    }
}

/** Creates a new Query instance with the options provided. */ function ge(t, e, n, s, i, r, o, c) {
    return new me(t, e, n, s, i, r, o, c);
}

/** Creates a new Query for a query that matches all documents at `path` */ function ye(t) {
    return new me(t);
}

/**
 * Helper to convert a collection group query into a collection query at a
 * specific path. This is used when executing collection group queries, since
 * we have to split the query into a set of collection queries at multiple
 * paths.
 */ function pe(t) {
    return !vt(t.limit) && "F" /* First */ === t.limitType;
}

function Te(t) {
    return !vt(t.limit) && "L" /* Last */ === t.limitType;
}

function Ee(t) {
    return t.explicitOrderBy.length > 0 ? t.explicitOrderBy[0].field : null;
}

function Ie(t) {
    for (const e of t.filters) if (e.V()) return e.field;
    return null;
}

/**
 * Checks if any of the provided Operators are included in the query and
 * returns the first one that is, or null if none are.
 */
/**
 * Returns whether the query matches a collection group rather than a specific
 * collection.
 */
function Ae(t) {
    return null !== t.collectionGroup;
}

/**
 * Returns the implicit order by constraint that is used to execute the Query,
 * which can be different from the order by constraints the user provided (e.g.
 * the SDK and backend always orders by `__name__`).
 */ function Re(t) {
    const e = K(t);
    if (null === e.S) {
        e.S = [];
        const t = Ie(e), n = Ee(e);
        if (null !== t && null === n) 
        // In order to implicitly add key ordering, we must also add the
        // inequality filter field for it to be a valid query.
        // Note that the default inequality field and key ordering is ascending.
        t.isKeyField() || e.S.push(new fe(t)), e.S.push(new fe(mt.keyField(), "asc" /* ASCENDING */)); else {
            let t = !1;
            for (const n of e.explicitOrderBy) e.S.push(n), n.field.isKeyField() && (t = !0);
            if (!t) {
                // The order of the implicit key ordering always matches the last
                // explicit order by
                const t = e.explicitOrderBy.length > 0 ? e.explicitOrderBy[e.explicitOrderBy.length - 1].dir : "asc" /* ASCENDING */;
                e.S.push(new fe(mt.keyField(), t));
            }
        }
    }
    return e.S;
}

/**
 * Converts this `Query` instance to it's corresponding `Target` representation.
 */ function be(t) {
    const e = K(t);
    if (!e.D) if ("F" /* First */ === e.limitType) e.D = Ht(e.path, e.collectionGroup, Re(e), e.filters, e.limit, e.startAt, e.endAt); else {
        // Flip the orderBy directions since we want the last results
        const t = [];
        for (const n of Re(e)) {
            const e = "desc" /* DESCENDING */ === n.dir ? "asc" /* ASCENDING */ : "desc" /* DESCENDING */;
            t.push(new fe(n.field, e));
        }
        // We need to swap the cursors to match the now-flipped query ordering.
                const n = e.endAt ? new he(e.endAt.position, !e.endAt.before) : null, s = e.startAt ? new he(e.startAt.position, !e.startAt.before) : null;
        // Now return as a LimitType.First query.
        e.D = Ht(e.path, e.collectionGroup, t, e.filters, e.limit, n, s);
    }
    return e.D;
}

function Pe(t, e, n) {
    return new me(t.path, t.collectionGroup, t.explicitOrderBy.slice(), t.filters.slice(), e, n, t.startAt, t.endAt);
}

function ve(t, e) {
    return Xt(be(t), be(e)) && t.limitType === e.limitType;
}

// TODO(b/29183165): This is used to get a unique string from a query to, for
// example, use as a dictionary key, but the implementation is subject to
// collisions. Make it collision-free.
function Ve(t) {
    return `${Jt(be(t))}|lt:${t.limitType}`;
}

function Se(t) {
    return `Query(target=${Yt(be(t))}; limitType=${t.limitType})`;
}

/** Returns whether `doc` matches the constraints of `query`. */ function De(t, e) {
    return e.isFoundDocument() && function(t, e) {
        const n = e.key.path;
        return null !== t.collectionGroup ? e.key.hasCollectionId(t.collectionGroup) && t.path.isPrefixOf(n) : Dt.isDocumentKey(t.path) ? t.path.isEqual(n) : t.path.isImmediateParentOf(n);
    }
    /**
 * A document must have a value for every ordering clause in order to show up
 * in the results.
 */ (t, e) && function(t, e) {
        for (const n of t.explicitOrderBy) 
        // order by key always matches
        if (!n.field.isKeyField() && null === e.data.field(n.field)) return !1;
        return !0;
    }(t, e) && function(t, e) {
        for (const n of t.filters) if (!n.matches(e)) return !1;
        return !0;
    }
    /** Makes sure a document is within the bounds, if provided. */ (t, e) && function(t, e) {
        if (t.startAt && !we(t.startAt, Re(t), e)) return !1;
        if (t.endAt && we(t.endAt, Re(t), e)) return !1;
        return !0;
    }
    /**
 * Returns a new comparator function that can be used to compare two documents
 * based on the Query's ordering constraint.
 */ (t, e);
}

function Ce(t) {
    return (e, n) => {
        let s = !1;
        for (const i of Re(t)) {
            const t = Ne(i, e, n);
            if (0 !== t) return t;
            s = s || i.field.isKeyField();
        }
        return 0;
    };
}

function Ne(t, e, n) {
    const s = t.field.isKeyField() ? Dt.comparator(e.key, n.key) : function(t, e, n) {
        const s = e.data.field(t), i = n.data.field(t);
        return null !== s && null !== i ? xt(s, i) : B();
    }(t.field, e, n);
    switch (t.dir) {
      case "asc" /* ASCENDING */ :
        return s;

      case "desc" /* DESCENDING */ :
        return -1 * s;

      default:
        return B();
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Returns an DoubleValue for `value` that is encoded based the serializer's
 * `useProto3Json` setting.
 */ function ke(t, e) {
    if (t.C) {
        if (isNaN(e)) return {
            doubleValue: "NaN"
        };
        if (e === 1 / 0) return {
            doubleValue: "Infinity"
        };
        if (e === -1 / 0) return {
            doubleValue: "-Infinity"
        };
    }
    return {
        doubleValue: Vt(e) ? "-0" : e
    };
}

/**
 * Returns an IntegerValue for `value`.
 */ function xe(t) {
    return {
        integerValue: "" + t
    };
}

/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** Used to represent a field transform on a mutation. */ class Oe {
    constructor() {
        // Make sure that the structural type of `TransformOperation` is unique.
        // See https://github.com/microsoft/TypeScript/issues/5451
        this._ = void 0;
    }
}

/**
 * Computes the local transform result against the provided `previousValue`,
 * optionally using the provided localWriteTime.
 */ function Me(t, e, n) {
    return t instanceof Be ? function(t, e) {
        const n = {
            fields: {
                __type__: {
                    stringValue: "server_timestamp"
                },
                __local_write_time__: {
                    timestampValue: {
                        seconds: t.seconds,
                        nanos: t.nanoseconds
                    }
                }
            }
        };
        return e && (n.fields.__previous_value__ = e), {
            mapValue: n
        };
    }(n, e) : t instanceof Ue ? qe(t, e) : t instanceof Ke ? je(t, e) : function(t, e) {
        // PORTING NOTE: Since JavaScript's integer arithmetic is limited to 53 bit
        // precision and resolves overflows by reducing precision, we do not
        // manually cap overflows at 2^63.
        const n = Le(t, e), s = We(n) + We(t.N);
        return Lt(n) && Lt(t.N) ? xe(s) : ke(t.k, s);
    }(t, e);
}

/**
 * Computes a final transform result after the transform has been acknowledged
 * by the server, potentially using the server-provided transformResult.
 */ function Fe(t, e, n) {
    // The server just sends null as the transform result for array operations,
    // so we have to calculate a result the same as we do for local
    // applications.
    return t instanceof Ue ? qe(t, e) : t instanceof Ke ? je(t, e) : n;
}

/**
 * If this transform operation is not idempotent, returns the base value to
 * persist for this transform. If a base value is returned, the transform
 * operation is always applied to this base value, even if document has
 * already been updated.
 *
 * Base values provide consistent behavior for non-idempotent transforms and
 * allow us to return the same latency-compensated value even if the backend
 * has already applied the transform operation. The base value is null for
 * idempotent transforms, as they can be re-played even if the backend has
 * already applied them.
 *
 * @returns a base value to store along with the mutation, or null for
 * idempotent transforms.
 */ function Le(t, e) {
    return t instanceof Qe ? Lt(n = e) || function(t) {
        return !!t && "doubleValue" in t;
    }
    /** Returns true if `value` is either an IntegerValue or a DoubleValue. */ (n) ? e : {
        integerValue: 0
    } : null;
    var n;
}

/** Transforms a value into a server-generated timestamp. */
class Be extends Oe {}

/** Transforms an array value via a union operation. */ class Ue extends Oe {
    constructor(t) {
        super(), this.elements = t;
    }
}

function qe(t, e) {
    const n = Ge(e);
    for (const e of t.elements) n.some((t => Nt(t, e))) || n.push(e);
    return {
        arrayValue: {
            values: n
        }
    };
}

/** Transforms an array value via a remove operation. */ class Ke extends Oe {
    constructor(t) {
        super(), this.elements = t;
    }
}

function je(t, e) {
    let n = Ge(e);
    for (const e of t.elements) n = n.filter((t => !Nt(t, e)));
    return {
        arrayValue: {
            values: n
        }
    };
}

/**
 * Implements the backend semantics for locally computed NUMERIC_ADD (increment)
 * transforms. Converts all field values to integers or doubles, but unlike the
 * backend does not cap integer values at 2^63. Instead, JavaScript number
 * arithmetic is used and precision loss can occur for values greater than 2^53.
 */ class Qe extends Oe {
    constructor(t, e) {
        super(), this.k = t, this.N = e;
    }
}

function We(t) {
    return It(t.integerValue || t.doubleValue);
}

function Ge(t) {
    return Bt(t) && t.arrayValue.values ? t.arrayValue.values.slice() : [];
}

function He(t, e) {
    return t.field.isEqual(e.field) && function(t, e) {
        return t instanceof Ue && e instanceof Ue || t instanceof Ke && e instanceof Ke ? ot(t.elements, e.elements, Nt) : t instanceof Qe && e instanceof Qe ? Nt(t.N, e.N) : t instanceof Be && e instanceof Be;
    }(t.transform, e.transform);
}

/** Returns true if the preconditions is valid for the given document. */ function Xe(t, e) {
    return void 0 !== t.updateTime ? e.isFoundDocument() && e.version.isEqual(t.updateTime) : void 0 === t.exists || t.exists === e.isFoundDocument();
}

/**
 * A mutation describes a self-contained change to a document. Mutations can
 * create, replace, delete, and update subsets of documents.
 *
 * Mutations not only act on the value of the document but also its version.
 *
 * For local mutations (mutations that haven't been committed yet), we preserve
 * the existing version for Set and Patch mutations. For Delete mutations, we
 * reset the version to 0.
 *
 * Here's the expected transition table.
 *
 * MUTATION           APPLIED TO            RESULTS IN
 *
 * SetMutation        Document(v3)          Document(v3)
 * SetMutation        NoDocument(v3)        Document(v0)
 * SetMutation        InvalidDocument(v0)   Document(v0)
 * PatchMutation      Document(v3)          Document(v3)
 * PatchMutation      NoDocument(v3)        NoDocument(v3)
 * PatchMutation      InvalidDocument(v0)   UnknownDocument(v3)
 * DeleteMutation     Document(v3)          NoDocument(v0)
 * DeleteMutation     NoDocument(v3)        NoDocument(v0)
 * DeleteMutation     InvalidDocument(v0)   NoDocument(v0)
 *
 * For acknowledged mutations, we use the updateTime of the WriteResponse as
 * the resulting version for Set and Patch mutations. As deletes have no
 * explicit update time, we use the commitTime of the WriteResponse for
 * Delete mutations.
 *
 * If a mutation is acknowledged by the backend but fails the precondition check
 * locally, we transition to an `UnknownDocument` and rely on Watch to send us
 * the updated version.
 *
 * Field transforms are used only with Patch and Set Mutations. We use the
 * `updateTransforms` message to store transforms, rather than the `transforms`s
 * messages.
 *
 * ## Subclassing Notes
 *
 * Every type of mutation needs to implement its own applyToRemoteDocument() and
 * applyToLocalView() to implement the actual behavior of applying the mutation
 * to some source document (see `setMutationApplyToRemoteDocument()` for an
 * example).
 */ class Ze {}

/**
 * Applies this mutation to the given document for the purposes of computing a
 * new remote document. If the input document doesn't match the expected state
 * (e.g. it is invalid or outdated), the document type may transition to
 * unknown.
 *
 * @param mutation - The mutation to apply.
 * @param document - The document to mutate. The input document can be an
 *     invalid document if the client has no knowledge of the pre-mutation state
 *     of the document.
 * @param mutationResult - The result of applying the mutation from the backend.
 */ function tn(t, e, n) {
    t instanceof on ? function(t, e, n) {
        // Unlike setMutationApplyToLocalView, if we're applying a mutation to a
        // remote document the server has accepted the mutation so the precondition
        // must have held.
        const s = t.value.clone(), i = un(t.fieldTransforms, e, n.transformResults);
        s.setAll(i), e.convertToFoundDocument(n.version, s).setHasCommittedMutations();
    }(t, e, n) : t instanceof cn ? function(t, e, n) {
        if (!Xe(t.precondition, e)) 
        // Since the mutation was not rejected, we know that the precondition
        // matched on the backend. We therefore must not have the expected version
        // of the document in our cache and convert to an UnknownDocument with a
        // known updateTime.
        return void e.convertToUnknownDocument(n.version);
        const s = un(t.fieldTransforms, e, n.transformResults), i = e.data;
        i.setAll(an(t)), i.setAll(s), e.convertToFoundDocument(n.version, i).setHasCommittedMutations();
    }(t, e, n) : function(t, e, n) {
        // Unlike applyToLocalView, if we're applying a mutation to a remote
        // document the server has accepted the mutation so the precondition must
        // have held.
        e.convertToNoDocument(n.version).setHasCommittedMutations();
    }(0, e, n);
}

/**
 * Applies this mutation to the given document for the purposes of computing
 * the new local view of a document. If the input document doesn't match the
 * expected state, the document is not modified.
 *
 * @param mutation - The mutation to apply.
 * @param document - The document to mutate. The input document can be an
 *     invalid document if the client has no knowledge of the pre-mutation state
 *     of the document.
 * @param localWriteTime - A timestamp indicating the local write time of the
 *     batch this mutation is a part of.
 */ function en(t, e, n) {
    t instanceof on ? function(t, e, n) {
        if (!Xe(t.precondition, e)) 
        // The mutation failed to apply (e.g. a document ID created with add()
        // caused a name collision).
        return;
        const s = t.value.clone(), i = hn(t.fieldTransforms, n, e);
        s.setAll(i), e.convertToFoundDocument(rn(e), s).setHasLocalMutations();
    }
    /**
 * A mutation that modifies fields of the document at the given key with the
 * given values. The values are applied through a field mask:
 *
 *  * When a field is in both the mask and the values, the corresponding field
 *    is updated.
 *  * When a field is in neither the mask nor the values, the corresponding
 *    field is unmodified.
 *  * When a field is in the mask but not in the values, the corresponding field
 *    is deleted.
 *  * When a field is not in the mask but is in the values, the values map is
 *    ignored.
 */ (t, e, n) : t instanceof cn ? function(t, e, n) {
        if (!Xe(t.precondition, e)) return;
        const s = hn(t.fieldTransforms, n, e), i = e.data;
        i.setAll(an(t)), i.setAll(s), e.convertToFoundDocument(rn(e), i).setHasLocalMutations();
    }
    /**
 * Returns a FieldPath/Value map with the content of the PatchMutation.
 */ (t, e, n) : function(t, e) {
        Xe(t.precondition, e) && 
        // We don't call `setHasLocalMutations()` since we want to be backwards
        // compatible with the existing SDK behavior.
        e.convertToNoDocument(ut.min());
    }
    /**
 * A mutation that verifies the existence of the document at the given key with
 * the provided precondition.
 *
 * The `verify` operation is only used in Transactions, and this class serves
 * primarily to facilitate serialization into protos.
 */ (t, e);
}

function sn(t, e) {
    return t.type === e.type && (!!t.key.isEqual(e.key) && (!!t.precondition.isEqual(e.precondition) && (!!function(t, e) {
        return void 0 === t && void 0 === e || !(!t || !e) && ot(t, e, ((t, e) => He(t, e)));
    }(t.fieldTransforms, e.fieldTransforms) && (0 /* Set */ === t.type ? t.value.isEqual(e.value) : 1 /* Patch */ !== t.type || t.data.isEqual(e.data) && t.fieldMask.isEqual(e.fieldMask)))));
}

/**
 * Returns the version from the given document for use as the result of a
 * mutation. Mutations are defined to return the version of the base document
 * only if it is an existing document. Deleted and unknown documents have a
 * post-mutation version of SnapshotVersion.min().
 */ function rn(t) {
    return t.isFoundDocument() ? t.version : ut.min();
}

/**
 * A mutation that creates or replaces the document at the given key with the
 * object value contents.
 */ class on extends Ze {
    constructor(t, e, n, s = []) {
        super(), this.key = t, this.value = e, this.precondition = n, this.fieldTransforms = s, 
        this.type = 0 /* Set */;
    }
}

class cn extends Ze {
    constructor(t, e, n, s, i = []) {
        super(), this.key = t, this.data = e, this.fieldMask = n, this.precondition = s, 
        this.fieldTransforms = i, this.type = 1 /* Patch */;
    }
}

function an(t) {
    const e = new Map;
    return t.fieldMask.fields.forEach((n => {
        if (!n.isEmpty()) {
            const s = t.data.field(n);
            e.set(n, s);
        }
    })), e;
}

/**
 * Creates a list of "transform results" (a transform result is a field value
 * representing the result of applying a transform) for use after a mutation
 * containing transforms has been acknowledged by the server.
 *
 * @param fieldTransforms - The field transforms to apply the result to.
 * @param mutableDocument - The current state of the document after applying all
 * previous mutations.
 * @param serverTransformResults - The transform results received by the server.
 * @returns The transform results list.
 */ function un(t, e, n) {
    const s = new Map;
    U(t.length === n.length);
    for (let i = 0; i < n.length; i++) {
        const r = t[i], o = r.transform, c = e.data.field(r.field);
        s.set(r.field, Fe(o, c, n[i]));
    }
    return s;
}

/**
 * Creates a list of "transform results" (a transform result is a field value
 * representing the result of applying a transform) for use when applying a
 * transform locally.
 *
 * @param fieldTransforms - The field transforms to apply the result to.
 * @param localWriteTime - The local time of the mutation (used to
 *     generate ServerTimestampValues).
 * @param mutableDocument - The current state of the document after applying all
 *     previous mutations.
 * @returns The transform results list.
 */ function hn(t, e, n) {
    const s = new Map;
    for (const i of t) {
        const t = i.transform, r = n.data.field(i.field);
        s.set(i.field, Me(t, r, e));
    }
    return s;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class dn {
    // TODO(b/33078163): just use simplest form of existence filter for now
    constructor(t) {
        this.count = t;
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Error Codes describing the different ways GRPC can fail. These are copied
 * directly from GRPC's sources here:
 *
 * https://github.com/grpc/grpc/blob/bceec94ea4fc5f0085d81235d8e1c06798dc341a/include/grpc%2B%2B/impl/codegen/status_code_enum.h
 *
 * Important! The names of these identifiers matter because the string forms
 * are used for reverse lookups from the webchannel stream. Do NOT change the
 * names of these identifiers or change this into a const enum.
 */ var wn, _n;

/**
 * Determines whether an error code represents a permanent error when received
 * in response to a write operation.
 *
 * Write operations must be handled specially because as of b/119437764, ABORTED
 * errors on the write stream should be retried too (even though ABORTED errors
 * are not generally retryable).
 *
 * Note that during the initial handshake on the write stream an ABORTED error
 * signals that we should discard our stream token (i.e. it is permanent). This
 * means a handshake error should be classified with isPermanentError, above.
 */
/**
 * Maps an error Code from GRPC status code number, like 0, 1, or 14. These
 * are not the same as HTTP status codes.
 *
 * @returns The Code equivalent to the given GRPC status code. Fails if there
 *     is no match.
 */
function gn(t) {
    if (void 0 === t) 
    // This shouldn't normally happen, but in certain error cases (like trying
    // to send invalid proto messages) we may get an error with no GRPC code.
    return M("GRPC error has no .code"), j.UNKNOWN;
    switch (t) {
      case wn.OK:
        return j.OK;

      case wn.CANCELLED:
        return j.CANCELLED;

      case wn.UNKNOWN:
        return j.UNKNOWN;

      case wn.DEADLINE_EXCEEDED:
        return j.DEADLINE_EXCEEDED;

      case wn.RESOURCE_EXHAUSTED:
        return j.RESOURCE_EXHAUSTED;

      case wn.INTERNAL:
        return j.INTERNAL;

      case wn.UNAVAILABLE:
        return j.UNAVAILABLE;

      case wn.UNAUTHENTICATED:
        return j.UNAUTHENTICATED;

      case wn.INVALID_ARGUMENT:
        return j.INVALID_ARGUMENT;

      case wn.NOT_FOUND:
        return j.NOT_FOUND;

      case wn.ALREADY_EXISTS:
        return j.ALREADY_EXISTS;

      case wn.PERMISSION_DENIED:
        return j.PERMISSION_DENIED;

      case wn.FAILED_PRECONDITION:
        return j.FAILED_PRECONDITION;

      case wn.ABORTED:
        return j.ABORTED;

      case wn.OUT_OF_RANGE:
        return j.OUT_OF_RANGE;

      case wn.UNIMPLEMENTED:
        return j.UNIMPLEMENTED;

      case wn.DATA_LOSS:
        return j.DATA_LOSS;

      default:
        return B();
    }
}

/**
 * Converts an HTTP response's error status to the equivalent error code.
 *
 * @param status - An HTTP error response status ("FAILED_PRECONDITION",
 * "UNKNOWN", etc.)
 * @returns The equivalent Code. Non-matching responses are mapped to
 *     Code.UNKNOWN.
 */ (_n = wn || (wn = {}))[_n.OK = 0] = "OK", _n[_n.CANCELLED = 1] = "CANCELLED", 
_n[_n.UNKNOWN = 2] = "UNKNOWN", _n[_n.INVALID_ARGUMENT = 3] = "INVALID_ARGUMENT", 
_n[_n.DEADLINE_EXCEEDED = 4] = "DEADLINE_EXCEEDED", _n[_n.NOT_FOUND = 5] = "NOT_FOUND", 
_n[_n.ALREADY_EXISTS = 6] = "ALREADY_EXISTS", _n[_n.PERMISSION_DENIED = 7] = "PERMISSION_DENIED", 
_n[_n.UNAUTHENTICATED = 16] = "UNAUTHENTICATED", _n[_n.RESOURCE_EXHAUSTED = 8] = "RESOURCE_EXHAUSTED", 
_n[_n.FAILED_PRECONDITION = 9] = "FAILED_PRECONDITION", _n[_n.ABORTED = 10] = "ABORTED", 
_n[_n.OUT_OF_RANGE = 11] = "OUT_OF_RANGE", _n[_n.UNIMPLEMENTED = 12] = "UNIMPLEMENTED", 
_n[_n.INTERNAL = 13] = "INTERNAL", _n[_n.UNAVAILABLE = 14] = "UNAVAILABLE", _n[_n.DATA_LOSS = 15] = "DATA_LOSS";

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// An immutable sorted map implementation, based on a Left-leaning Red-Black
// tree.
class yn {
    constructor(t, e) {
        this.comparator = t, this.root = e || Tn.EMPTY;
    }
    // Returns a copy of the map, with the specified key/value added or replaced.
    insert(t, e) {
        return new yn(this.comparator, this.root.insert(t, e, this.comparator).copy(null, null, Tn.BLACK, null, null));
    }
    // Returns a copy of the map, with the specified key removed.
    remove(t) {
        return new yn(this.comparator, this.root.remove(t, this.comparator).copy(null, null, Tn.BLACK, null, null));
    }
    // Returns the value of the node with the given key, or null.
    get(t) {
        let e = this.root;
        for (;!e.isEmpty(); ) {
            const n = this.comparator(t, e.key);
            if (0 === n) return e.value;
            n < 0 ? e = e.left : n > 0 && (e = e.right);
        }
        return null;
    }
    // Returns the index of the element in this sorted map, or -1 if it doesn't
    // exist.
    indexOf(t) {
        // Number of nodes that were pruned when descending right
        let e = 0, n = this.root;
        for (;!n.isEmpty(); ) {
            const s = this.comparator(t, n.key);
            if (0 === s) return e + n.left.size;
            s < 0 ? n = n.left : (
            // Count all nodes left of the node plus the node itself
            e += n.left.size + 1, n = n.right);
        }
        // Node not found
                return -1;
    }
    isEmpty() {
        return this.root.isEmpty();
    }
    // Returns the total number of nodes in the map.
    get size() {
        return this.root.size;
    }
    // Returns the minimum key in the map.
    minKey() {
        return this.root.minKey();
    }
    // Returns the maximum key in the map.
    maxKey() {
        return this.root.maxKey();
    }
    // Traverses the map in key order and calls the specified action function
    // for each key/value pair. If action returns true, traversal is aborted.
    // Returns the first truthy value returned by action, or the last falsey
    // value returned by action.
    inorderTraversal(t) {
        return this.root.inorderTraversal(t);
    }
    forEach(t) {
        this.inorderTraversal(((e, n) => (t(e, n), !1)));
    }
    toString() {
        const t = [];
        return this.inorderTraversal(((e, n) => (t.push(`${e}:${n}`), !1))), `{${t.join(", ")}}`;
    }
    // Traverses the map in reverse key order and calls the specified action
    // function for each key/value pair. If action returns true, traversal is
    // aborted.
    // Returns the first truthy value returned by action, or the last falsey
    // value returned by action.
    reverseTraversal(t) {
        return this.root.reverseTraversal(t);
    }
    // Returns an iterator over the SortedMap.
    getIterator() {
        return new pn(this.root, null, this.comparator, !1);
    }
    getIteratorFrom(t) {
        return new pn(this.root, t, this.comparator, !1);
    }
    getReverseIterator() {
        return new pn(this.root, null, this.comparator, !0);
    }
    getReverseIteratorFrom(t) {
        return new pn(this.root, t, this.comparator, !0);
    }
}

 // end SortedMap
// An iterator over an LLRBNode.
class pn {
    constructor(t, e, n, s) {
        this.isReverse = s, this.nodeStack = [];
        let i = 1;
        for (;!t.isEmpty(); ) if (i = e ? n(t.key, e) : 1, 
        // flip the comparison if we're going in reverse
        s && (i *= -1), i < 0) 
        // This node is less than our start key. ignore it
        t = this.isReverse ? t.left : t.right; else {
            if (0 === i) {
                // This node is exactly equal to our start key. Push it on the stack,
                // but stop iterating;
                this.nodeStack.push(t);
                break;
            }
            // This node is greater than our start key, add it to the stack and move
            // to the next one
            this.nodeStack.push(t), t = this.isReverse ? t.right : t.left;
        }
    }
    getNext() {
        let t = this.nodeStack.pop();
        const e = {
            key: t.key,
            value: t.value
        };
        if (this.isReverse) for (t = t.left; !t.isEmpty(); ) this.nodeStack.push(t), t = t.right; else for (t = t.right; !t.isEmpty(); ) this.nodeStack.push(t), 
        t = t.left;
        return e;
    }
    hasNext() {
        return this.nodeStack.length > 0;
    }
    peek() {
        if (0 === this.nodeStack.length) return null;
        const t = this.nodeStack[this.nodeStack.length - 1];
        return {
            key: t.key,
            value: t.value
        };
    }
}

 // end SortedMapIterator
// Represents a node in a Left-leaning Red-Black tree.
class Tn {
    constructor(t, e, n, s, i) {
        this.key = t, this.value = e, this.color = null != n ? n : Tn.RED, this.left = null != s ? s : Tn.EMPTY, 
        this.right = null != i ? i : Tn.EMPTY, this.size = this.left.size + 1 + this.right.size;
    }
    // Returns a copy of the current node, optionally replacing pieces of it.
    copy(t, e, n, s, i) {
        return new Tn(null != t ? t : this.key, null != e ? e : this.value, null != n ? n : this.color, null != s ? s : this.left, null != i ? i : this.right);
    }
    isEmpty() {
        return !1;
    }
    // Traverses the tree in key order and calls the specified action function
    // for each node. If action returns true, traversal is aborted.
    // Returns the first truthy value returned by action, or the last falsey
    // value returned by action.
    inorderTraversal(t) {
        return this.left.inorderTraversal(t) || t(this.key, this.value) || this.right.inorderTraversal(t);
    }
    // Traverses the tree in reverse key order and calls the specified action
    // function for each node. If action returns true, traversal is aborted.
    // Returns the first truthy value returned by action, or the last falsey
    // value returned by action.
    reverseTraversal(t) {
        return this.right.reverseTraversal(t) || t(this.key, this.value) || this.left.reverseTraversal(t);
    }
    // Returns the minimum node in the tree.
    min() {
        return this.left.isEmpty() ? this : this.left.min();
    }
    // Returns the maximum key in the tree.
    minKey() {
        return this.min().key;
    }
    // Returns the maximum key in the tree.
    maxKey() {
        return this.right.isEmpty() ? this.key : this.right.maxKey();
    }
    // Returns new tree, with the key/value added.
    insert(t, e, n) {
        let s = this;
        const i = n(t, s.key);
        return s = i < 0 ? s.copy(null, null, null, s.left.insert(t, e, n), null) : 0 === i ? s.copy(null, e, null, null, null) : s.copy(null, null, null, null, s.right.insert(t, e, n)), 
        s.fixUp();
    }
    removeMin() {
        if (this.left.isEmpty()) return Tn.EMPTY;
        let t = this;
        return t.left.isRed() || t.left.left.isRed() || (t = t.moveRedLeft()), t = t.copy(null, null, null, t.left.removeMin(), null), 
        t.fixUp();
    }
    // Returns new tree, with the specified item removed.
    remove(t, e) {
        let n, s = this;
        if (e(t, s.key) < 0) s.left.isEmpty() || s.left.isRed() || s.left.left.isRed() || (s = s.moveRedLeft()), 
        s = s.copy(null, null, null, s.left.remove(t, e), null); else {
            if (s.left.isRed() && (s = s.rotateRight()), s.right.isEmpty() || s.right.isRed() || s.right.left.isRed() || (s = s.moveRedRight()), 
            0 === e(t, s.key)) {
                if (s.right.isEmpty()) return Tn.EMPTY;
                n = s.right.min(), s = s.copy(n.key, n.value, null, null, s.right.removeMin());
            }
            s = s.copy(null, null, null, null, s.right.remove(t, e));
        }
        return s.fixUp();
    }
    isRed() {
        return this.color;
    }
    // Returns new tree after performing any needed rotations.
    fixUp() {
        let t = this;
        return t.right.isRed() && !t.left.isRed() && (t = t.rotateLeft()), t.left.isRed() && t.left.left.isRed() && (t = t.rotateRight()), 
        t.left.isRed() && t.right.isRed() && (t = t.colorFlip()), t;
    }
    moveRedLeft() {
        let t = this.colorFlip();
        return t.right.left.isRed() && (t = t.copy(null, null, null, null, t.right.rotateRight()), 
        t = t.rotateLeft(), t = t.colorFlip()), t;
    }
    moveRedRight() {
        let t = this.colorFlip();
        return t.left.left.isRed() && (t = t.rotateRight(), t = t.colorFlip()), t;
    }
    rotateLeft() {
        const t = this.copy(null, null, Tn.RED, null, this.right.left);
        return this.right.copy(null, null, this.color, t, null);
    }
    rotateRight() {
        const t = this.copy(null, null, Tn.RED, this.left.right, null);
        return this.left.copy(null, null, this.color, null, t);
    }
    colorFlip() {
        const t = this.left.copy(null, null, !this.left.color, null, null), e = this.right.copy(null, null, !this.right.color, null, null);
        return this.copy(null, null, !this.color, t, e);
    }
    // For testing.
    checkMaxDepth() {
        const t = this.check();
        return Math.pow(2, t) <= this.size + 1;
    }
    // In a balanced RB tree, the black-depth (number of black nodes) from root to
    // leaves is equal on both sides.  This function verifies that or asserts.
    check() {
        if (this.isRed() && this.left.isRed()) throw B();
        if (this.right.isRed()) throw B();
        const t = this.left.check();
        if (t !== this.right.check()) throw B();
        return t + (this.isRed() ? 0 : 1);
    }
}

 // end LLRBNode
// Empty node is shared between all LLRB trees.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Tn.EMPTY = null, Tn.RED = !0, Tn.BLACK = !1;

// end LLRBEmptyNode
Tn.EMPTY = new 
// Represents an empty node (a leaf node in the Red-Black Tree).
class {
    constructor() {
        this.size = 0;
    }
    get key() {
        throw B();
    }
    get value() {
        throw B();
    }
    get color() {
        throw B();
    }
    get left() {
        throw B();
    }
    get right() {
        throw B();
    }
    // Returns a copy of the current node.
    copy(t, e, n, s, i) {
        return this;
    }
    // Returns a copy of the tree, with the specified key/value added.
    insert(t, e, n) {
        return new Tn(t, e);
    }
    // Returns a copy of the tree, with the specified key removed.
    remove(t, e) {
        return this;
    }
    isEmpty() {
        return !0;
    }
    inorderTraversal(t) {
        return !1;
    }
    reverseTraversal(t) {
        return !1;
    }
    minKey() {
        return null;
    }
    maxKey() {
        return null;
    }
    isRed() {
        return !1;
    }
    // For testing.
    checkMaxDepth() {
        return !0;
    }
    check() {
        return 0;
    }
};

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * SortedSet is an immutable (copy-on-write) collection that holds elements
 * in order specified by the provided comparator.
 *
 * NOTE: if provided comparator returns 0 for two elements, we consider them to
 * be equal!
 */
class En {
    constructor(t) {
        this.comparator = t, this.data = new yn(this.comparator);
    }
    has(t) {
        return null !== this.data.get(t);
    }
    first() {
        return this.data.minKey();
    }
    last() {
        return this.data.maxKey();
    }
    get size() {
        return this.data.size;
    }
    indexOf(t) {
        return this.data.indexOf(t);
    }
    /** Iterates elements in order defined by "comparator" */    forEach(t) {
        this.data.inorderTraversal(((e, n) => (t(e), !1)));
    }
    /** Iterates over `elem`s such that: range[0] &lt;= elem &lt; range[1]. */    forEachInRange(t, e) {
        const n = this.data.getIteratorFrom(t[0]);
        for (;n.hasNext(); ) {
            const s = n.getNext();
            if (this.comparator(s.key, t[1]) >= 0) return;
            e(s.key);
        }
    }
    /**
     * Iterates over `elem`s such that: start &lt;= elem until false is returned.
     */    forEachWhile(t, e) {
        let n;
        for (n = void 0 !== e ? this.data.getIteratorFrom(e) : this.data.getIterator(); n.hasNext(); ) {
            if (!t(n.getNext().key)) return;
        }
    }
    /** Finds the least element greater than or equal to `elem`. */    firstAfterOrEqual(t) {
        const e = this.data.getIteratorFrom(t);
        return e.hasNext() ? e.getNext().key : null;
    }
    getIterator() {
        return new In(this.data.getIterator());
    }
    getIteratorFrom(t) {
        return new In(this.data.getIteratorFrom(t));
    }
    /** Inserts or updates an element */    add(t) {
        return this.copy(this.data.remove(t).insert(t, !0));
    }
    /** Deletes an element */    delete(t) {
        return this.has(t) ? this.copy(this.data.remove(t)) : this;
    }
    isEmpty() {
        return this.data.isEmpty();
    }
    unionWith(t) {
        let e = this;
        // Make sure `result` always refers to the larger one of the two sets.
                return e.size < t.size && (e = t, t = this), t.forEach((t => {
            e = e.add(t);
        })), e;
    }
    isEqual(t) {
        if (!(t instanceof En)) return !1;
        if (this.size !== t.size) return !1;
        const e = this.data.getIterator(), n = t.data.getIterator();
        for (;e.hasNext(); ) {
            const t = e.getNext().key, s = n.getNext().key;
            if (0 !== this.comparator(t, s)) return !1;
        }
        return !0;
    }
    toArray() {
        const t = [];
        return this.forEach((e => {
            t.push(e);
        })), t;
    }
    toString() {
        const t = [];
        return this.forEach((e => t.push(e))), "SortedSet(" + t.toString() + ")";
    }
    copy(t) {
        const e = new En(this.comparator);
        return e.data = t, e;
    }
}

class In {
    constructor(t) {
        this.iter = t;
    }
    getNext() {
        return this.iter.getNext().key;
    }
    hasNext() {
        return this.iter.hasNext();
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ const An = new yn(Dt.comparator);

function Rn() {
    return An;
}

const bn = new yn(Dt.comparator);

function Pn() {
    return bn;
}

new yn(Dt.comparator);

const Sn = new En(Dt.comparator);

function Dn(...t) {
    let e = Sn;
    for (const n of t) e = e.add(n);
    return e;
}

const Cn = new En(rt);

function Nn() {
    return Cn;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * An event from the RemoteStore. It is split into targetChanges (changes to the
 * state or the set of documents in our watched targets) and documentUpdates
 * (changes to the actual documents).
 */ class kn {
    constructor(
    /**
     * The snapshot version this event brings us up to, or MIN if not set.
     */
    t, 
    /**
     * A map from target to changes to the target. See TargetChange.
     */
    e, 
    /**
     * A set of targets that is known to be inconsistent. Listens for these
     * targets should be re-established without resume tokens.
     */
    n, 
    /**
     * A set of which documents have changed or been deleted, along with the
     * doc's new values (if not deleted).
     */
    s, 
    /**
     * A set of which document updates are due only to limbo resolution targets.
     */
    i) {
        this.snapshotVersion = t, this.targetChanges = e, this.targetMismatches = n, this.documentUpdates = s, 
        this.resolvedLimboDocuments = i;
    }
    /**
     * HACK: Views require RemoteEvents in order to determine whether the view is
     * CURRENT, but secondary tabs don't receive remote events. So this method is
     * used to create a synthesized RemoteEvent that can be used to apply a
     * CURRENT status change to a View, for queries executed in a different tab.
     */
    // PORTING NOTE: Multi-tab only
    static createSynthesizedRemoteEventForCurrentChange(t, e) {
        const n = new Map;
        return n.set(t, xn.createSynthesizedTargetChangeForCurrentChange(t, e)), new kn(ut.min(), n, Nn(), Rn(), Dn());
    }
}

/**
 * A TargetChange specifies the set of changes for a specific target as part of
 * a RemoteEvent. These changes track which documents are added, modified or
 * removed, as well as the target's resume token and whether the target is
 * marked CURRENT.
 * The actual changes *to* documents are not part of the TargetChange since
 * documents may be part of multiple targets.
 */ class xn {
    constructor(
    /**
     * An opaque, server-assigned token that allows watching a query to be resumed
     * after disconnecting without retransmitting all the data that matches the
     * query. The resume token essentially identifies a point in time from which
     * the server should resume sending results.
     */
    t, 
    /**
     * The "current" (synced) status of this target. Note that "current"
     * has special meaning in the RPC protocol that implies that a target is
     * both up-to-date and consistent with the rest of the watch stream.
     */
    e, 
    /**
     * The set of documents that were newly assigned to this target as part of
     * this remote event.
     */
    n, 
    /**
     * The set of documents that were already assigned to this target but received
     * an update during this remote event.
     */
    s, 
    /**
     * The set of documents that were removed from this target as part of this
     * remote event.
     */
    i) {
        this.resumeToken = t, this.current = e, this.addedDocuments = n, this.modifiedDocuments = s, 
        this.removedDocuments = i;
    }
    /**
     * This method is used to create a synthesized TargetChanges that can be used to
     * apply a CURRENT status change to a View (for queries executed in a different
     * tab) or for new queries (to raise snapshots with correct CURRENT status).
     */    static createSynthesizedTargetChangeForCurrentChange(t, e) {
        return new xn(pt.EMPTY_BYTE_STRING, e, Dn(), Dn(), Dn());
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Represents a changed document and a list of target ids to which this change
 * applies.
 *
 * If document has been deleted NoDocument will be provided.
 */ class $n {
    constructor(
    /** The new document applies to all of these targets. */
    t, 
    /** The new document is removed from all of these targets. */
    e, 
    /** The key of the document for this change. */
    n, 
    /**
     * The new document or NoDocument if it was deleted. Is null if the
     * document went out of view without the server sending a new document.
     */
    s) {
        this.$ = t, this.removedTargetIds = e, this.key = n, this.O = s;
    }
}

class On {
    constructor(t, e) {
        this.targetId = t, this.M = e;
    }
}

class Mn {
    constructor(
    /** What kind of change occurred to the watch target. */
    t, 
    /** The target IDs that were added/removed/set. */
    e, 
    /**
     * An opaque, server-assigned token that allows watching a target to be
     * resumed after disconnecting without retransmitting all the data that
     * matches the target. The resume token essentially identifies a point in
     * time from which the server should resume sending results.
     */
    n = pt.EMPTY_BYTE_STRING
    /** An RPC error indicating why the watch failed. */ , s = null) {
        this.state = t, this.targetIds = e, this.resumeToken = n, this.cause = s;
    }
}

/** Tracks the internal state of a Watch target. */ class Fn {
    constructor() {
        /**
         * The number of pending responses (adds or removes) that we are waiting on.
         * We only consider targets active that have no pending responses.
         */
        this.F = 0, 
        /**
         * Keeps track of the document changes since the last raised snapshot.
         *
         * These changes are continuously updated as we receive document updates and
         * always reflect the current set of changes against the last issued snapshot.
         */
        this.L = Un(), 
        /** See public getters for explanations of these fields. */
        this.B = pt.EMPTY_BYTE_STRING, this.U = !1, 
        /**
         * Whether this target state should be included in the next snapshot. We
         * initialize to true so that newly-added targets are included in the next
         * RemoteEvent.
         */
        this.q = !0;
    }
    /**
     * Whether this target has been marked 'current'.
     *
     * 'Current' has special meaning in the RPC protocol: It implies that the
     * Watch backend has sent us all changes up to the point at which the target
     * was added and that the target is consistent with the rest of the watch
     * stream.
     */    get current() {
        return this.U;
    }
    /** The last resume token sent to us for this target. */    get resumeToken() {
        return this.B;
    }
    /** Whether this target has pending target adds or target removes. */    get K() {
        return 0 !== this.F;
    }
    /** Whether we have modified any state that should trigger a snapshot. */    get j() {
        return this.q;
    }
    /**
     * Applies the resume token to the TargetChange, but only when it has a new
     * value. Empty resumeTokens are discarded.
     */    W(t) {
        t.approximateByteSize() > 0 && (this.q = !0, this.B = t);
    }
    /**
     * Creates a target change from the current set of changes.
     *
     * To reset the document changes after raising this snapshot, call
     * `clearPendingChanges()`.
     */    G() {
        let t = Dn(), e = Dn(), n = Dn();
        return this.L.forEach(((s, i) => {
            switch (i) {
              case 0 /* Added */ :
                t = t.add(s);
                break;

              case 2 /* Modified */ :
                e = e.add(s);
                break;

              case 1 /* Removed */ :
                n = n.add(s);
                break;

              default:
                B();
            }
        })), new xn(this.B, this.U, t, e, n);
    }
    /**
     * Resets the document changes and sets `hasPendingChanges` to false.
     */    H() {
        this.q = !1, this.L = Un();
    }
    J(t, e) {
        this.q = !0, this.L = this.L.insert(t, e);
    }
    Y(t) {
        this.q = !0, this.L = this.L.remove(t);
    }
    X() {
        this.F += 1;
    }
    Z() {
        this.F -= 1;
    }
    tt() {
        this.q = !0, this.U = !0;
    }
}

/**
 * A helper class to accumulate watch changes into a RemoteEvent.
 */
class Ln {
    constructor(t) {
        this.et = t, 
        /** The internal state of all tracked targets. */
        this.nt = new Map, 
        /** Keeps track of the documents to update since the last raised snapshot. */
        this.st = Rn(), 
        /** A mapping of document keys to their set of target IDs. */
        this.it = Bn(), 
        /**
         * A list of targets with existence filter mismatches. These targets are
         * known to be inconsistent and their listens needs to be re-established by
         * RemoteStore.
         */
        this.rt = new En(rt);
    }
    /**
     * Processes and adds the DocumentWatchChange to the current set of changes.
     */    ot(t) {
        for (const e of t.$) t.O && t.O.isFoundDocument() ? this.ct(e, t.O) : this.at(e, t.key, t.O);
        for (const e of t.removedTargetIds) this.at(e, t.key, t.O);
    }
    /** Processes and adds the WatchTargetChange to the current set of changes. */    ut(t) {
        this.forEachTarget(t, (e => {
            const n = this.ht(e);
            switch (t.state) {
              case 0 /* NoChange */ :
                this.lt(e) && n.W(t.resumeToken);
                break;

              case 1 /* Added */ :
                // We need to decrement the number of pending acks needed from watch
                // for this targetId.
                n.Z(), n.K || 
                // We have a freshly added target, so we need to reset any state
                // that we had previously. This can happen e.g. when remove and add
                // back a target for existence filter mismatches.
                n.H(), n.W(t.resumeToken);
                break;

              case 2 /* Removed */ :
                // We need to keep track of removed targets to we can post-filter and
                // remove any target changes.
                // We need to decrement the number of pending acks needed from watch
                // for this targetId.
                n.Z(), n.K || this.removeTarget(e);
                break;

              case 3 /* Current */ :
                this.lt(e) && (n.tt(), n.W(t.resumeToken));
                break;

              case 4 /* Reset */ :
                this.lt(e) && (
                // Reset the target and synthesizes removes for all existing
                // documents. The backend will re-add any documents that still
                // match the target before it sends the next global snapshot.
                this.ft(e), n.W(t.resumeToken));
                break;

              default:
                B();
            }
        }));
    }
    /**
     * Iterates over all targetIds that the watch change applies to: either the
     * targetIds explicitly listed in the change or the targetIds of all currently
     * active targets.
     */    forEachTarget(t, e) {
        t.targetIds.length > 0 ? t.targetIds.forEach(e) : this.nt.forEach(((t, n) => {
            this.lt(n) && e(n);
        }));
    }
    /**
     * Handles existence filters and synthesizes deletes for filter mismatches.
     * Targets that are invalidated by filter mismatches are added to
     * `pendingTargetResets`.
     */    dt(t) {
        const e = t.targetId, n = t.M.count, s = this.wt(e);
        if (s) {
            const t = s.target;
            if (Zt(t)) if (0 === n) {
                // The existence filter told us the document does not exist. We deduce
                // that this document does not exist and apply a deleted document to
                // our updates. Without applying this deleted document there might be
                // another query that will raise this document as part of a snapshot
                // until it is resolved, essentially exposing inconsistency between
                // queries.
                const n = new Dt(t.path);
                this.at(e, n, Gt.newNoDocument(n, ut.min()));
            } else U(1 === n); else {
                this._t(e) !== n && (
                // Existence filter mismatch: We reset the mapping and raise a new
                // snapshot with `isFromCache:true`.
                this.ft(e), this.rt = this.rt.add(e));
            }
        }
    }
    /**
     * Converts the currently accumulated state into a remote event at the
     * provided snapshot version. Resets the accumulated changes before returning.
     */    gt(t) {
        const e = new Map;
        this.nt.forEach(((n, s) => {
            const i = this.wt(s);
            if (i) {
                if (n.current && Zt(i.target)) {
                    // Document queries for document that don't exist can produce an empty
                    // result set. To update our local cache, we synthesize a document
                    // delete if we have not previously received the document. This
                    // resolves the limbo state of the document, removing it from
                    // limboDocumentRefs.
                    // TODO(dimond): Ideally we would have an explicit lookup target
                    // instead resulting in an explicit delete message and we could
                    // remove this special logic.
                    const e = new Dt(i.target.path);
                    null !== this.st.get(e) || this.yt(s, e) || this.at(s, e, Gt.newNoDocument(e, t));
                }
                n.j && (e.set(s, n.G()), n.H());
            }
        }));
        let n = Dn();
        // We extract the set of limbo-only document updates as the GC logic
        // special-cases documents that do not appear in the target cache.
        
        // TODO(gsoltis): Expand on this comment once GC is available in the JS
        // client.
                this.it.forEach(((t, e) => {
            let s = !0;
            e.forEachWhile((t => {
                const e = this.wt(t);
                return !e || 2 /* LimboResolution */ === e.purpose || (s = !1, !1);
            })), s && (n = n.add(t));
        }));
        const s = new kn(t, e, this.rt, this.st, n);
        return this.st = Rn(), this.it = Bn(), this.rt = new En(rt), s;
    }
    /**
     * Adds the provided document to the internal list of document updates and
     * its document key to the given target's mapping.
     */
    // Visible for testing.
    ct(t, e) {
        if (!this.lt(t)) return;
        const n = this.yt(t, e.key) ? 2 /* Modified */ : 0 /* Added */;
        this.ht(t).J(e.key, n), this.st = this.st.insert(e.key, e), this.it = this.it.insert(e.key, this.Tt(e.key).add(t));
    }
    /**
     * Removes the provided document from the target mapping. If the
     * document no longer matches the target, but the document's state is still
     * known (e.g. we know that the document was deleted or we received the change
     * that caused the filter mismatch), the new document can be provided
     * to update the remote document cache.
     */
    // Visible for testing.
    at(t, e, n) {
        if (!this.lt(t)) return;
        const s = this.ht(t);
        this.yt(t, e) ? s.J(e, 1 /* Removed */) : 
        // The document may have entered and left the target before we raised a
        // snapshot, so we can just ignore the change.
        s.Y(e), this.it = this.it.insert(e, this.Tt(e).delete(t)), n && (this.st = this.st.insert(e, n));
    }
    removeTarget(t) {
        this.nt.delete(t);
    }
    /**
     * Returns the current count of documents in the target. This includes both
     * the number of documents that the LocalStore considers to be part of the
     * target as well as any accumulated changes.
     */    _t(t) {
        const e = this.ht(t).G();
        return this.et.getRemoteKeysForTarget(t).size + e.addedDocuments.size - e.removedDocuments.size;
    }
    /**
     * Increment the number of acks needed from watch before we can consider the
     * server to be 'in-sync' with the client's active targets.
     */    X(t) {
        this.ht(t).X();
    }
    ht(t) {
        let e = this.nt.get(t);
        return e || (e = new Fn, this.nt.set(t, e)), e;
    }
    Tt(t) {
        let e = this.it.get(t);
        return e || (e = new En(rt), this.it = this.it.insert(t, e)), e;
    }
    /**
     * Verifies that the user is still interested in this target (by calling
     * `getTargetDataForTarget()`) and that we are not waiting for pending ADDs
     * from watch.
     */    lt(t) {
        const e = null !== this.wt(t);
        return e || O("WatchChangeAggregator", "Detected inactive target", t), e;
    }
    /**
     * Returns the TargetData for an active target (i.e. a target that the user
     * is still interested in that has no outstanding target change requests).
     */    wt(t) {
        const e = this.nt.get(t);
        return e && e.K ? null : this.et.Et(t);
    }
    /**
     * Resets the state of a Watch target to its initial state (e.g. sets
     * 'current' to false, clears the resume token and removes its target mapping
     * from all documents).
     */    ft(t) {
        this.nt.set(t, new Fn);
        this.et.getRemoteKeysForTarget(t).forEach((e => {
            this.at(t, e, /*updatedDocument=*/ null);
        }));
    }
    /**
     * Returns whether the LocalStore considers the document to be part of the
     * specified target.
     */    yt(t, e) {
        return this.et.getRemoteKeysForTarget(t).has(e);
    }
}

function Bn() {
    return new yn(Dt.comparator);
}

function Un() {
    return new yn(Dt.comparator);
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ const qn = (() => {
    const t = {
        asc: "ASCENDING",
        desc: "DESCENDING"
    };
    return t;
})(), Kn = (() => {
    const t = {
        "<": "LESS_THAN",
        "<=": "LESS_THAN_OR_EQUAL",
        ">": "GREATER_THAN",
        ">=": "GREATER_THAN_OR_EQUAL",
        "==": "EQUAL",
        "!=": "NOT_EQUAL",
        "array-contains": "ARRAY_CONTAINS",
        in: "IN",
        "not-in": "NOT_IN",
        "array-contains-any": "ARRAY_CONTAINS_ANY"
    };
    return t;
})();

/**
 * This class generates JsonObject values for the Datastore API suitable for
 * sending to either GRPC stub methods or via the JSON/HTTP REST API.
 *
 * The serializer supports both Protobuf.js and Proto3 JSON formats. By
 * setting `useProto3Json` to true, the serializer will use the Proto3 JSON
 * format.
 *
 * For a description of the Proto3 JSON format check
 * https://developers.google.com/protocol-buffers/docs/proto3#json
 *
 * TODO(klimt): We can remove the databaseId argument if we keep the full
 * resource name in documents.
 */
class jn {
    constructor(t, e) {
        this.databaseId = t, this.C = e;
    }
}

/**
 * Returns a value for a Date that's appropriate to put into a proto.
 */
function Qn(t, e) {
    if (t.C) {
        return `${new Date(1e3 * e.seconds).toISOString().replace(/\.\d*/, "").replace("Z", "")}.${("000000000" + e.nanoseconds).slice(-9)}Z`;
    }
    return {
        seconds: "" + e.seconds,
        nanos: e.nanoseconds
    };
}

/**
 * Returns a value for bytes that's appropriate to put in a proto.
 *
 * Visible for testing.
 */
function Wn(t, e) {
    return t.C ? e.toBase64() : e.toUint8Array();
}

function zn(t) {
    return U(!!t), ut.fromTimestamp(function(t) {
        const e = Et(t);
        return new at(e.seconds, e.nanos);
    }(t));
}

function Hn(t, e) {
    return function(t) {
        return new wt([ "projects", t.projectId, "databases", t.database ]);
    }(t).child("documents").child(e).canonicalString();
}

function Jn(t) {
    const e = wt.fromString(t);
    return U(Rs(e)), e;
}

function Xn(t, e) {
    const n = Jn(e);
    if (n.get(1) !== t.databaseId.projectId) throw new Q(j.INVALID_ARGUMENT, "Tried to deserialize key from different project: " + n.get(1) + " vs " + t.databaseId.projectId);
    if (n.get(3) !== t.databaseId.database) throw new Q(j.INVALID_ARGUMENT, "Tried to deserialize key from different database: " + n.get(3) + " vs " + t.databaseId.database);
    return new Dt(ns(n));
}

function Zn(t, e) {
    return Hn(t.databaseId, e);
}

function ts(t) {
    const e = Jn(t);
    // In v1beta1 queries for collections at the root did not have a trailing
    // "/documents". In v1 all resource paths contain "/documents". Preserve the
    // ability to read the v1beta1 form for compatibility with queries persisted
    // in the local target cache.
        return 4 === e.length ? wt.emptyPath() : ns(e);
}

function es(t) {
    return new wt([ "projects", t.databaseId.projectId, "databases", t.databaseId.database ]).canonicalString();
}

function ns(t) {
    return U(t.length > 4 && "documents" === t.get(4)), t.popFirst(5);
}

function os(t, e) {
    let n;
    if ("targetChange" in e) {
        e.targetChange;
        // proto3 default value is unset in JSON (undefined), so use 'NO_CHANGE'
        // if unset
        const s = function(t) {
            return "NO_CHANGE" === t ? 0 /* NoChange */ : "ADD" === t ? 1 /* Added */ : "REMOVE" === t ? 2 /* Removed */ : "CURRENT" === t ? 3 /* Current */ : "RESET" === t ? 4 /* Reset */ : B();
        }(e.targetChange.targetChangeType || "NO_CHANGE"), i = e.targetChange.targetIds || [], r = function(t, e) {
            return t.C ? (U(void 0 === e || "string" == typeof e), pt.fromBase64String(e || "")) : (U(void 0 === e || e instanceof Uint8Array), 
            pt.fromUint8Array(e || new Uint8Array));
        }(t, e.targetChange.resumeToken), o = e.targetChange.cause, c = o && function(t) {
            const e = void 0 === t.code ? j.UNKNOWN : gn(t.code);
            return new Q(e, t.message || "");
        }
        /**
 * Returns a value for a number (or null) that's appropriate to put into
 * a google.protobuf.Int32Value proto.
 * DO NOT USE THIS FOR ANYTHING ELSE.
 * This method cheats. It's typed as returning "number" because that's what
 * our generated proto interfaces say Int32Value must be. But GRPC actually
 * expects a { value: <number> } struct.
 */ (o);
        n = new Mn(s, i, r, c || null);
    } else if ("documentChange" in e) {
        e.documentChange;
        const s = e.documentChange;
        s.document, s.document.name, s.document.updateTime;
        const i = Xn(t, s.document.name), r = zn(s.document.updateTime), o = new Qt({
            mapValue: {
                fields: s.document.fields
            }
        }), c = Gt.newFoundDocument(i, r, o), a = s.targetIds || [], u = s.removedTargetIds || [];
        n = new $n(a, u, c.key, c);
    } else if ("documentDelete" in e) {
        e.documentDelete;
        const s = e.documentDelete;
        s.document;
        const i = Xn(t, s.document), r = s.readTime ? zn(s.readTime) : ut.min(), o = Gt.newNoDocument(i, r), c = s.removedTargetIds || [];
        n = new $n([], c, o.key, o);
    } else if ("documentRemove" in e) {
        e.documentRemove;
        const s = e.documentRemove;
        s.document;
        const i = Xn(t, s.document), r = s.removedTargetIds || [];
        n = new $n([], r, i, null);
    } else {
        if (!("filter" in e)) return B();
        {
            e.filter;
            const t = e.filter;
            t.targetId;
            const s = t.count || 0, i = new dn(s), r = t.targetId;
            n = new On(r, i);
        }
    }
    return n;
}

function hs(t, e) {
    return {
        documents: [ Zn(t, e.path) ]
    };
}

function ls(t, e) {
    // Dissect the path into parent, collectionId, and optional key filter.
    const n = {
        structuredQuery: {}
    }, s = e.path;
    null !== e.collectionGroup ? (n.parent = Zn(t, s), n.structuredQuery.from = [ {
        collectionId: e.collectionGroup,
        allDescendants: !0
    } ]) : (n.parent = Zn(t, s.popLast()), n.structuredQuery.from = [ {
        collectionId: s.lastSegment()
    } ]);
    const i = function(t) {
        if (0 === t.length) return;
        const e = t.map((t => 
        // visible for testing
        function(t) {
            if ("==" /* EQUAL */ === t.op) {
                if (qt(t.value)) return {
                    unaryFilter: {
                        field: ps(t.field),
                        op: "IS_NAN"
                    }
                };
                if (Ut(t.value)) return {
                    unaryFilter: {
                        field: ps(t.field),
                        op: "IS_NULL"
                    }
                };
            } else if ("!=" /* NOT_EQUAL */ === t.op) {
                if (qt(t.value)) return {
                    unaryFilter: {
                        field: ps(t.field),
                        op: "IS_NOT_NAN"
                    }
                };
                if (Ut(t.value)) return {
                    unaryFilter: {
                        field: ps(t.field),
                        op: "IS_NOT_NULL"
                    }
                };
            }
            return {
                fieldFilter: {
                    field: ps(t.field),
                    op: ys(t.op),
                    value: t.value
                }
            };
        }(t)));
        if (1 === e.length) return e[0];
        return {
            compositeFilter: {
                op: "AND",
                filters: e
            }
        };
    }(e.filters);
    i && (n.structuredQuery.where = i);
    const r = function(t) {
        if (0 === t.length) return;
        return t.map((t => 
        // visible for testing
        function(t) {
            return {
                field: ps(t.field),
                direction: gs(t.dir)
            };
        }(t)));
    }(e.orderBy);
    r && (n.structuredQuery.orderBy = r);
    const o = function(t, e) {
        return t.C || vt(e) ? e : {
            value: e
        };
    }
    /**
 * Returns a number (or null) from a google.protobuf.Int32Value proto.
 */ (t, e.limit);
    return null !== o && (n.structuredQuery.limit = o), e.startAt && (n.structuredQuery.startAt = _s(e.startAt)), 
    e.endAt && (n.structuredQuery.endAt = _s(e.endAt)), n;
}

function fs(t) {
    let e = ts(t.parent);
    const n = t.structuredQuery, s = n.from ? n.from.length : 0;
    let i = null;
    if (s > 0) {
        U(1 === s);
        const t = n.from[0];
        t.allDescendants ? i = t.collectionId : e = e.child(t.collectionId);
    }
    let r = [];
    n.where && (r = ws(n.where));
    let o = [];
    n.orderBy && (o = n.orderBy.map((t => function(t) {
        return new fe(Ts(t.field), 
        // visible for testing
        function(t) {
            switch (t) {
              case "ASCENDING":
                return "asc" /* ASCENDING */;

              case "DESCENDING":
                return "desc" /* DESCENDING */;

              default:
                return;
            }
        }
        // visible for testing
        (t.direction));
    }(t))));
    let c = null;
    n.limit && (c = function(t) {
        let e;
        return e = "object" == typeof t ? t.value : t, vt(e) ? null : e;
    }(n.limit));
    let a = null;
    n.startAt && (a = ms(n.startAt));
    let u = null;
    return n.endAt && (u = ms(n.endAt)), ge(e, i, o, r, c, "F" /* First */ , a, u);
}

function ds(t, e) {
    const n = function(t, e) {
        switch (e) {
          case 0 /* Listen */ :
            return null;

          case 1 /* ExistenceFilterMismatch */ :
            return "existence-filter-mismatch";

          case 2 /* LimboResolution */ :
            return "limbo-document";

          default:
            return B();
        }
    }(0, e.purpose);
    return null == n ? null : {
        "goog-listen-tags": n
    };
}

function ws(t) {
    return t ? void 0 !== t.unaryFilter ? [ Is(t) ] : void 0 !== t.fieldFilter ? [ Es(t) ] : void 0 !== t.compositeFilter ? t.compositeFilter.filters.map((t => ws(t))).reduce(((t, e) => t.concat(e))) : B() : [];
}

function _s(t) {
    return {
        before: t.before,
        values: t.position
    };
}

function ms(t) {
    const e = !!t.before, n = t.values || [];
    return new he(n, e);
}

// visible for testing
function gs(t) {
    return qn[t];
}

function ys(t) {
    return Kn[t];
}

function ps(t) {
    return {
        fieldPath: t.canonicalString()
    };
}

function Ts(t) {
    return mt.fromServerFormat(t.fieldPath);
}

function Es(t) {
    return te.create(Ts(t.fieldFilter.field), function(t) {
        switch (t) {
          case "EQUAL":
            return "==" /* EQUAL */;

          case "NOT_EQUAL":
            return "!=" /* NOT_EQUAL */;

          case "GREATER_THAN":
            return ">" /* GREATER_THAN */;

          case "GREATER_THAN_OR_EQUAL":
            return ">=" /* GREATER_THAN_OR_EQUAL */;

          case "LESS_THAN":
            return "<" /* LESS_THAN */;

          case "LESS_THAN_OR_EQUAL":
            return "<=" /* LESS_THAN_OR_EQUAL */;

          case "ARRAY_CONTAINS":
            return "array-contains" /* ARRAY_CONTAINS */;

          case "IN":
            return "in" /* IN */;

          case "NOT_IN":
            return "not-in" /* NOT_IN */;

          case "ARRAY_CONTAINS_ANY":
            return "array-contains-any" /* ARRAY_CONTAINS_ANY */;

          default:
            return B();
        }
    }(t.fieldFilter.op), t.fieldFilter.value);
}

function Is(t) {
    switch (t.unaryFilter.op) {
      case "IS_NAN":
        const e = Ts(t.unaryFilter.field);
        return te.create(e, "==" /* EQUAL */ , {
            doubleValue: NaN
        });

      case "IS_NULL":
        const n = Ts(t.unaryFilter.field);
        return te.create(n, "==" /* EQUAL */ , {
            nullValue: "NULL_VALUE"
        });

      case "IS_NOT_NAN":
        const s = Ts(t.unaryFilter.field);
        return te.create(s, "!=" /* NOT_EQUAL */ , {
            doubleValue: NaN
        });

      case "IS_NOT_NULL":
        const i = Ts(t.unaryFilter.field);
        return te.create(i, "!=" /* NOT_EQUAL */ , {
            nullValue: "NULL_VALUE"
        });

      default:
        return B();
    }
}

function Rs(t) {
    // Resource names have at least 4 components (project ID, database ID)
    return t.length >= 4 && "projects" === t.get(0) && "databases" === t.get(2);
}

// Visible for testing
const Ws = "The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";

// V2 is no longer usable (see comment at top of file)
// Visible for testing
/**
 * A base class representing a persistence transaction, encapsulating both the
 * transaction's sequence numbers as well as a list of onCommitted listeners.
 *
 * When you call Persistence.runTransaction(), it will create a transaction and
 * pass it to your callback. You then pass it to any method that operates
 * on persistence.
 */
class Gs {
    constructor() {
        this.onCommittedListeners = [];
    }
    addOnCommittedListener(t) {
        this.onCommittedListeners.push(t);
    }
    raiseOnCommittedEvent() {
        this.onCommittedListeners.forEach((t => t()));
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * PersistencePromise is essentially a re-implementation of Promise except
 * it has a .next() method instead of .then() and .next() and .catch() callbacks
 * are executed synchronously when a PersistencePromise resolves rather than
 * asynchronously (Promise implementations use setImmediate() or similar).
 *
 * This is necessary to interoperate with IndexedDB which will automatically
 * commit transactions if control is returned to the event loop without
 * synchronously initiating another operation on the transaction.
 *
 * NOTE: .then() and .catch() only allow a single consumer, unlike normal
 * Promises.
 */ class zs {
    constructor(t) {
        // NOTE: next/catchCallback will always point to our own wrapper functions,
        // not the user's raw next() or catch() callbacks.
        this.nextCallback = null, this.catchCallback = null, 
        // When the operation resolves, we'll set result or error and mark isDone.
        this.result = void 0, this.error = void 0, this.isDone = !1, 
        // Set to true when .then() or .catch() are called and prevents additional
        // chaining.
        this.callbackAttached = !1, t((t => {
            this.isDone = !0, this.result = t, this.nextCallback && 
            // value should be defined unless T is Void, but we can't express
            // that in the type system.
            this.nextCallback(t);
        }), (t => {
            this.isDone = !0, this.error = t, this.catchCallback && this.catchCallback(t);
        }));
    }
    catch(t) {
        return this.next(void 0, t);
    }
    next(t, e) {
        return this.callbackAttached && B(), this.callbackAttached = !0, this.isDone ? this.error ? this.wrapFailure(e, this.error) : this.wrapSuccess(t, this.result) : new zs(((n, s) => {
            this.nextCallback = e => {
                this.wrapSuccess(t, e).next(n, s);
            }, this.catchCallback = t => {
                this.wrapFailure(e, t).next(n, s);
            };
        }));
    }
    toPromise() {
        return new Promise(((t, e) => {
            this.next(t, e);
        }));
    }
    wrapUserFunction(t) {
        try {
            const e = t();
            return e instanceof zs ? e : zs.resolve(e);
        } catch (t) {
            return zs.reject(t);
        }
    }
    wrapSuccess(t, e) {
        return t ? this.wrapUserFunction((() => t(e))) : zs.resolve(e);
    }
    wrapFailure(t, e) {
        return t ? this.wrapUserFunction((() => t(e))) : zs.reject(e);
    }
    static resolve(t) {
        return new zs(((e, n) => {
            e(t);
        }));
    }
    static reject(t) {
        return new zs(((e, n) => {
            n(t);
        }));
    }
    static waitFor(
    // Accept all Promise types in waitFor().
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t) {
        return new zs(((e, n) => {
            let s = 0, i = 0, r = !1;
            t.forEach((t => {
                ++s, t.next((() => {
                    ++i, r && i === s && e();
                }), (t => n(t)));
            })), r = !0, i === s && e();
        }));
    }
    /**
     * Given an array of predicate functions that asynchronously evaluate to a
     * boolean, implements a short-circuiting `or` between the results. Predicates
     * will be evaluated until one of them returns `true`, then stop. The final
     * result will be whether any of them returned `true`.
     */    static or(t) {
        let e = zs.resolve(!1);
        for (const n of t) e = e.next((t => t ? zs.resolve(t) : n()));
        return e;
    }
    static forEach(t, e) {
        const n = [];
        return t.forEach(((t, s) => {
            n.push(e.call(this, t, s));
        })), this.waitFor(n);
    }
}

/** Verifies whether `e` is an IndexedDbTransactionError. */ function Zs(t) {
    // Use name equality, as instanceof checks on errors don't work with errors
    // that wrap other errors.
    return "IndexedDbTransactionError" === t.name;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A batch of mutations that will be sent as one unit to the backend.
 */ class oi {
    /**
     * @param batchId - The unique ID of this mutation batch.
     * @param localWriteTime - The original write time of this mutation.
     * @param baseMutations - Mutations that are used to populate the base
     * values when this mutation is applied locally. This can be used to locally
     * overwrite values that are persisted in the remote document cache. Base
     * mutations are never sent to the backend.
     * @param mutations - The user-provided mutations in this mutation batch.
     * User-provided mutations are applied both locally and remotely on the
     * backend.
     */
    constructor(t, e, n, s) {
        this.batchId = t, this.localWriteTime = e, this.baseMutations = n, this.mutations = s;
    }
    /**
     * Applies all the mutations in this MutationBatch to the specified document
     * to compute the state of the remote document
     *
     * @param document - The document to apply mutations to.
     * @param batchResult - The result of applying the MutationBatch to the
     * backend.
     */    applyToRemoteDocument(t, e) {
        const n = e.mutationResults;
        for (let e = 0; e < this.mutations.length; e++) {
            const s = this.mutations[e];
            if (s.key.isEqual(t.key)) {
                tn(s, t, n[e]);
            }
        }
    }
    /**
     * Computes the local view of a document given all the mutations in this
     * batch.
     *
     * @param document - The document to apply mutations to.
     */    applyToLocalView(t) {
        // First, apply the base state. This allows us to apply non-idempotent
        // transform against a consistent set of values.
        for (const e of this.baseMutations) e.key.isEqual(t.key) && en(e, t, this.localWriteTime);
        // Second, apply all user-provided mutations.
                for (const e of this.mutations) e.key.isEqual(t.key) && en(e, t, this.localWriteTime);
    }
    /**
     * Computes the local view for all provided documents given the mutations in
     * this batch.
     */    applyToLocalDocumentSet(t) {
        // TODO(mrschmidt): This implementation is O(n^2). If we apply the mutations
        // directly (as done in `applyToLocalView()`), we can reduce the complexity
        // to O(n).
        this.mutations.forEach((e => {
            const n = t.get(e.key), s = n;
            // TODO(mutabledocuments): This method should take a MutableDocumentMap
            // and we should remove this cast.
                        this.applyToLocalView(s), n.isValidDocument() || s.convertToNoDocument(ut.min());
        }));
    }
    keys() {
        return this.mutations.reduce(((t, e) => t.add(e.key)), Dn());
    }
    isEqual(t) {
        return this.batchId === t.batchId && ot(this.mutations, t.mutations, ((t, e) => sn(t, e))) && ot(this.baseMutations, t.baseMutations, ((t, e) => sn(t, e)));
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * An immutable set of metadata that the local store tracks for each target.
 */ class ai {
    constructor(
    /** The target being listened to. */
    t, 
    /**
     * The target ID to which the target corresponds; Assigned by the
     * LocalStore for user listens and by the SyncEngine for limbo watches.
     */
    e, 
    /** The purpose of the target. */
    n, 
    /**
     * The sequence number of the last transaction during which this target data
     * was modified.
     */
    s, 
    /** The latest snapshot version seen for this target. */
    i = ut.min()
    /**
     * The maximum snapshot version at which the associated view
     * contained no limbo documents.
     */ , r = ut.min()
    /**
     * An opaque, server-assigned token that allows watching a target to be
     * resumed after disconnecting without retransmitting all the data that
     * matches the target. The resume token essentially identifies a point in
     * time from which the server should resume sending results.
     */ , o = pt.EMPTY_BYTE_STRING) {
        this.target = t, this.targetId = e, this.purpose = n, this.sequenceNumber = s, this.snapshotVersion = i, 
        this.lastLimboFreeSnapshotVersion = r, this.resumeToken = o;
    }
    /** Creates a new target data instance with an updated sequence number. */    withSequenceNumber(t) {
        return new ai(this.target, this.targetId, this.purpose, t, this.snapshotVersion, this.lastLimboFreeSnapshotVersion, this.resumeToken);
    }
    /**
     * Creates a new target data instance with an updated resume token and
     * snapshot version.
     */    withResumeToken(t, e) {
        return new ai(this.target, this.targetId, this.purpose, this.sequenceNumber, e, this.lastLimboFreeSnapshotVersion, t);
    }
    /**
     * Creates a new target data instance with an updated last limbo free
     * snapshot version number.
     */    withLastLimboFreeSnapshotVersion(t) {
        return new ai(this.target, this.targetId, this.purpose, this.sequenceNumber, this.snapshotVersion, t, this.resumeToken);
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** Serializer for values stored in the LocalStore. */ class ui {
    constructor(t) {
        this.Gt = t;
    }
}

/**
 * A helper function for figuring out what kind of query has been stored.
 */
/**
 * Encodes a `BundledQuery` from bundle proto to a Query object.
 *
 * This reconstructs the original query used to build the bundle being loaded,
 * including features exists only in SDKs (for example: limit-to-last).
 */
function pi(t) {
    const e = fs({
        parent: t.parent,
        structuredQuery: t.structuredQuery
    });
    return "LAST" === t.limitType ? Pe(e, e.limit, "L" /* Last */) : e;
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * An in-memory implementation of IndexManager.
 */ class Ai {
    constructor() {
        this.zt = new Ri;
    }
    addToCollectionParentIndex(t, e) {
        return this.zt.add(e), zs.resolve();
    }
    getCollectionParents(t, e) {
        return zs.resolve(this.zt.getEntries(e));
    }
}

/**
 * Internal implementation of the collection-parent index exposed by MemoryIndexManager.
 * Also used for in-memory caching by IndexedDbIndexManager and initial index population
 * in indexeddb_schema.ts
 */ class Ri {
    constructor() {
        this.index = {};
    }
    // Returns false if the entry already existed.
    add(t) {
        const e = t.lastSegment(), n = t.popLast(), s = this.index[e] || new En(wt.comparator), i = !s.has(n);
        return this.index[e] = s.add(n), i;
    }
    has(t) {
        const e = t.lastSegment(), n = t.popLast(), s = this.index[e];
        return s && s.has(n);
    }
    getEntries(t) {
        return (this.index[t] || new En(wt.comparator)).toArray();
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/** Offset to ensure non-overlapping target ids. */
/**
 * Generates monotonically increasing target IDs for sending targets to the
 * watch stream.
 *
 * The client constructs two generators, one for the target cache, and one for
 * for the sync engine (to generate limbo documents targets). These
 * generators produce non-overlapping IDs (by using even and odd IDs
 * respectively).
 *
 * By separating the target ID space, the query cache can generate target IDs
 * that persist across client restarts, while sync engine can independently
 * generate in-memory target IDs that are transient and can be reused after a
 * restart.
 */
class Oi {
    constructor(t) {
        this.se = t;
    }
    next() {
        return this.se += 2, this.se;
    }
    static ie() {
        // The target cache generator must return '2' in its first call to `next()`
        // as there is no differentiation in the protocol layer between an unset
        // number and the number '0'. If we were to sent a target with target ID
        // '0', the backend would consider it unset and replace it with its own ID.
        return new Oi(0);
    }
    static re() {
        // Sync engine assigns target IDs for limbo document detection.
        return new Oi(-1);
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Verifies the error thrown by a LocalStore operation. If a LocalStore
 * operation fails because the primary lease has been taken by another client,
 * we ignore the error (the persistence layer will immediately call
 * `applyPrimaryLease` to propagate the primary state change). All other errors
 * are re-thrown.
 *
 * @param err - An error returned by a LocalStore operation.
 * @returns A Promise that resolves after we recovered, or the original error.
 */ async function Ui(t) {
    if (t.code !== j.FAILED_PRECONDITION || t.message !== Ws) throw t;
    O("LocalStore", "Unexpectedly lost primary lease");
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A map implementation that uses objects as keys. Objects must have an
 * associated equals function and must be immutable. Entries in the map are
 * stored together with the key being produced from the mapKeyFn. This map
 * automatically handles collisions of keys.
 */ class zi {
    constructor(t, e) {
        this.mapKeyFn = t, this.equalsFn = e, 
        /**
         * The inner map for a key/value pair. Due to the possibility of collisions we
         * keep a list of entries that we do a linear search through to find an actual
         * match. Note that collisions should be rare, so we still expect near
         * constant time lookups in practice.
         */
        this.inner = {};
    }
    /** Get a value for this key, or undefined if it does not exist. */    get(t) {
        const e = this.mapKeyFn(t), n = this.inner[e];
        if (void 0 !== n) for (const [e, s] of n) if (this.equalsFn(e, t)) return s;
    }
    has(t) {
        return void 0 !== this.get(t);
    }
    /** Put this key and value in the map. */    set(t, e) {
        const n = this.mapKeyFn(t), s = this.inner[n];
        if (void 0 !== s) {
            for (let n = 0; n < s.length; n++) if (this.equalsFn(s[n][0], t)) return void (s[n] = [ t, e ]);
            s.push([ t, e ]);
        } else this.inner[n] = [ [ t, e ] ];
    }
    /**
     * Remove this key from the map. Returns a boolean if anything was deleted.
     */    delete(t) {
        const e = this.mapKeyFn(t), n = this.inner[e];
        if (void 0 === n) return !1;
        for (let s = 0; s < n.length; s++) if (this.equalsFn(n[s][0], t)) return 1 === n.length ? delete this.inner[e] : n.splice(s, 1), 
        !0;
        return !1;
    }
    forEach(t) {
        lt(this.inner, ((e, n) => {
            for (const [e, s] of n) t(e, s);
        }));
    }
    isEmpty() {
        return ft(this.inner);
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * An in-memory buffer of entries to be written to a RemoteDocumentCache.
 * It can be used to batch up a set of changes to be written to the cache, but
 * additionally supports reading entries back with the `getEntry()` method,
 * falling back to the underlying RemoteDocumentCache if no entry is
 * buffered.
 *
 * Entries added to the cache *must* be read first. This is to facilitate
 * calculating the size delta of the pending changes.
 *
 * PORTING NOTE: This class was implemented then removed from other platforms.
 * If byte-counting ends up being needed on the other platforms, consider
 * porting this class as part of that implementation work.
 */ class Hi {
    constructor() {
        // A mapping of document key to the new cache entry that should be written (or null if any
        // existing cache entry should be removed).
        this.changes = new zi((t => t.toString()), ((t, e) => t.isEqual(e))), this.changesApplied = !1;
    }
    getReadTime(t) {
        const e = this.changes.get(t);
        return e ? e.readTime : ut.min();
    }
    /**
     * Buffers a `RemoteDocumentCache.addEntry()` call.
     *
     * You can only modify documents that have already been retrieved via
     * `getEntry()/getEntries()` (enforced via IndexedDbs `apply()`).
     */    addEntry(t, e) {
        this.assertNotApplied(), this.changes.set(t.key, {
            document: t,
            readTime: e
        });
    }
    /**
     * Buffers a `RemoteDocumentCache.removeEntry()` call.
     *
     * You can only remove documents that have already been retrieved via
     * `getEntry()/getEntries()` (enforced via IndexedDbs `apply()`).
     */    removeEntry(t, e = null) {
        this.assertNotApplied(), this.changes.set(t, {
            document: Gt.newInvalidDocument(t),
            readTime: e
        });
    }
    /**
     * Looks up an entry in the cache. The buffered changes will first be checked,
     * and if no buffered change applies, this will forward to
     * `RemoteDocumentCache.getEntry()`.
     *
     * @param transaction - The transaction in which to perform any persistence
     *     operations.
     * @param documentKey - The key of the entry to look up.
     * @returns The cached document or an invalid document if we have nothing
     * cached.
     */    getEntry(t, e) {
        this.assertNotApplied();
        const n = this.changes.get(e);
        return void 0 !== n ? zs.resolve(n.document) : this.getFromCache(t, e);
    }
    /**
     * Looks up several entries in the cache, forwarding to
     * `RemoteDocumentCache.getEntry()`.
     *
     * @param transaction - The transaction in which to perform any persistence
     *     operations.
     * @param documentKeys - The keys of the entries to look up.
     * @returns A map of cached documents, indexed by key. If an entry cannot be
     *     found, the corresponding key will be mapped to an invalid document.
     */    getEntries(t, e) {
        return this.getAllFromCache(t, e);
    }
    /**
     * Applies buffered changes to the underlying RemoteDocumentCache, using
     * the provided transaction.
     */    apply(t) {
        return this.assertNotApplied(), this.changesApplied = !0, this.applyChanges(t);
    }
    /** Helper to assert this.changes is not null  */    assertNotApplied() {}
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A readonly view of the local state of all documents we're tracking (i.e. we
 * have a cached version in remoteDocumentCache or local mutations for the
 * document). The view is computed by applying the mutations in the
 * MutationQueue to the RemoteDocumentCache.
 */ class ur {
    constructor(t, e, n) {
        this.Je = t, this.An = e, this.Jt = n;
    }
    /**
     * Get the local view of the document identified by `key`.
     *
     * @returns Local view of the document or null if we don't have any cached
     * state for it.
     */    Rn(t, e) {
        return this.An.getAllMutationBatchesAffectingDocumentKey(t, e).next((n => this.bn(t, e, n)));
    }
    /** Internal version of `getDocument` that allows reusing batches. */    bn(t, e, n) {
        return this.Je.getEntry(t, e).next((t => {
            for (const e of n) e.applyToLocalView(t);
            return t;
        }));
    }
    // Returns the view of the given `docs` as they would appear after applying
    // all mutations in the given `batches`.
    Pn(t, e) {
        t.forEach(((t, n) => {
            for (const t of e) t.applyToLocalView(n);
        }));
    }
    /**
     * Gets the local view of the documents identified by `keys`.
     *
     * If we don't have cached state for a document in `keys`, a NoDocument will
     * be stored for that key in the resulting set.
     */    vn(t, e) {
        return this.Je.getEntries(t, e).next((e => this.Vn(t, e).next((() => e))));
    }
    /**
     * Applies the local view the given `baseDocs` without retrieving documents
     * from the local store.
     */    Vn(t, e) {
        return this.An.getAllMutationBatchesAffectingDocumentKeys(t, e).next((t => this.Pn(e, t)));
    }
    /**
     * Performs a query against the local view of all documents.
     *
     * @param transaction - The persistence transaction.
     * @param query - The query to match documents against.
     * @param sinceReadTime - If not set to SnapshotVersion.min(), return only
     *     documents that have been read since this snapshot version (exclusive).
     */    getDocumentsMatchingQuery(t, e, n) {
        /**
 * Returns whether the query matches a single document by path (rather than a
 * collection).
 */
        return function(t) {
            return Dt.isDocumentKey(t.path) && null === t.collectionGroup && 0 === t.filters.length;
        }(e) ? this.Sn(t, e.path) : Ae(e) ? this.Dn(t, e, n) : this.Cn(t, e, n);
    }
    Sn(t, e) {
        // Just do a simple document lookup.
        return this.Rn(t, new Dt(e)).next((t => {
            let e = Pn();
            return t.isFoundDocument() && (e = e.insert(t.key, t)), e;
        }));
    }
    Dn(t, e, n) {
        const s = e.collectionGroup;
        let i = Pn();
        return this.Jt.getCollectionParents(t, s).next((r => zs.forEach(r, (r => {
            const o = function(t, e) {
                return new me(e, 
                /*collectionGroup=*/ null, t.explicitOrderBy.slice(), t.filters.slice(), t.limit, t.limitType, t.startAt, t.endAt);
            }
            /**
 * Returns true if this query does not specify any query constraints that
 * could remove results.
 */ (e, r.child(s));
            return this.Cn(t, o, n).next((t => {
                t.forEach(((t, e) => {
                    i = i.insert(t, e);
                }));
            }));
        })).next((() => i))));
    }
    Cn(t, e, n) {
        // Query the remote documents and overlay mutations.
        let s, i;
        return this.Je.getDocumentsMatchingQuery(t, e, n).next((n => (s = n, this.An.getAllMutationBatchesAffectingQuery(t, e)))).next((e => (i = e, 
        this.Nn(t, i, s).next((t => {
            s = t;
            for (const t of i) for (const e of t.mutations) {
                const n = e.key;
                let i = s.get(n);
                null == i && (
                // Create invalid document to apply mutations on top of
                i = Gt.newInvalidDocument(n), s = s.insert(n, i)), en(e, i, t.localWriteTime), i.isFoundDocument() || (s = s.remove(n));
            }
        }))))).next((() => (
        // Finally, filter out any documents that don't actually match
        // the query.
        s.forEach(((t, n) => {
            De(e, n) || (s = s.remove(t));
        })), s)));
    }
    Nn(t, e, n) {
        let s = Dn();
        for (const t of e) for (const e of t.mutations) e instanceof cn && null === n.get(e.key) && (s = s.add(e.key));
        let i = n;
        return this.Je.getEntries(t, s).next((t => (t.forEach(((t, e) => {
            e.isFoundDocument() && (i = i.insert(t, e));
        })), i)));
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A set of changes to what documents are currently in view and out of view for
 * a given query. These changes are sent to the LocalStore by the View (via
 * the SyncEngine) and are used to pin / unpin documents as appropriate.
 */ class hr {
    constructor(t, e, n, s) {
        this.targetId = t, this.fromCache = e, this.kn = n, this.xn = s;
    }
    static $n(t, e) {
        let n = Dn(), s = Dn();
        for (const t of e.docChanges) switch (t.type) {
          case 0 /* Added */ :
            n = n.add(t.doc.key);
            break;

          case 1 /* Removed */ :
            s = s.add(t.doc.key);
 // do nothing
                }
        return new hr(t, e.fromCache, n, s);
    }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A query engine that takes advantage of the target document mapping in the
 * QueryCache. Query execution is optimized by only reading the documents that
 * previously matched a query plus any documents that were edited after the
 * query was last listened to.
 *
 * There are some cases when this optimization is not guaranteed to produce
 * the same results as full collection scans. In these cases, query
 * processing falls back to full scans. These cases are:
 *
 * - Limit queries where a document that matched the query previously no longer
 *   matches the query.
 *
 * - Limit queries where a document edit may cause the document to sort below
 *   another document that is in the local cache.
 *
 * - Queries that have never been CURRENT or free of limbo documents.
 */ class lr {
    /** Sets the document view to query against. */
    On(t) {
        this.Mn = t;
    }
    /** Returns all local documents matching the specified query. */    getDocumentsMatchingQuery(t, e, n, s) {
        // Queries that match all documents don't benefit from using
        // key-based lookups. It is more efficient to scan all documents in a
        // collection, rather than to perform individual lookups.
        return function(t) {
            return 0 === t.filters.length && null === t.limit && null == t.startAt && null == t.endAt && (0 === t.explicitOrderBy.length || 1 === t.explicitOrderBy.length && t.explicitOrderBy[0].field.isKeyField());
        }(e) || n.isEqual(ut.min()) ? this.Fn(t, e) : this.Mn.vn(t, s).next((i => {
            const r = this.Ln(e, i);
            return (pe(e) || Te(e)) && this.Bn(e.limitType, r, s, n) ? this.Fn(t, e) : (x() <= LogLevel.DEBUG && O("QueryEngine", "Re-using previous result from %s to execute query: %s", n.toString(), Se(e)), 
            this.Mn.getDocumentsMatchingQuery(t, e, n).next((t => (
            // We merge `previousResults` into `updateResults`, since
            // `updateResults` is already a DocumentMap. If a document is
            // contained in both lists, then its contents are the same.
            r.forEach((e => {
                t = t.insert(e.key, e);
            })), t))));
        }));
        // Queries that have never seen a snapshot without limbo free documents
        // should also be run as a full collection scan.
        }
    /** Applies the query filter and sorting to the provided documents.  */    Ln(t, e) {
        // Sort the documents and re-apply the query filter since previously
        // matching documents do not necessarily still match the query.
        let n = new En(Ce(t));
        return e.forEach(((e, s) => {
            De(t, s) && (n = n.add(s));
        })), n;
    }
    /**
     * Determines if a limit query needs to be refilled from cache, making it
     * ineligible for index-free execution.
     *
     * @param sortedPreviousResults - The documents that matched the query when it
     * was last synchronized, sorted by the query's comparator.
     * @param remoteKeys - The document keys that matched the query at the last
     * snapshot.
     * @param limboFreeSnapshotVersion - The version of the snapshot when the
     * query was last synchronized.
     */    Bn(t, e, n, s) {
        // The query needs to be refilled if a previously matching document no
        // longer matches.
        if (n.size !== e.size) return !0;
        // Limit queries are not eligible for index-free query execution if there is
        // a potential that an older document from cache now sorts before a document
        // that was previously part of the limit. This, however, can only happen if
        // the document at the edge of the limit goes out of limit.
        // If a document that is not the limit boundary sorts differently,
        // the boundary of the limit itself did not change and documents from cache
        // will continue to be "rejected" by this boundary. Therefore, we can ignore
        // any modifications that don't affect the last document.
                const i = "F" /* First */ === t ? e.last() : e.first();
        return !!i && (i.hasPendingWrites || i.version.compareTo(s) > 0);
    }
    Fn(t, e) {
        return x() <= LogLevel.DEBUG && O("QueryEngine", "Using full collection scan to execute query:", Se(e)), 
        this.Mn.getDocumentsMatchingQuery(t, e, ut.min());
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Implements `LocalStore` interface.
 *
 * Note: some field defined in this class might have public access level, but
 * the class is not exported so they are only accessible from this module.
 * This is useful to implement optional features (like bundles) in free
 * functions, such that they are tree-shakeable.
 */
class fr {
    constructor(
    /** Manages our in-memory or durable persistence. */
    t, e, n, s) {
        this.persistence = t, this.Un = e, this.k = s, 
        /**
         * Maps a targetID to data about its target.
         *
         * PORTING NOTE: We are using an immutable data structure on Web to make re-runs
         * of `applyRemoteEvent()` idempotent.
         */
        this.qn = new yn(rt), 
        /** Maps a target to its targetID. */
        // TODO(wuandy): Evaluate if TargetId can be part of Target.
        this.Kn = new zi((t => Jt(t)), Xt), 
        /**
         * The read time of the last entry processed by `getNewDocumentChanges()`.
         *
         * PORTING NOTE: This is only used for multi-tab synchronization.
         */
        this.jn = ut.min(), this.An = t.getMutationQueue(n), this.Qn = t.getRemoteDocumentCache(), 
        this.He = t.getTargetCache(), this.Wn = new ur(this.Qn, this.An, this.persistence.getIndexManager()), 
        this.Ye = t.getBundleCache(), this.Un.On(this.Wn);
    }
    collectGarbage(t) {
        return this.persistence.runTransaction("Collect garbage", "readwrite-primary", (e => t.collect(e, this.qn)));
    }
}

function dr(
/** Manages our in-memory or durable persistence. */
t, e, n, s) {
    return new fr(t, e, n, s);
}

/**
 * Tells the LocalStore that the currently authenticated user has changed.
 *
 * In response the local store switches the mutation queue to the new user and
 * returns any resulting document changes.
 */
// PORTING NOTE: Android and iOS only return the documents affected by the
// change.
async function wr(t, e) {
    const n = K(t);
    let s = n.An, i = n.Wn;
    const r = await n.persistence.runTransaction("Handle user change", "readonly", (t => {
        // Swap out the mutation queue, grabbing the pending mutation batches
        // before and after.
        let r;
        return n.An.getAllMutationBatches(t).next((o => (r = o, s = n.persistence.getMutationQueue(e), 
        // Recreate our LocalDocumentsView using the new
        // MutationQueue.
        i = new ur(n.Qn, s, n.persistence.getIndexManager()), s.getAllMutationBatches(t)))).next((e => {
            const n = [], s = [];
            // Union the old/new changed keys.
            let o = Dn();
            for (const t of r) {
                n.push(t.batchId);
                for (const e of t.mutations) o = o.add(e.key);
            }
            for (const t of e) {
                s.push(t.batchId);
                for (const e of t.mutations) o = o.add(e.key);
            }
            // Return the set of all (potentially) changed documents and the list
            // of mutation batch IDs that were affected by change.
                        return i.vn(t, o).next((t => ({
                Gn: t,
                removedBatchIds: n,
                addedBatchIds: s
            })));
        }));
    }));
    return n.An = s, n.Wn = i, n.Un.On(n.Wn), r;
}

/**
 * Removes mutations from the MutationQueue for the specified batch;
 * LocalDocuments will be recalculated.
 *
 * @returns The resulting modified documents.
 */
/**
 * Returns the last consistent snapshot processed (used by the RemoteStore to
 * determine whether to buffer incoming snapshots from the backend).
 */
function mr(t) {
    const e = K(t);
    return e.persistence.runTransaction("Get last remote snapshot version", "readonly", (t => e.He.getLastRemoteSnapshotVersion(t)));
}

/**
 * Updates the "ground-state" (remote) documents. We assume that the remote
 * event reflects any write batches that have been acknowledged or rejected
 * (i.e. we do not re-apply local mutations to updates from this event).
 *
 * LocalDocuments are re-calculated if there are remaining mutations in the
 * queue.
 */ function gr(t, e) {
    const n = K(t), s = e.snapshotVersion;
    let i = n.qn;
    return n.persistence.runTransaction("Apply remote event", "readwrite-primary", (t => {
        const r = n.Qn.newChangeBuffer({
            trackRemovals: !0
        });
        // Reset newTargetDataByTargetMap in case this transaction gets re-run.
                i = n.qn;
        const o = [];
        e.targetChanges.forEach(((r, c) => {
            const a = i.get(c);
            if (!a) return;
            // Only update the remote keys if the target is still active. This
            // ensures that we can persist the updated target data along with
            // the updated assignment.
                        o.push(n.He.removeMatchingKeys(t, r.removedDocuments, c).next((() => n.He.addMatchingKeys(t, r.addedDocuments, c))));
            let u = a.withSequenceNumber(t.currentSequenceNumber);
            e.targetMismatches.has(c) ? u = u.withResumeToken(pt.EMPTY_BYTE_STRING, ut.min()).withLastLimboFreeSnapshotVersion(ut.min()) : r.resumeToken.approximateByteSize() > 0 && (u = u.withResumeToken(r.resumeToken, s)), 
            i = i.insert(c, u), 
            // Update the target data if there are target changes (or if
            // sufficient time has passed since the last update).
            /**
 * Returns true if the newTargetData should be persisted during an update of
 * an active target. TargetData should always be persisted when a target is
 * being released and should not call this function.
 *
 * While the target is active, TargetData updates can be omitted when nothing
 * about the target has changed except metadata like the resume token or
 * snapshot version. Occasionally it's worth the extra write to prevent these
 * values from getting too stale after a crash, but this doesn't have to be
 * too frequent.
 */
            function(t, e, n) {
                // Always persist target data if we don't already have a resume token.
                if (0 === t.resumeToken.approximateByteSize()) return !0;
                // Don't allow resume token changes to be buffered indefinitely. This
                // allows us to be reasonably up-to-date after a crash and avoids needing
                // to loop over all active queries on shutdown. Especially in the browser
                // we may not get time to do anything interesting while the current tab is
                // closing.
                                if (e.snapshotVersion.toMicroseconds() - t.snapshotVersion.toMicroseconds() >= 3e8) return !0;
                // Otherwise if the only thing that has changed about a target is its resume
                // token it's not worth persisting. Note that the RemoteStore keeps an
                // in-memory view of the currently active targets which includes the current
                // resume token, so stream failure or user changes will still use an
                // up-to-date resume token regardless of what we do here.
                                return n.addedDocuments.size + n.modifiedDocuments.size + n.removedDocuments.size > 0;
            }
            /**
 * Notifies local store of the changed views to locally pin documents.
 */ (a, u, r) && o.push(n.He.updateTargetData(t, u));
        }));
        let c = Rn();
        // HACK: The only reason we allow a null snapshot version is so that we
        // can synthesize remote events when we get permission denied errors while
        // trying to resolve the state of a locally cached document that is in
        // limbo.
        if (e.documentUpdates.forEach(((s, i) => {
            e.resolvedLimboDocuments.has(s) && o.push(n.persistence.referenceDelegate.updateLimboDocument(t, s));
        })), 
        // Each loop iteration only affects its "own" doc, so it's safe to get all the remote
        // documents in advance in a single call.
        o.push(yr(t, r, e.documentUpdates, s, void 0).next((t => {
            c = t;
        }))), !s.isEqual(ut.min())) {
            const e = n.He.getLastRemoteSnapshotVersion(t).next((e => n.He.setTargetsMetadata(t, t.currentSequenceNumber, s)));
            o.push(e);
        }
        return zs.waitFor(o).next((() => r.apply(t))).next((() => n.Wn.Vn(t, c))).next((() => c));
    })).then((t => (n.qn = i, t)));
}

/**
 * Populates document change buffer with documents from backend or a bundle.
 * Returns the document changes resulting from applying those documents.
 *
 * @param txn - Transaction to use to read existing documents from storage.
 * @param documentBuffer - Document buffer to collect the resulted changes to be
 *        applied to storage.
 * @param documents - Documents to be applied.
 * @param globalVersion - A `SnapshotVersion` representing the read time if all
 *        documents have the same read time.
 * @param documentVersions - A DocumentKey-to-SnapshotVersion map if documents
 *        have their own read time.
 *
 * Note: this function will use `documentVersions` if it is defined;
 * when it is not defined, resorts to `globalVersion`.
 */ function yr(t, e, n, s, 
// TODO(wuandy): We could add `readTime` to MaybeDocument instead to remove
// this parameter.
i) {
    let r = Dn();
    return n.forEach((t => r = r.add(t))), e.getEntries(t, r).next((t => {
        let r = Rn();
        return n.forEach(((n, o) => {
            const c = t.get(n), a = (null == i ? void 0 : i.get(n)) || s;
            // Note: The order of the steps below is important, since we want
            // to ensure that rejected limbo resolutions (which fabricate
            // NoDocuments with SnapshotVersion.min()) never add documents to
            // cache.
            o.isNoDocument() && o.version.isEqual(ut.min()) ? (
            // NoDocuments with SnapshotVersion.min() are used in manufactured
            // events. We remove these documents from cache since we lost
            // access.
            e.removeEntry(n, a), r = r.insert(n, o)) : !c.isValidDocument() || o.version.compareTo(c.version) > 0 || 0 === o.version.compareTo(c.version) && c.hasPendingWrites ? (e.addEntry(o, a), 
            r = r.insert(n, o)) : O("LocalStore", "Ignoring outdated watch update for ", n, ". Current version:", c.version, " Watch version:", o.version);
        })), r;
    }));
}

/**
 * Reads the current value of a Document with a given key or null if not
 * found - used for testing.
 */
/**
 * Assigns the given target an internal ID so that its results can be pinned so
 * they don't get GC'd. A target must be allocated in the local store before
 * the store can be used to manage its view.
 *
 * Allocating an already allocated `Target` will return the existing `TargetData`
 * for that `Target`.
 */
function Tr(t, e) {
    const n = K(t);
    return n.persistence.runTransaction("Allocate target", "readwrite", (t => {
        let s;
        return n.He.getTargetData(t, e).next((i => i ? (
        // This target has been listened to previously, so reuse the
        // previous targetID.
        // TODO(mcg): freshen last accessed date?
        s = i, zs.resolve(s)) : n.He.allocateTargetId(t).next((i => (s = new ai(e, i, 0 /* Listen */ , t.currentSequenceNumber), 
        n.He.addTargetData(t, s).next((() => s)))))));
    })).then((t => {
        // If Multi-Tab is enabled, the existing target data may be newer than
        // the in-memory data
        const s = n.qn.get(t.targetId);
        return (null === s || t.snapshotVersion.compareTo(s.snapshotVersion) > 0) && (n.qn = n.qn.insert(t.targetId, t), 
        n.Kn.set(e, t.targetId)), t;
    }));
}

/**
 * Returns the TargetData as seen by the LocalStore, including updates that may
 * have not yet been persisted to the TargetCache.
 */
// Visible for testing.
/**
 * Unpins all the documents associated with the given target. If
 * `keepPersistedTargetData` is set to false and Eager GC enabled, the method
 * directly removes the associated target data from the target cache.
 *
 * Releasing a non-existing `Target` is a no-op.
 */
// PORTING NOTE: `keepPersistedTargetData` is multi-tab only.
async function Er(t, e, n) {
    const s = K(t), i = s.qn.get(e), r = n ? "readwrite" : "readwrite-primary";
    try {
        n || await s.persistence.runTransaction("Release target", r, (t => s.persistence.referenceDelegate.removeTarget(t, i)));
    } catch (t) {
        if (!Zs(t)) throw t;
        // All `releaseTarget` does is record the final metadata state for the
        // target, but we've been recording this periodically during target
        // activity. If we lose this write this could cause a very slight
        // difference in the order of target deletion during GC, but we
        // don't define exact LRU semantics so this is acceptable.
        O("LocalStore", `Failed to update sequence numbers for target ${e}: ${t}`);
    }
    s.qn = s.qn.remove(e), s.Kn.delete(i.target);
}

/**
 * Runs the specified query against the local store and returns the results,
 * potentially taking advantage of query data from previous executions (such
 * as the set of remote keys).
 *
 * @param usePreviousResults - Whether results from previous executions can
 * be used to optimize this query execution.
 */ function Ir(t, e, n) {
    const s = K(t);
    let i = ut.min(), r = Dn();
    return s.persistence.runTransaction("Execute query", "readonly", (t => function(t, e, n) {
        const s = K(t), i = s.Kn.get(n);
        return void 0 !== i ? zs.resolve(s.qn.get(i)) : s.He.getTargetData(e, n);
    }(s, t, be(e)).next((e => {
        if (e) return i = e.lastLimboFreeSnapshotVersion, s.He.getMatchingKeysForTargetId(t, e.targetId).next((t => {
            r = t;
        }));
    })).next((() => s.Un.getDocumentsMatchingQuery(t, e, n ? i : ut.min(), n ? r : Dn()))).next((t => ({
        documents: t,
        zn: r
    })))));
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class Vr {
    constructor(t) {
        this.k = t, this.Xn = new Map, this.Zn = new Map;
    }
    getBundleMetadata(t, e) {
        return zs.resolve(this.Xn.get(e));
    }
    saveBundleMetadata(t, e) {
        /** Decodes a BundleMetadata proto into a BundleMetadata object. */
        var n;
        return this.Xn.set(e.id, {
            id: (n = e).id,
            version: n.version,
            createTime: zn(n.createTime)
        }), zs.resolve();
    }
    getNamedQuery(t, e) {
        return zs.resolve(this.Zn.get(e));
    }
    saveNamedQuery(t, e) {
        return this.Zn.set(e.name, function(t) {
            return {
                name: t.name,
                query: pi(t.bundledQuery),
                readTime: zn(t.readTime)
            };
        }(e)), zs.resolve();
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A collection of references to a document from some kind of numbered entity
 * (either a target ID or batch ID). As references are added to or removed from
 * the set corresponding events are emitted to a registered garbage collector.
 *
 * Each reference is represented by a DocumentReference object. Each of them
 * contains enough information to uniquely identify the reference. They are all
 * stored primarily in a set sorted by key. A document is considered garbage if
 * there's no references in that set (this can be efficiently checked thanks to
 * sorting by key).
 *
 * ReferenceSet also keeps a secondary set that contains references sorted by
 * IDs. This one is used to efficiently implement removal of all references by
 * some target ID.
 */ class Sr {
    constructor() {
        // A set of outstanding references to a document sorted by key.
        this.ts = new En(Dr.es), 
        // A set of outstanding references to a document sorted by target id.
        this.ns = new En(Dr.ss);
    }
    /** Returns true if the reference set contains no references. */    isEmpty() {
        return this.ts.isEmpty();
    }
    /** Adds a reference to the given document key for the given ID. */    addReference(t, e) {
        const n = new Dr(t, e);
        this.ts = this.ts.add(n), this.ns = this.ns.add(n);
    }
    /** Add references to the given document keys for the given ID. */    rs(t, e) {
        t.forEach((t => this.addReference(t, e)));
    }
    /**
     * Removes a reference to the given document key for the given
     * ID.
     */    removeReference(t, e) {
        this.os(new Dr(t, e));
    }
    cs(t, e) {
        t.forEach((t => this.removeReference(t, e)));
    }
    /**
     * Clears all references with a given ID. Calls removeRef() for each key
     * removed.
     */    us(t) {
        const e = new Dt(new wt([])), n = new Dr(e, t), s = new Dr(e, t + 1), i = [];
        return this.ns.forEachInRange([ n, s ], (t => {
            this.os(t), i.push(t.key);
        })), i;
    }
    hs() {
        this.ts.forEach((t => this.os(t)));
    }
    os(t) {
        this.ts = this.ts.delete(t), this.ns = this.ns.delete(t);
    }
    ls(t) {
        const e = new Dt(new wt([])), n = new Dr(e, t), s = new Dr(e, t + 1);
        let i = Dn();
        return this.ns.forEachInRange([ n, s ], (t => {
            i = i.add(t.key);
        })), i;
    }
    containsKey(t) {
        const e = new Dr(t, 0), n = this.ts.firstAfterOrEqual(e);
        return null !== n && t.isEqual(n.key);
    }
}

class Dr {
    constructor(t, e) {
        this.key = t, this.fs = e;
    }
    /** Compare by key then by ID */    static es(t, e) {
        return Dt.comparator(t.key, e.key) || rt(t.fs, e.fs);
    }
    /** Compare by ID then by key */    static ss(t, e) {
        return rt(t.fs, e.fs) || Dt.comparator(t.key, e.key);
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class Cr {
    constructor(t, e) {
        this.Jt = t, this.referenceDelegate = e, 
        /**
         * The set of all mutations that have been sent but not yet been applied to
         * the backend.
         */
        this.An = [], 
        /** Next value to use when assigning sequential IDs to each mutation batch. */
        this.ds = 1, 
        /** An ordered mapping between documents and the mutations batch IDs. */
        this.ws = new En(Dr.es);
    }
    checkEmpty(t) {
        return zs.resolve(0 === this.An.length);
    }
    addMutationBatch(t, e, n, s) {
        const i = this.ds;
        this.ds++, this.An.length > 0 && this.An[this.An.length - 1];
        const r = new oi(i, e, n, s);
        this.An.push(r);
        // Track references by document key and index collection parents.
        for (const e of s) this.ws = this.ws.add(new Dr(e.key, i)), this.Jt.addToCollectionParentIndex(t, e.key.path.popLast());
        return zs.resolve(r);
    }
    lookupMutationBatch(t, e) {
        return zs.resolve(this._s(e));
    }
    getNextMutationBatchAfterBatchId(t, e) {
        const n = e + 1, s = this.gs(n), i = s < 0 ? 0 : s;
        // The requested batchId may still be out of range so normalize it to the
        // start of the queue.
                return zs.resolve(this.An.length > i ? this.An[i] : null);
    }
    getHighestUnacknowledgedBatchId() {
        return zs.resolve(0 === this.An.length ? -1 : this.ds - 1);
    }
    getAllMutationBatches(t) {
        return zs.resolve(this.An.slice());
    }
    getAllMutationBatchesAffectingDocumentKey(t, e) {
        const n = new Dr(e, 0), s = new Dr(e, Number.POSITIVE_INFINITY), i = [];
        return this.ws.forEachInRange([ n, s ], (t => {
            const e = this._s(t.fs);
            i.push(e);
        })), zs.resolve(i);
    }
    getAllMutationBatchesAffectingDocumentKeys(t, e) {
        let n = new En(rt);
        return e.forEach((t => {
            const e = new Dr(t, 0), s = new Dr(t, Number.POSITIVE_INFINITY);
            this.ws.forEachInRange([ e, s ], (t => {
                n = n.add(t.fs);
            }));
        })), zs.resolve(this.ys(n));
    }
    getAllMutationBatchesAffectingQuery(t, e) {
        // Use the query path as a prefix for testing if a document matches the
        // query.
        const n = e.path, s = n.length + 1;
        // Construct a document reference for actually scanning the index. Unlike
        // the prefix the document key in this reference must have an even number of
        // segments. The empty segment can be used a suffix of the query path
        // because it precedes all other segments in an ordered traversal.
        let i = n;
        Dt.isDocumentKey(i) || (i = i.child(""));
        const r = new Dr(new Dt(i), 0);
        // Find unique batchIDs referenced by all documents potentially matching the
        // query.
                let o = new En(rt);
        return this.ws.forEachWhile((t => {
            const e = t.key.path;
            return !!n.isPrefixOf(e) && (
            // Rows with document keys more than one segment longer than the query
            // path can't be matches. For example, a query on 'rooms' can't match
            // the document /rooms/abc/messages/xyx.
            // TODO(mcg): we'll need a different scanner when we implement
            // ancestor queries.
            e.length === s && (o = o.add(t.fs)), !0);
        }), r), zs.resolve(this.ys(o));
    }
    ys(t) {
        // Construct an array of matching batches, sorted by batchID to ensure that
        // multiple mutations affecting the same document key are applied in order.
        const e = [];
        return t.forEach((t => {
            const n = this._s(t);
            null !== n && e.push(n);
        })), e;
    }
    removeMutationBatch(t, e) {
        U(0 === this.ps(e.batchId, "removed")), this.An.shift();
        let n = this.ws;
        return zs.forEach(e.mutations, (s => {
            const i = new Dr(s.key, e.batchId);
            return n = n.delete(i), this.referenceDelegate.markPotentiallyOrphaned(t, s.key);
        })).next((() => {
            this.ws = n;
        }));
    }
    ee(t) {
        // No-op since the memory mutation queue does not maintain a separate cache.
    }
    containsKey(t, e) {
        const n = new Dr(e, 0), s = this.ws.firstAfterOrEqual(n);
        return zs.resolve(e.isEqual(s && s.key));
    }
    performConsistencyCheck(t) {
        return this.An.length, zs.resolve();
    }
    /**
     * Finds the index of the given batchId in the mutation queue and asserts that
     * the resulting index is within the bounds of the queue.
     *
     * @param batchId - The batchId to search for
     * @param action - A description of what the caller is doing, phrased in passive
     * form (e.g. "acknowledged" in a routine that acknowledges batches).
     */    ps(t, e) {
        return this.gs(t);
    }
    /**
     * Finds the index of the given batchId in the mutation queue. This operation
     * is O(1).
     *
     * @returns The computed index of the batch with the given batchId, based on
     * the state of the queue. Note this index can be negative if the requested
     * batchId has already been remvoed from the queue or past the end of the
     * queue if the batchId is larger than the last added batch.
     */    gs(t) {
        if (0 === this.An.length) 
        // As an index this is past the end of the queue
        return 0;
        // Examine the front of the queue to figure out the difference between the
        // batchId and indexes in the array. Note that since the queue is ordered
        // by batchId, if the first batch has a larger batchId then the requested
        // batchId doesn't exist in the queue.
                return t - this.An[0].batchId;
    }
    /**
     * A version of lookupMutationBatch that doesn't return a promise, this makes
     * other functions that uses this code easier to read and more efficent.
     */    _s(t) {
        const e = this.gs(t);
        if (e < 0 || e >= this.An.length) return null;
        return this.An[e];
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The memory-only RemoteDocumentCache for IndexedDb. To construct, invoke
 * `newMemoryRemoteDocumentCache()`.
 */
class Nr {
    /**
     * @param sizer - Used to assess the size of a document. For eager GC, this is
     * expected to just return 0 to avoid unnecessarily doing the work of
     * calculating the size.
     */
    constructor(t, e) {
        this.Jt = t, this.Ts = e, 
        /** Underlying cache of documents and their read times. */
        this.docs = new yn(Dt.comparator), 
        /** Size of all cached documents. */
        this.size = 0;
    }
    /**
     * Adds the supplied entry to the cache and updates the cache size as appropriate.
     *
     * All calls of `addEntry`  are required to go through the RemoteDocumentChangeBuffer
     * returned by `newChangeBuffer()`.
     */    addEntry(t, e, n) {
        const s = e.key, i = this.docs.get(s), r = i ? i.size : 0, o = this.Ts(e);
        return this.docs = this.docs.insert(s, {
            document: e.mutableCopy(),
            size: o,
            readTime: n
        }), this.size += o - r, this.Jt.addToCollectionParentIndex(t, s.path.popLast());
    }
    /**
     * Removes the specified entry from the cache and updates the cache size as appropriate.
     *
     * All calls of `removeEntry` are required to go through the RemoteDocumentChangeBuffer
     * returned by `newChangeBuffer()`.
     */    removeEntry(t) {
        const e = this.docs.get(t);
        e && (this.docs = this.docs.remove(t), this.size -= e.size);
    }
    getEntry(t, e) {
        const n = this.docs.get(e);
        return zs.resolve(n ? n.document.mutableCopy() : Gt.newInvalidDocument(e));
    }
    getEntries(t, e) {
        let n = Rn();
        return e.forEach((t => {
            const e = this.docs.get(t);
            n = n.insert(t, e ? e.document.mutableCopy() : Gt.newInvalidDocument(t));
        })), zs.resolve(n);
    }
    getDocumentsMatchingQuery(t, e, n) {
        let s = Rn();
        // Documents are ordered by key, so we can use a prefix scan to narrow down
        // the documents we need to match the query against.
                const i = new Dt(e.path.child("")), r = this.docs.getIteratorFrom(i);
        for (;r.hasNext(); ) {
            const {key: t, value: {document: i, readTime: o}} = r.getNext();
            if (!e.path.isPrefixOf(t.path)) break;
            o.compareTo(n) <= 0 || De(e, i) && (s = s.insert(i.key, i.mutableCopy()));
        }
        return zs.resolve(s);
    }
    Es(t, e) {
        return zs.forEach(this.docs, (t => e(t)));
    }
    newChangeBuffer(t) {
        // `trackRemovals` is ignores since the MemoryRemoteDocumentCache keeps
        // a separate changelog and does not need special handling for removals.
        return new kr(this);
    }
    getSize(t) {
        return zs.resolve(this.size);
    }
}

/**
 * Creates a new memory-only RemoteDocumentCache.
 *
 * @param indexManager - A class that manages collection group indices.
 * @param sizer - Used to assess the size of a document. For eager GC, this is
 * expected to just return 0 to avoid unnecessarily doing the work of
 * calculating the size.
 */
/**
 * Handles the details of adding and updating documents in the MemoryRemoteDocumentCache.
 */
class kr extends Hi {
    constructor(t) {
        super(), this.De = t;
    }
    applyChanges(t) {
        const e = [];
        return this.changes.forEach(((n, s) => {
            s.document.isValidDocument() ? e.push(this.De.addEntry(t, s.document, this.getReadTime(n))) : this.De.removeEntry(n);
        })), zs.waitFor(e);
    }
    getFromCache(t, e) {
        return this.De.getEntry(t, e);
    }
    getAllFromCache(t, e) {
        return this.De.getEntries(t, e);
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class xr {
    constructor(t) {
        this.persistence = t, 
        /**
         * Maps a target to the data about that target
         */
        this.Is = new zi((t => Jt(t)), Xt), 
        /** The last received snapshot version. */
        this.lastRemoteSnapshotVersion = ut.min(), 
        /** The highest numbered target ID encountered. */
        this.highestTargetId = 0, 
        /** The highest sequence number encountered. */
        this.As = 0, 
        /**
         * A ordered bidirectional mapping between documents and the remote target
         * IDs.
         */
        this.Rs = new Sr, this.targetCount = 0, this.bs = Oi.ie();
    }
    forEachTarget(t, e) {
        return this.Is.forEach(((t, n) => e(n))), zs.resolve();
    }
    getLastRemoteSnapshotVersion(t) {
        return zs.resolve(this.lastRemoteSnapshotVersion);
    }
    getHighestSequenceNumber(t) {
        return zs.resolve(this.As);
    }
    allocateTargetId(t) {
        return this.highestTargetId = this.bs.next(), zs.resolve(this.highestTargetId);
    }
    setTargetsMetadata(t, e, n) {
        return n && (this.lastRemoteSnapshotVersion = n), e > this.As && (this.As = e), 
        zs.resolve();
    }
    ae(t) {
        this.Is.set(t.target, t);
        const e = t.targetId;
        e > this.highestTargetId && (this.bs = new Oi(e), this.highestTargetId = e), t.sequenceNumber > this.As && (this.As = t.sequenceNumber);
    }
    addTargetData(t, e) {
        return this.ae(e), this.targetCount += 1, zs.resolve();
    }
    updateTargetData(t, e) {
        return this.ae(e), zs.resolve();
    }
    removeTargetData(t, e) {
        return this.Is.delete(e.target), this.Rs.us(e.targetId), this.targetCount -= 1, 
        zs.resolve();
    }
    removeTargets(t, e, n) {
        let s = 0;
        const i = [];
        return this.Is.forEach(((r, o) => {
            o.sequenceNumber <= e && null === n.get(o.targetId) && (this.Is.delete(r), i.push(this.removeMatchingKeysForTargetId(t, o.targetId)), 
            s++);
        })), zs.waitFor(i).next((() => s));
    }
    getTargetCount(t) {
        return zs.resolve(this.targetCount);
    }
    getTargetData(t, e) {
        const n = this.Is.get(e) || null;
        return zs.resolve(n);
    }
    addMatchingKeys(t, e, n) {
        return this.Rs.rs(e, n), zs.resolve();
    }
    removeMatchingKeys(t, e, n) {
        this.Rs.cs(e, n);
        const s = this.persistence.referenceDelegate, i = [];
        return s && e.forEach((e => {
            i.push(s.markPotentiallyOrphaned(t, e));
        })), zs.waitFor(i);
    }
    removeMatchingKeysForTargetId(t, e) {
        return this.Rs.us(e), zs.resolve();
    }
    getMatchingKeysForTargetId(t, e) {
        const n = this.Rs.ls(e);
        return zs.resolve(n);
    }
    containsKey(t, e) {
        return zs.resolve(this.Rs.containsKey(e));
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A memory-backed instance of Persistence. Data is stored only in RAM and
 * not persisted across sessions.
 */
class $r {
    /**
     * The constructor accepts a factory for creating a reference delegate. This
     * allows both the delegate and this instance to have strong references to
     * each other without having nullable fields that would then need to be
     * checked or asserted on every access.
     */
    constructor(t, e) {
        this.Ps = {}, this.Be = new nt(0), this.Ue = !1, this.Ue = !0, this.referenceDelegate = t(this), 
        this.He = new xr(this);
        this.Jt = new Ai, this.Je = function(t, e) {
            return new Nr(t, e);
        }(this.Jt, (t => this.referenceDelegate.vs(t))), this.k = new ui(e), this.Ye = new Vr(this.k);
    }
    start() {
        return Promise.resolve();
    }
    shutdown() {
        // No durable state to ensure is closed on shutdown.
        return this.Ue = !1, Promise.resolve();
    }
    get started() {
        return this.Ue;
    }
    setDatabaseDeletedListener() {
        // No op.
    }
    setNetworkEnabled() {
        // No op.
    }
    getIndexManager() {
        return this.Jt;
    }
    getMutationQueue(t) {
        let e = this.Ps[t.toKey()];
        return e || (e = new Cr(this.Jt, this.referenceDelegate), this.Ps[t.toKey()] = e), 
        e;
    }
    getTargetCache() {
        return this.He;
    }
    getRemoteDocumentCache() {
        return this.Je;
    }
    getBundleCache() {
        return this.Ye;
    }
    runTransaction(t, e, n) {
        O("MemoryPersistence", "Starting transaction:", t);
        const s = new Or(this.Be.next());
        return this.referenceDelegate.Vs(), n(s).next((t => this.referenceDelegate.Ss(s).next((() => t)))).toPromise().then((t => (s.raiseOnCommittedEvent(), 
        t)));
    }
    Ds(t, e) {
        return zs.or(Object.values(this.Ps).map((n => () => n.containsKey(t, e))));
    }
}

/**
 * Memory persistence is not actually transactional, but future implementations
 * may have transaction-scoped state.
 */ class Or extends Gs {
    constructor(t) {
        super(), this.currentSequenceNumber = t;
    }
}

class Mr {
    constructor(t) {
        this.persistence = t, 
        /** Tracks all documents that are active in Query views. */
        this.Cs = new Sr, 
        /** The list of documents that are potentially GCed after each transaction. */
        this.Ns = null;
    }
    static ks(t) {
        return new Mr(t);
    }
    get xs() {
        if (this.Ns) return this.Ns;
        throw B();
    }
    addReference(t, e, n) {
        return this.Cs.addReference(n, e), this.xs.delete(n.toString()), zs.resolve();
    }
    removeReference(t, e, n) {
        return this.Cs.removeReference(n, e), this.xs.add(n.toString()), zs.resolve();
    }
    markPotentiallyOrphaned(t, e) {
        return this.xs.add(e.toString()), zs.resolve();
    }
    removeTarget(t, e) {
        this.Cs.us(e.targetId).forEach((t => this.xs.add(t.toString())));
        const n = this.persistence.getTargetCache();
        return n.getMatchingKeysForTargetId(t, e.targetId).next((t => {
            t.forEach((t => this.xs.add(t.toString())));
        })).next((() => n.removeTargetData(t, e)));
    }
    Vs() {
        this.Ns = new Set;
    }
    Ss(t) {
        // Remove newly orphaned documents.
        const e = this.persistence.getRemoteDocumentCache().newChangeBuffer();
        return zs.forEach(this.xs, (n => {
            const s = Dt.fromPath(n);
            return this.$s(t, s).next((t => {
                t || e.removeEntry(s);
            }));
        })).next((() => (this.Ns = null, e.apply(t))));
    }
    updateLimboDocument(t, e) {
        return this.$s(t, e).next((t => {
            t ? this.xs.delete(e.toString()) : this.xs.add(e.toString());
        }));
    }
    vs(t) {
        // For eager GC, we don't care about the document size, there are no size thresholds.
        return 0;
    }
    $s(t, e) {
        return zs.or([ () => zs.resolve(this.Cs.containsKey(e)), () => this.persistence.getTargetCache().containsKey(t, e), () => this.persistence.Ds(t, e) ]);
    }
}

/**
 * Metadata state of the local client. Unlike `RemoteClientState`, this class is
 * mutable and keeps track of all pending mutations, which allows us to
 * update the range of pending mutation batch IDs as new mutations are added or
 * removed.
 *
 * The data in `LocalClientState` is not read from WebStorage and instead
 * updated via its instance methods. The updated state can be serialized via
 * `toWebStorageJSON()`.
 */
// Visible for testing.
class Qr {
    constructor() {
        this.activeTargetIds = Nn();
    }
    Fs(t) {
        this.activeTargetIds = this.activeTargetIds.add(t);
    }
    Ls(t) {
        this.activeTargetIds = this.activeTargetIds.delete(t);
    }
    /**
     * Converts this entry into a JSON-encoded format we can use for WebStorage.
     * Does not encode `clientId` as it is part of the key in WebStorage.
     */    Ms() {
        const t = {
            activeTargetIds: this.activeTargetIds.toArray(),
            updateTimeMs: Date.now()
        };
        return JSON.stringify(t);
    }
}

class Gr {
    constructor() {
        this.pi = new Qr, this.Ti = {}, this.onlineStateHandler = null, this.sequenceNumberHandler = null;
    }
    addPendingMutation(t) {
        // No op.
    }
    updateMutationState(t, e, n) {
        // No op.
    }
    addLocalQueryTarget(t) {
        return this.pi.Fs(t), this.Ti[t] || "not-current";
    }
    updateQueryState(t, e, n) {
        this.Ti[t] = e;
    }
    removeLocalQueryTarget(t) {
        this.pi.Ls(t);
    }
    isLocalQueryTarget(t) {
        return this.pi.activeTargetIds.has(t);
    }
    clearQueryState(t) {
        delete this.Ti[t];
    }
    getAllActiveQueryTargets() {
        return this.pi.activeTargetIds;
    }
    isActiveQueryTarget(t) {
        return this.pi.activeTargetIds.has(t);
    }
    start() {
        return this.pi = new Qr, Promise.resolve();
    }
    handleUserChange(t, e, n) {
        // No op.
    }
    setOnlineState(t) {
        // No op.
    }
    shutdown() {}
    writeSequenceNumber(t) {}
    notifyBundleLoaded() {
        // No op.
    }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class zr {
    Ei(t) {
        // No-op.
    }
    shutdown() {
        // No-op.
    }
}

/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// References to `window` are guarded by BrowserConnectivityMonitor.isAvailable()
/* eslint-disable no-restricted-globals */
/**
 * Browser implementation of ConnectivityMonitor.
 */
class Hr {
    constructor() {
        this.Ii = () => this.Ai(), this.Ri = () => this.bi(), this.Pi = [], this.vi();
    }
    Ei(t) {
        this.Pi.push(t);
    }
    shutdown() {
        window.removeEventListener("online", this.Ii), window.removeEventListener("offline", this.Ri);
    }
    vi() {
        window.addEventListener("online", this.Ii), window.addEventListener("offline", this.Ri);
    }
    Ai() {
        O("ConnectivityMonitor", "Network connectivity changed: AVAILABLE");
        for (const t of this.Pi) t(0 /* AVAILABLE */);
    }
    bi() {
        O("ConnectivityMonitor", "Network connectivity changed: UNAVAILABLE");
        for (const t of this.Pi) t(1 /* UNAVAILABLE */);
    }
    // TODO(chenbrian): Consider passing in window either into this component or
    // here for testing via FakeWindow.
    /** Checks that all used attributes of window are available. */
    static Pt() {
        return "undefined" != typeof window && void 0 !== window.addEventListener && void 0 !== window.removeEventListener;
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ const Jr = {
    BatchGetDocuments: "batchGet",
    Commit: "commit",
    RunQuery: "runQuery"
};

/**
 * Maps RPC names to the corresponding REST endpoint name.
 *
 * We use array notation to avoid mangling.
 */
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Provides a simple helper class that implements the Stream interface to
 * bridge to other implementations that are streams but do not implement the
 * interface. The stream callbacks are invoked with the callOn... methods.
 */
class Yr {
    constructor(t) {
        this.Vi = t.Vi, this.Si = t.Si;
    }
    Di(t) {
        this.Ci = t;
    }
    Ni(t) {
        this.ki = t;
    }
    onMessage(t) {
        this.xi = t;
    }
    close() {
        this.Si();
    }
    send(t) {
        this.Vi(t);
    }
    $i() {
        this.Ci();
    }
    Oi(t) {
        this.ki(t);
    }
    Mi(t) {
        this.xi(t);
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class Xr extends 
/**
 * Base class for all Rest-based connections to the backend (WebChannel and
 * HTTP).
 */
class {
    constructor(t) {
        this.databaseInfo = t, this.databaseId = t.databaseId;
        const e = t.ssl ? "https" : "http";
        this.Fi = e + "://" + t.host, this.Li = "projects/" + this.databaseId.projectId + "/databases/" + this.databaseId.database + "/documents";
    }
    Bi(t, e, n, s, i) {
        const r = this.Ui(t, e);
        O("RestConnection", "Sending: ", r, n);
        const o = {};
        return this.qi(o, s, i), this.Ki(t, r, o, n).then((t => (O("RestConnection", "Received: ", t), 
        t)), (e => {
            throw F("RestConnection", `${t} failed with error: `, e, "url: ", r, "request:", n), 
            e;
        }));
    }
    ji(t, e, n, s, i) {
        // The REST API automatically aggregates all of the streamed results, so we
        // can just use the normal invoke() method.
        return this.Bi(t, e, n, s, i);
    }
    /**
     * Modifies the headers for a request, adding any authorization token if
     * present and any additional headers for the request.
     */    qi(t, e, n) {
        t["X-Goog-Api-Client"] = "gl-js/ fire/" + N, 
        // Content-Type: text/plain will avoid preflight requests which might
        // mess with CORS and redirects by proxies. If we add custom headers
        // we will need to change this code to potentially use the $httpOverwrite
        // parameter supported by ESF to avoid triggering preflight requests.
        t["Content-Type"] = "text/plain", this.databaseInfo.appId && (t["X-Firebase-GMPID"] = this.databaseInfo.appId), 
        e && e.headers.forEach(((e, n) => t[n] = e)), n && n.headers.forEach(((e, n) => t[n] = e));
    }
    Ui(t, e) {
        const n = Jr[t];
        return `${this.Fi}/v1/${e}:${n}`;
    }
} {
    constructor(t) {
        super(t), this.forceLongPolling = t.forceLongPolling, this.autoDetectLongPolling = t.autoDetectLongPolling, 
        this.useFetchStreams = t.useFetchStreams;
    }
    Ki(t, e, n, s) {
        return new Promise(((i, r) => {
            const o = new XhrIo;
            o.listenOnce(EventType.COMPLETE, (() => {
                try {
                    switch (o.getLastErrorCode()) {
                      case ErrorCode.NO_ERROR:
                        const e = o.getResponseJson();
                        O("Connection", "XHR received:", JSON.stringify(e)), i(e);
                        break;

                      case ErrorCode.TIMEOUT:
                        O("Connection", 'RPC "' + t + '" timed out'), r(new Q(j.DEADLINE_EXCEEDED, "Request time out"));
                        break;

                      case ErrorCode.HTTP_ERROR:
                        const n = o.getStatus();
                        if (O("Connection", 'RPC "' + t + '" failed with status:', n, "response text:", o.getResponseText()), 
                        n > 0) {
                            const t = o.getResponseJson().error;
                            if (t && t.status && t.message) {
                                const e = function(t) {
                                    const e = t.toLowerCase().replace(/_/g, "-");
                                    return Object.values(j).indexOf(e) >= 0 ? e : j.UNKNOWN;
                                }(t.status);
                                r(new Q(e, t.message));
                            } else r(new Q(j.UNKNOWN, "Server responded with status " + o.getStatus()));
                        } else 
                        // If we received an HTTP_ERROR but there's no status code,
                        // it's most probably a connection issue
                        r(new Q(j.UNAVAILABLE, "Connection failed."));
                        break;

                      default:
                        B();
                    }
                } finally {
                    O("Connection", 'RPC "' + t + '" completed.');
                }
            }));
            const c = JSON.stringify(s);
            o.send(e, "POST", c, n, 15);
        }));
    }
    Qi(t, e, n) {
        const s = [ this.Fi, "/", "google.firestore.v1.Firestore", "/", t, "/channel" ], i = createWebChannelTransport(), r = getStatEventTarget(), o = {
            // Required for backend stickiness, routing behavior is based on this
            // parameter.
            httpSessionIdParam: "gsessionid",
            initMessageHeaders: {},
            messageUrlParams: {
                // This param is used to improve routing and project isolation by the
                // backend and must be included in every request.
                database: `projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`
            },
            sendRawJson: !0,
            supportsCrossDomainXhr: !0,
            internalChannelParams: {
                // Override the default timeout (randomized between 10-20 seconds) since
                // a large write batch on a slow internet connection may take a long
                // time to send to the backend. Rather than have WebChannel impose a
                // tight timeout which could lead to infinite timeouts and retries, we
                // set it very large (5-10 minutes) and rely on the browser's builtin
                // timeouts to kick in if the request isn't working.
                forwardChannelRequestTimeoutMs: 6e5
            },
            forceLongPolling: this.forceLongPolling,
            detectBufferingProxy: this.autoDetectLongPolling
        };
        this.useFetchStreams && (o.xmlHttpFactory = new FetchXmlHttpFactory({})), this.qi(o.initMessageHeaders, e, n), 
        // Sending the custom headers we just added to request.initMessageHeaders
        // (Authorization, etc.) will trigger the browser to make a CORS preflight
        // request because the XHR will no longer meet the criteria for a "simple"
        // CORS request:
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Simple_requests
        // Therefore to avoid the CORS preflight request (an extra network
        // roundtrip), we use the httpHeadersOverwriteParam option to specify that
        // the headers should instead be encoded into a special "$httpHeaders" query
        // parameter, which is recognized by the webchannel backend. This is
        // formally defined here:
        // https://github.com/google/closure-library/blob/b0e1815b13fb92a46d7c9b3c30de5d6a396a3245/closure/goog/net/rpc/httpcors.js#L32
        // TODO(b/145624756): There is a backend bug where $httpHeaders isn't respected if the request
        // doesn't have an Origin header. So we have to exclude a few browser environments that are
        // known to (sometimes) not include an Origin. See
        // https://github.com/firebase/firebase-js-sdk/issues/1491.
        isMobileCordova() || isReactNative() || isElectron() || isIE() || isUWP() || isBrowserExtension() || (o.httpHeadersOverwriteParam = "$httpHeaders");
        const c = s.join("");
        O("Connection", "Creating WebChannel: " + c, o);
        const a = i.createWebChannel(c, o);
        // WebChannel supports sending the first message with the handshake - saving
        // a network round trip. However, it will have to call send in the same
        // JS event loop as open. In order to enforce this, we delay actually
        // opening the WebChannel until send is called. Whether we have called
        // open is tracked with this variable.
                let u = !1, h = !1;
        // A flag to determine whether the stream was closed (by us or through an
        // error/close event) to avoid delivering multiple close events or sending
        // on a closed stream
                const l = new Yr({
            Vi: t => {
                h ? O("Connection", "Not sending because WebChannel is closed:", t) : (u || (O("Connection", "Opening WebChannel transport."), 
                a.open(), u = !0), O("Connection", "WebChannel sending:", t), a.send(t));
            },
            Si: () => a.close()
        }), y = (t, e, n) => {
            // TODO(dimond): closure typing seems broken because WebChannel does
            // not implement goog.events.Listenable
            t.listen(e, (t => {
                try {
                    n(t);
                } catch (t) {
                    setTimeout((() => {
                        throw t;
                    }), 0);
                }
            }));
        };
        // Closure events are guarded and exceptions are swallowed, so catch any
        // exception and rethrow using a setTimeout so they become visible again.
        // Note that eventually this function could go away if we are confident
        // enough the code is exception free.
                return y(a, WebChannel.EventType.OPEN, (() => {
            h || O("Connection", "WebChannel transport opened.");
        })), y(a, WebChannel.EventType.CLOSE, (() => {
            h || (h = !0, O("Connection", "WebChannel transport closed"), l.Oi());
        })), y(a, WebChannel.EventType.ERROR, (t => {
            h || (h = !0, F("Connection", "WebChannel transport errored:", t), l.Oi(new Q(j.UNAVAILABLE, "The operation could not be completed")));
        })), y(a, WebChannel.EventType.MESSAGE, (t => {
            var e;
            if (!h) {
                const n = t.data[0];
                U(!!n);
                // TODO(b/35143891): There is a bug in One Platform that caused errors
                // (and only errors) to be wrapped in an extra array. To be forward
                // compatible with the bug we need to check either condition. The latter
                // can be removed once the fix has been rolled out.
                // Use any because msgData.error is not typed.
                const s = n, i = s.error || (null === (e = s[0]) || void 0 === e ? void 0 : e.error);
                if (i) {
                    O("Connection", "WebChannel received error:", i);
                    // error.status will be a string like 'OK' or 'NOT_FOUND'.
                    const t = i.status;
                    let e = 
                    /**
 * Maps an error Code from a GRPC status identifier like 'NOT_FOUND'.
 *
 * @returns The Code equivalent to the given status string or undefined if
 *     there is no match.
 */
                    function(t) {
                        // lookup by string
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const e = wn[t];
                        if (void 0 !== e) return gn(e);
                    }(t), n = i.message;
                    void 0 === e && (e = j.INTERNAL, n = "Unknown error status: " + t + " with message " + i.message), 
                    // Mark closed so no further events are propagated
                    h = !0, l.Oi(new Q(e, n)), a.close();
                } else O("Connection", "WebChannel received:", n), l.Mi(n);
            }
        })), y(r, Event.STAT_EVENT, (t => {
            t.stat === Stat.PROXY ? O("Connection", "Detected buffering proxy") : t.stat === Stat.NOPROXY && O("Connection", "Detected no buffering proxy");
        })), setTimeout((() => {
            // Technically we could/should wait for the WebChannel opened event,
            // but because we want to send the first message with the WebChannel
            // handshake we pretend the channel opened here (asynchronously), and
            // then delay the actual open until the first message is sent.
            l.$i();
        }), 0), l;
    }
}

/** The Platform's 'document' implementation or null if not available. */ function to() {
    // `document` is not always available, e.g. in ReactNative and WebWorkers.
    // eslint-disable-next-line no-restricted-globals
    return "undefined" != typeof document ? document : null;
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ function eo(t) {
    return new jn(t, /* useProto3Json= */ !0);
}

/**
 * An instance of the Platform's 'TextEncoder' implementation.
 */
/**
 * A helper for running delayed tasks following an exponential backoff curve
 * between attempts.
 *
 * Each delay is made up of a "base" delay which follows the exponential
 * backoff curve, and a +/- 50% "jitter" that is calculated and added to the
 * base delay. This prevents clients from accidentally synchronizing their
 * delays causing spikes of load to the backend.
 */
class no {
    constructor(
    /**
     * The AsyncQueue to run backoff operations on.
     */
    t, 
    /**
     * The ID to use when scheduling backoff operations on the AsyncQueue.
     */
    e, 
    /**
     * The initial delay (used as the base delay on the first retry attempt).
     * Note that jitter will still be applied, so the actual delay could be as
     * little as 0.5*initialDelayMs.
     */
    n = 1e3
    /**
     * The multiplier to use to determine the extended base delay after each
     * attempt.
     */ , s = 1.5
    /**
     * The maximum base delay after which no further backoff is performed.
     * Note that jitter will still be applied, so the actual delay could be as
     * much as 1.5*maxDelayMs.
     */ , i = 6e4) {
        this.Me = t, this.timerId = e, this.Wi = n, this.Gi = s, this.zi = i, this.Hi = 0, 
        this.Ji = null, 
        /** The last backoff attempt, as epoch milliseconds. */
        this.Yi = Date.now(), this.reset();
    }
    /**
     * Resets the backoff delay.
     *
     * The very next backoffAndWait() will have no delay. If it is called again
     * (i.e. due to an error), initialDelayMs (plus jitter) will be used, and
     * subsequent ones will increase according to the backoffFactor.
     */    reset() {
        this.Hi = 0;
    }
    /**
     * Resets the backoff delay to the maximum delay (e.g. for use after a
     * RESOURCE_EXHAUSTED error).
     */    Xi() {
        this.Hi = this.zi;
    }
    /**
     * Returns a promise that resolves after currentDelayMs, and increases the
     * delay for any subsequent attempts. If there was a pending backoff operation
     * already, it will be canceled.
     */    Zi(t) {
        // Cancel any pending backoff operation.
        this.cancel();
        // First schedule using the current base (which may be 0 and should be
        // honored as such).
        const e = Math.floor(this.Hi + this.tr()), n = Math.max(0, Date.now() - this.Yi), s = Math.max(0, e - n);
        // Guard against lastAttemptTime being in the future due to a clock change.
                s > 0 && O("ExponentialBackoff", `Backing off for ${s} ms (base delay: ${this.Hi} ms, delay with jitter: ${e} ms, last attempt: ${n} ms ago)`), 
        this.Ji = this.Me.enqueueAfterDelay(this.timerId, s, (() => (this.Yi = Date.now(), 
        t()))), 
        // Apply backoff factor to determine next delay and ensure it is within
        // bounds.
        this.Hi *= this.Gi, this.Hi < this.Wi && (this.Hi = this.Wi), this.Hi > this.zi && (this.Hi = this.zi);
    }
    er() {
        null !== this.Ji && (this.Ji.skipDelay(), this.Ji = null);
    }
    cancel() {
        null !== this.Ji && (this.Ji.cancel(), this.Ji = null);
    }
    /** Returns a random value in the range [-currentBaseMs/2, currentBaseMs/2] */    tr() {
        return (Math.random() - .5) * this.Hi;
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A PersistentStream is an abstract base class that represents a streaming RPC
 * to the Firestore backend. It's built on top of the connections own support
 * for streaming RPCs, and adds several critical features for our clients:
 *
 *   - Exponential backoff on failure
 *   - Authentication via CredentialsProvider
 *   - Dispatching all callbacks into the shared worker queue
 *   - Closing idle streams after 60 seconds of inactivity
 *
 * Subclasses of PersistentStream implement serialization of models to and
 * from the JSON representation of the protocol buffers for a specific
 * streaming RPC.
 *
 * ## Starting and Stopping
 *
 * Streaming RPCs are stateful and need to be start()ed before messages can
 * be sent and received. The PersistentStream will call the onOpen() function
 * of the listener once the stream is ready to accept requests.
 *
 * Should a start() fail, PersistentStream will call the registered onClose()
 * listener with a FirestoreError indicating what went wrong.
 *
 * A PersistentStream can be started and stopped repeatedly.
 *
 * Generic types:
 *  SendType: The type of the outgoing message of the underlying
 *    connection stream
 *  ReceiveType: The type of the incoming message of the underlying
 *    connection stream
 *  ListenerType: The type of the listener that will be used for callbacks
 */
class so {
    constructor(t, e, n, s, i, r, o, c) {
        this.Me = t, this.nr = n, this.sr = s, this.ir = i, this.authCredentialsProvider = r, 
        this.appCheckCredentialsProvider = o, this.listener = c, this.state = 0 /* Initial */ , 
        /**
         * A close count that's incremented every time the stream is closed; used by
         * getCloseGuardedDispatcher() to invalidate callbacks that happen after
         * close.
         */
        this.rr = 0, this.cr = null, this.ar = null, this.stream = null, this.ur = new no(t, e);
    }
    /**
     * Returns true if start() has been called and no error has occurred. True
     * indicates the stream is open or in the process of opening (which
     * encompasses respecting backoff, getting auth tokens, and starting the
     * actual RPC). Use isOpen() to determine if the stream is open and ready for
     * outbound requests.
     */    hr() {
        return 1 /* Starting */ === this.state || 5 /* Backoff */ === this.state || this.lr();
    }
    /**
     * Returns true if the underlying RPC is open (the onOpen() listener has been
     * called) and the stream is ready for outbound requests.
     */    lr() {
        return 2 /* Open */ === this.state || 3 /* Healthy */ === this.state;
    }
    /**
     * Starts the RPC. Only allowed if isStarted() returns false. The stream is
     * not immediately ready for use: onOpen() will be invoked when the RPC is
     * ready for outbound requests, at which point isOpen() will return true.
     *
     * When start returns, isStarted() will return true.
     */    start() {
        4 /* Error */ !== this.state ? this.auth() : this.dr();
    }
    /**
     * Stops the RPC. This call is idempotent and allowed regardless of the
     * current isStarted() state.
     *
     * When stop returns, isStarted() and isOpen() will both return false.
     */    async stop() {
        this.hr() && await this.close(0 /* Initial */);
    }
    /**
     * After an error the stream will usually back off on the next attempt to
     * start it. If the error warrants an immediate restart of the stream, the
     * sender can use this to indicate that the receiver should not back off.
     *
     * Each error will call the onClose() listener. That function can decide to
     * inhibit backoff if required.
     */    wr() {
        this.state = 0 /* Initial */ , this.ur.reset();
    }
    /**
     * Marks this stream as idle. If no further actions are performed on the
     * stream for one minute, the stream will automatically close itself and
     * notify the stream's onClose() handler with Status.OK. The stream will then
     * be in a !isStarted() state, requiring the caller to start the stream again
     * before further use.
     *
     * Only streams that are in state 'Open' can be marked idle, as all other
     * states imply pending network operations.
     */    _r() {
        // Starts the idle time if we are in state 'Open' and are not yet already
        // running a timer (in which case the previous idle timeout still applies).
        this.lr() && null === this.cr && (this.cr = this.Me.enqueueAfterDelay(this.nr, 6e4, (() => this.mr())));
    }
    /** Sends a message to the underlying stream. */    gr(t) {
        this.yr(), this.stream.send(t);
    }
    /** Called by the idle timer when the stream should close due to inactivity. */    async mr() {
        if (this.lr()) 
        // When timing out an idle stream there's no reason to force the stream into backoff when
        // it restarts so set the stream state to Initial instead of Error.
        return this.close(0 /* Initial */);
    }
    /** Marks the stream as active again. */    yr() {
        this.cr && (this.cr.cancel(), this.cr = null);
    }
    /** Cancels the health check delayed operation. */    pr() {
        this.ar && (this.ar.cancel(), this.ar = null);
    }
    /**
     * Closes the stream and cleans up as necessary:
     *
     * * closes the underlying GRPC stream;
     * * calls the onClose handler with the given 'error';
     * * sets internal stream state to 'finalState';
     * * adjusts the backoff timer based on the error
     *
     * A new stream can be opened by calling start().
     *
     * @param finalState - the intended state of the stream after closing.
     * @param error - the error the connection was closed with.
     */    async close(t, e) {
        // Cancel any outstanding timers (they're guaranteed not to execute).
        this.yr(), this.pr(), this.ur.cancel(), 
        // Invalidates any stream-related callbacks (e.g. from auth or the
        // underlying stream), guaranteeing they won't execute.
        this.rr++, 4 /* Error */ !== t ? 
        // If this is an intentional close ensure we don't delay our next connection attempt.
        this.ur.reset() : e && e.code === j.RESOURCE_EXHAUSTED ? (
        // Log the error. (Probably either 'quota exceeded' or 'max queue length reached'.)
        M(e.toString()), M("Using maximum backoff delay to prevent overloading the backend."), 
        this.ur.Xi()) : e && e.code === j.UNAUTHENTICATED && 3 /* Healthy */ !== this.state && (
        // "unauthenticated" error means the token was rejected. This should rarely
        // happen since both Auth and AppCheck ensure a sufficient TTL when we
        // request a token. If a user manually resets their system clock this can
        // fail, however. In this case, we should get a Code.UNAUTHENTICATED error
        // before we received the first message and we need to invalidate the token
        // to ensure that we fetch a new token.
        this.authCredentialsProvider.invalidateToken(), this.appCheckCredentialsProvider.invalidateToken()), 
        // Clean up the underlying stream because we are no longer interested in events.
        null !== this.stream && (this.Tr(), this.stream.close(), this.stream = null), 
        // This state must be assigned before calling onClose() to allow the callback to
        // inhibit backoff or otherwise manipulate the state in its non-started state.
        this.state = t, 
        // Notify the listener that the stream closed.
        await this.listener.Ni(e);
    }
    /**
     * Can be overridden to perform additional cleanup before the stream is closed.
     * Calling super.tearDown() is not required.
     */    Tr() {}
    auth() {
        this.state = 1 /* Starting */;
        const t = this.Er(this.rr), e = this.rr;
        // TODO(mikelehen): Just use dispatchIfNotClosed, but see TODO below.
                Promise.all([ this.authCredentialsProvider.getToken(), this.appCheckCredentialsProvider.getToken() ]).then((([t, n]) => {
            // Stream can be stopped while waiting for authentication.
            // TODO(mikelehen): We really should just use dispatchIfNotClosed
            // and let this dispatch onto the queue, but that opened a spec test can
            // of worms that I don't want to deal with in this PR.
            this.rr === e && 
            // Normally we'd have to schedule the callback on the AsyncQueue.
            // However, the following calls are safe to be called outside the
            // AsyncQueue since they don't chain asynchronous calls
            this.Ir(t, n);
        }), (e => {
            t((() => {
                const t = new Q(j.UNKNOWN, "Fetching auth token failed: " + e.message);
                return this.Ar(t);
            }));
        }));
    }
    Ir(t, e) {
        const n = this.Er(this.rr);
        this.stream = this.Rr(t, e), this.stream.Di((() => {
            n((() => (this.state = 2 /* Open */ , this.ar = this.Me.enqueueAfterDelay(this.sr, 1e4, (() => (this.lr() && (this.state = 3 /* Healthy */), 
            Promise.resolve()))), this.listener.Di())));
        })), this.stream.Ni((t => {
            n((() => this.Ar(t)));
        })), this.stream.onMessage((t => {
            n((() => this.onMessage(t)));
        }));
    }
    dr() {
        this.state = 5 /* Backoff */ , this.ur.Zi((async () => {
            this.state = 0 /* Initial */ , this.start();
        }));
    }
    // Visible for tests
    Ar(t) {
        // In theory the stream could close cleanly, however, in our current model
        // we never expect this to happen because if we stop a stream ourselves,
        // this callback will never be called. To prevent cases where we retry
        // without a backoff accidentally, we set the stream to error in all cases.
        return O("PersistentStream", `close with error: ${t}`), this.stream = null, this.close(4 /* Error */ , t);
    }
    /**
     * Returns a "dispatcher" function that dispatches operations onto the
     * AsyncQueue but only runs them if closeCount remains unchanged. This allows
     * us to turn auth / stream callbacks into no-ops if the stream is closed /
     * re-opened, etc.
     */    Er(t) {
        return e => {
            this.Me.enqueueAndForget((() => this.rr === t ? e() : (O("PersistentStream", "stream callback skipped by getCloseGuardedDispatcher."), 
            Promise.resolve())));
        };
    }
}

/**
 * A PersistentStream that implements the Listen RPC.
 *
 * Once the Listen stream has called the onOpen() listener, any number of
 * listen() and unlisten() calls can be made to control what changes will be
 * sent from the server for ListenResponses.
 */ class io extends so {
    constructor(t, e, n, s, i, r) {
        super(t, "listen_stream_connection_backoff" /* ListenStreamConnectionBackoff */ , "listen_stream_idle" /* ListenStreamIdle */ , "health_check_timeout" /* HealthCheckTimeout */ , e, n, s, r), 
        this.k = i;
    }
    Rr(t, e) {
        return this.ir.Qi("Listen", t, e);
    }
    onMessage(t) {
        // A successful response means the stream is healthy
        this.ur.reset();
        const e = os(this.k, t), n = function(t) {
            // We have only reached a consistent snapshot for the entire stream if there
            // is a read_time set and it applies to all targets (i.e. the list of
            // targets is empty). The backend is guaranteed to send such responses.
            if (!("targetChange" in t)) return ut.min();
            const e = t.targetChange;
            return e.targetIds && e.targetIds.length ? ut.min() : e.readTime ? zn(e.readTime) : ut.min();
        }(t);
        return this.listener.br(e, n);
    }
    /**
     * Registers interest in the results of the given target. If the target
     * includes a resumeToken it will be included in the request. Results that
     * affect the target will be streamed back as WatchChange messages that
     * reference the targetId.
     */    Pr(t) {
        const e = {};
        e.database = es(this.k), e.addTarget = function(t, e) {
            let n;
            const s = e.target;
            return n = Zt(s) ? {
                documents: hs(t, s)
            } : {
                query: ls(t, s)
            }, n.targetId = e.targetId, e.resumeToken.approximateByteSize() > 0 ? n.resumeToken = Wn(t, e.resumeToken) : e.snapshotVersion.compareTo(ut.min()) > 0 && (
            // TODO(wuandy): Consider removing above check because it is most likely true.
            // Right now, many tests depend on this behaviour though (leaving min() out
            // of serialization).
            n.readTime = Qn(t, e.snapshotVersion.toTimestamp())), n;
        }(this.k, t);
        const n = ds(this.k, t);
        n && (e.labels = n), this.gr(e);
    }
    /**
     * Unregisters interest in the results of the target associated with the
     * given targetId.
     */    vr(t) {
        const e = {};
        e.database = es(this.k), e.removeTarget = t, this.gr(e);
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Datastore and its related methods are a wrapper around the external Google
 * Cloud Datastore grpc API, which provides an interface that is more convenient
 * for the rest of the client SDK architecture to consume.
 */
/**
 * An implementation of Datastore that exposes additional state for internal
 * consumption.
 */
class oo extends class {} {
    constructor(t, e, n, s) {
        super(), this.authCredentials = t, this.appCheckCredentials = e, this.ir = n, this.k = s, 
        this.$r = !1;
    }
    Or() {
        if (this.$r) throw new Q(j.FAILED_PRECONDITION, "The client has already been terminated.");
    }
    /** Invokes the provided RPC with auth and AppCheck tokens. */    Bi(t, e, n) {
        return this.Or(), Promise.all([ this.authCredentials.getToken(), this.appCheckCredentials.getToken() ]).then((([s, i]) => this.ir.Bi(t, e, n, s, i))).catch((t => {
            throw "FirebaseError" === t.name ? (t.code === j.UNAUTHENTICATED && (this.authCredentials.invalidateToken(), 
            this.appCheckCredentials.invalidateToken()), t) : new Q(j.UNKNOWN, t.toString());
        }));
    }
    /** Invokes the provided RPC with streamed results with auth and AppCheck tokens. */    ji(t, e, n) {
        return this.Or(), Promise.all([ this.authCredentials.getToken(), this.appCheckCredentials.getToken() ]).then((([s, i]) => this.ir.ji(t, e, n, s, i))).catch((t => {
            throw "FirebaseError" === t.name ? (t.code === j.UNAUTHENTICATED && (this.authCredentials.invalidateToken(), 
            this.appCheckCredentials.invalidateToken()), t) : new Q(j.UNKNOWN, t.toString());
        }));
    }
    terminate() {
        this.$r = !0;
    }
}

// TODO(firestorexp): Make sure there is only one Datastore instance per
// firestore-exp client.
/**
 * A component used by the RemoteStore to track the OnlineState (that is,
 * whether or not the client as a whole should be considered to be online or
 * offline), implementing the appropriate heuristics.
 *
 * In particular, when the client is trying to connect to the backend, we
 * allow up to MAX_WATCH_STREAM_FAILURES within ONLINE_STATE_TIMEOUT_MS for
 * a connection to succeed. If we have too many failures or the timeout elapses,
 * then we set the OnlineState to Offline, and the client will behave as if
 * it is offline (get()s will return cached data, etc.).
 */
class co {
    constructor(t, e) {
        this.asyncQueue = t, this.onlineStateHandler = e, 
        /** The current OnlineState. */
        this.state = "Unknown" /* Unknown */ , 
        /**
         * A count of consecutive failures to open the stream. If it reaches the
         * maximum defined by MAX_WATCH_STREAM_FAILURES, we'll set the OnlineState to
         * Offline.
         */
        this.Mr = 0, 
        /**
         * A timer that elapses after ONLINE_STATE_TIMEOUT_MS, at which point we
         * transition from OnlineState.Unknown to OnlineState.Offline without waiting
         * for the stream to actually fail (MAX_WATCH_STREAM_FAILURES times).
         */
        this.Fr = null, 
        /**
         * Whether the client should log a warning message if it fails to connect to
         * the backend (initially true, cleared after a successful stream, or if we've
         * logged the message already).
         */
        this.Lr = !0;
    }
    /**
     * Called by RemoteStore when a watch stream is started (including on each
     * backoff attempt).
     *
     * If this is the first attempt, it sets the OnlineState to Unknown and starts
     * the onlineStateTimer.
     */    Br() {
        0 === this.Mr && (this.Ur("Unknown" /* Unknown */), this.Fr = this.asyncQueue.enqueueAfterDelay("online_state_timeout" /* OnlineStateTimeout */ , 1e4, (() => (this.Fr = null, 
        this.qr("Backend didn't respond within 10 seconds."), this.Ur("Offline" /* Offline */), 
        Promise.resolve()))));
    }
    /**
     * Updates our OnlineState as appropriate after the watch stream reports a
     * failure. The first failure moves us to the 'Unknown' state. We then may
     * allow multiple failures (based on MAX_WATCH_STREAM_FAILURES) before we
     * actually transition to the 'Offline' state.
     */    Kr(t) {
        "Online" /* Online */ === this.state ? this.Ur("Unknown" /* Unknown */) : (this.Mr++, 
        this.Mr >= 1 && (this.jr(), this.qr(`Connection failed 1 times. Most recent error: ${t.toString()}`), 
        this.Ur("Offline" /* Offline */)));
    }
    /**
     * Explicitly sets the OnlineState to the specified state.
     *
     * Note that this resets our timers / failure counters, etc. used by our
     * Offline heuristics, so must not be used in place of
     * handleWatchStreamStart() and handleWatchStreamFailure().
     */    set(t) {
        this.jr(), this.Mr = 0, "Online" /* Online */ === t && (
        // We've connected to watch at least once. Don't warn the developer
        // about being offline going forward.
        this.Lr = !1), this.Ur(t);
    }
    Ur(t) {
        t !== this.state && (this.state = t, this.onlineStateHandler(t));
    }
    qr(t) {
        const e = `Could not reach Cloud Firestore backend. ${t}\nThis typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;
        this.Lr ? (M(e), this.Lr = !1) : O("OnlineStateTracker", e);
    }
    jr() {
        null !== this.Fr && (this.Fr.cancel(), this.Fr = null);
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class ao {
    constructor(
    /**
     * The local store, used to fill the write pipeline with outbound mutations.
     */
    t, 
    /** The client-side proxy for interacting with the backend. */
    e, n, s, i) {
        this.localStore = t, this.datastore = e, this.asyncQueue = n, this.remoteSyncer = {}, 
        /**
         * A list of up to MAX_PENDING_WRITES writes that we have fetched from the
         * LocalStore via fillWritePipeline() and have or will send to the write
         * stream.
         *
         * Whenever writePipeline.length > 0 the RemoteStore will attempt to start or
         * restart the write stream. When the stream is established the writes in the
         * pipeline will be sent in order.
         *
         * Writes remain in writePipeline until they are acknowledged by the backend
         * and thus will automatically be re-sent if the stream is interrupted /
         * restarted before they're acknowledged.
         *
         * Write responses from the backend are linked to their originating request
         * purely based on order, and so we can just shift() writes from the front of
         * the writePipeline as we receive responses.
         */
        this.Qr = [], 
        /**
         * A mapping of watched targets that the client cares about tracking and the
         * user has explicitly called a 'listen' for this target.
         *
         * These targets may or may not have been sent to or acknowledged by the
         * server. On re-establishing the listen stream, these targets should be sent
         * to the server. The targets removed with unlistens are removed eagerly
         * without waiting for confirmation from the listen stream.
         */
        this.Wr = new Map, 
        /**
         * A set of reasons for why the RemoteStore may be offline. If empty, the
         * RemoteStore may start its network connections.
         */
        this.Gr = new Set, 
        /**
         * Event handlers that get called when the network is disabled or enabled.
         *
         * PORTING NOTE: These functions are used on the Web client to create the
         * underlying streams (to support tree-shakeable streams). On Android and iOS,
         * the streams are created during construction of RemoteStore.
         */
        this.zr = [], this.Hr = i, this.Hr.Ei((t => {
            n.enqueueAndForget((async () => {
                // Porting Note: Unlike iOS, `restartNetwork()` is called even when the
                // network becomes unreachable as we don't have any other way to tear
                // down our streams.
                yo(this) && (O("RemoteStore", "Restarting streams for network reachability change."), 
                await async function(t) {
                    const e = K(t);
                    e.Gr.add(4 /* ConnectivityChange */), await ho(e), e.Jr.set("Unknown" /* Unknown */), 
                    e.Gr.delete(4 /* ConnectivityChange */), await uo(e);
                }(this));
            }));
        })), this.Jr = new co(n, s);
    }
}

async function uo(t) {
    if (yo(t)) for (const e of t.zr) await e(/* enabled= */ !0);
}

/**
 * Temporarily disables the network. The network can be re-enabled using
 * enableNetwork().
 */ async function ho(t) {
    for (const e of t.zr) await e(/* enabled= */ !1);
}

/**
 * Starts new listen for the given target. Uses resume token if provided. It
 * is a no-op if the target of given `TargetData` is already being listened to.
 */
function lo(t, e) {
    const n = K(t);
    n.Wr.has(e.targetId) || (
    // Mark this as something the client is currently listening for.
    n.Wr.set(e.targetId, e), go(n) ? 
    // The listen will be sent in onWatchStreamOpen
    mo(n) : $o(n).lr() && wo(n, e));
}

/**
 * Removes the listen from server. It is a no-op if the given target id is
 * not being listened to.
 */ function fo(t, e) {
    const n = K(t), s = $o(n);
    n.Wr.delete(e), s.lr() && _o(n, e), 0 === n.Wr.size && (s.lr() ? s._r() : yo(n) && 
    // Revert to OnlineState.Unknown if the watch stream is not open and we
    // have no listeners, since without any listens to send we cannot
    // confirm if the stream is healthy and upgrade to OnlineState.Online.
    n.Jr.set("Unknown" /* Unknown */));
}

/**
 * We need to increment the the expected number of pending responses we're due
 * from watch so we wait for the ack to process any messages from this target.
 */ function wo(t, e) {
    t.Yr.X(e.targetId), $o(t).Pr(e);
}

/**
 * We need to increment the expected number of pending responses we're due
 * from watch so we wait for the removal on the server before we process any
 * messages from this target.
 */ function _o(t, e) {
    t.Yr.X(e), $o(t).vr(e);
}

function mo(t) {
    t.Yr = new Ln({
        getRemoteKeysForTarget: e => t.remoteSyncer.getRemoteKeysForTarget(e),
        Et: e => t.Wr.get(e) || null
    }), $o(t).start(), t.Jr.Br();
}

/**
 * Returns whether the watch stream should be started because it's necessary
 * and has not yet been started.
 */ function go(t) {
    return yo(t) && !$o(t).hr() && t.Wr.size > 0;
}

function yo(t) {
    return 0 === K(t).Gr.size;
}

function po(t) {
    t.Yr = void 0;
}

async function To(t) {
    t.Wr.forEach(((e, n) => {
        wo(t, e);
    }));
}

async function Eo(t, e) {
    po(t), 
    // If we still need the watch stream, retry the connection.
    go(t) ? (t.Jr.Kr(e), mo(t)) : 
    // No need to restart watch stream because there are no active targets.
    // The online state is set to unknown because there is no active attempt
    // at establishing a connection
    t.Jr.set("Unknown" /* Unknown */);
}

async function Io(t, e, n) {
    if (
    // Mark the client as online since we got a message from the server
    t.Jr.set("Online" /* Online */), e instanceof Mn && 2 /* Removed */ === e.state && e.cause) 
    // There was an error on a target, don't wait for a consistent snapshot
    // to raise events
    try {
        await 
        /** Handles an error on a target */
        async function(t, e) {
            const n = e.cause;
            for (const s of e.targetIds) 
            // A watched target might have been removed already.
            t.Wr.has(s) && (await t.remoteSyncer.rejectListen(s, n), t.Wr.delete(s), t.Yr.removeTarget(s));
        }
        /**
 * Attempts to fill our write pipeline with writes from the LocalStore.
 *
 * Called internally to bootstrap or refill the write pipeline and by
 * SyncEngine whenever there are new mutations to process.
 *
 * Starts the write stream if necessary.
 */ (t, e);
    } catch (n) {
        O("RemoteStore", "Failed to remove targets %s: %s ", e.targetIds.join(","), n), 
        await Ao(t, n);
    } else if (e instanceof $n ? t.Yr.ot(e) : e instanceof On ? t.Yr.dt(e) : t.Yr.ut(e), 
    !n.isEqual(ut.min())) try {
        const e = await mr(t.localStore);
        n.compareTo(e) >= 0 && 
        // We have received a target change with a global snapshot if the snapshot
        // version is not equal to SnapshotVersion.min().
        await 
        /**
 * Takes a batch of changes from the Datastore, repackages them as a
 * RemoteEvent, and passes that on to the listener, which is typically the
 * SyncEngine.
 */
        function(t, e) {
            const n = t.Yr.gt(e);
            // Update in-memory resume tokens. LocalStore will update the
            // persistent view of these when applying the completed RemoteEvent.
                        return n.targetChanges.forEach(((n, s) => {
                if (n.resumeToken.approximateByteSize() > 0) {
                    const i = t.Wr.get(s);
                    // A watched target might have been removed already.
                                        i && t.Wr.set(s, i.withResumeToken(n.resumeToken, e));
                }
            })), 
            // Re-establish listens for the targets that have been invalidated by
            // existence filter mismatches.
            n.targetMismatches.forEach((e => {
                const n = t.Wr.get(e);
                if (!n) 
                // A watched target might have been removed already.
                return;
                // Clear the resume token for the target, since we're in a known mismatch
                // state.
                                t.Wr.set(e, n.withResumeToken(pt.EMPTY_BYTE_STRING, n.snapshotVersion)), 
                // Cause a hard reset by unwatching and rewatching immediately, but
                // deliberately don't send a resume token so that we get a full update.
                _o(t, e);
                // Mark the target we send as being on behalf of an existence filter
                // mismatch, but don't actually retain that in listenTargets. This ensures
                // that we flag the first re-listen this way without impacting future
                // listens of this target (that might happen e.g. on reconnect).
                const s = new ai(n.target, e, 1 /* ExistenceFilterMismatch */ , n.sequenceNumber);
                wo(t, s);
            })), t.remoteSyncer.applyRemoteEvent(n);
        }(t, n);
    } catch (e) {
        O("RemoteStore", "Failed to raise snapshot:", e), await Ao(t, e);
    }
}

/**
 * Recovery logic for IndexedDB errors that takes the network offline until
 * `op` succeeds. Retries are scheduled with backoff using
 * `enqueueRetryable()`. If `op()` is not provided, IndexedDB access is
 * validated via a generic operation.
 *
 * The returned Promise is resolved once the network is disabled and before
 * any retry attempt.
 */ async function Ao(t, e, n) {
    if (!Zs(e)) throw e;
    t.Gr.add(1 /* IndexedDbFailed */), 
    // Disable network and raise offline snapshots
    await ho(t), t.Jr.set("Offline" /* Offline */), n || (
    // Use a simple read operation to determine if IndexedDB recovered.
    // Ideally, we would expose a health check directly on SimpleDb, but
    // RemoteStore only has access to persistence through LocalStore.
    n = () => mr(t.localStore)), 
    // Probe IndexedDB periodically and re-enable network
    t.asyncQueue.enqueueRetryable((async () => {
        O("RemoteStore", "Retrying IndexedDB access"), await n(), t.Gr.delete(1 /* IndexedDbFailed */), 
        await uo(t);
    }));
}

/**
 * Toggles the network state when the client gains or loses its primary lease.
 */
async function xo(t, e) {
    const n = K(t);
    e ? (n.Gr.delete(2 /* IsSecondary */), await uo(n)) : e || (n.Gr.add(2 /* IsSecondary */), 
    await ho(n), n.Jr.set("Unknown" /* Unknown */));
}

/**
 * If not yet initialized, registers the WatchStream and its network state
 * callback with `remoteStoreImpl`. Returns the existing stream if one is
 * already available.
 *
 * PORTING NOTE: On iOS and Android, the WatchStream gets registered on startup.
 * This is not done on Web to allow it to be tree-shaken.
 */ function $o(t) {
    return t.Xr || (
    // Create stream (but note that it is not started yet).
    t.Xr = function(t, e, n) {
        const s = K(t);
        return s.Or(), new io(e, s.ir, s.authCredentials, s.appCheckCredentials, s.k, n);
    }
    /**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ (t.datastore, t.asyncQueue, {
        Di: To.bind(null, t),
        Ni: Eo.bind(null, t),
        br: Io.bind(null, t)
    }), t.zr.push((async e => {
        e ? (t.Xr.wr(), go(t) ? mo(t) : t.Jr.set("Unknown" /* Unknown */)) : (await t.Xr.stop(), 
        po(t));
    }))), t.Xr;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Represents an operation scheduled to be run in the future on an AsyncQueue.
 *
 * It is created via DelayedOperation.createAndSchedule().
 *
 * Supports cancellation (via cancel()) and early execution (via skipDelay()).
 *
 * Note: We implement `PromiseLike` instead of `Promise`, as the `Promise` type
 * in newer versions of TypeScript defines `finally`, which is not available in
 * IE.
 */
class Mo {
    constructor(t, e, n, s, i) {
        this.asyncQueue = t, this.timerId = e, this.targetTimeMs = n, this.op = s, this.removalCallback = i, 
        this.deferred = new W, this.then = this.deferred.promise.then.bind(this.deferred.promise), 
        // It's normal for the deferred promise to be canceled (due to cancellation)
        // and so we attach a dummy catch callback to avoid
        // 'UnhandledPromiseRejectionWarning' log spam.
        this.deferred.promise.catch((t => {}));
    }
    /**
     * Creates and returns a DelayedOperation that has been scheduled to be
     * executed on the provided asyncQueue after the provided delayMs.
     *
     * @param asyncQueue - The queue to schedule the operation on.
     * @param id - A Timer ID identifying the type of operation this is.
     * @param delayMs - The delay (ms) before the operation should be scheduled.
     * @param op - The operation to run.
     * @param removalCallback - A callback to be called synchronously once the
     *   operation is executed or canceled, notifying the AsyncQueue to remove it
     *   from its delayedOperations list.
     *   PORTING NOTE: This exists to prevent making removeDelayedOperation() and
     *   the DelayedOperation class public.
     */    static createAndSchedule(t, e, n, s, i) {
        const r = Date.now() + n, o = new Mo(t, e, r, s, i);
        return o.start(n), o;
    }
    /**
     * Starts the timer. This is called immediately after construction by
     * createAndSchedule().
     */    start(t) {
        this.timerHandle = setTimeout((() => this.handleDelayElapsed()), t);
    }
    /**
     * Queues the operation to run immediately (if it hasn't already been run or
     * canceled).
     */    skipDelay() {
        return this.handleDelayElapsed();
    }
    /**
     * Cancels the operation if it hasn't already been executed or canceled. The
     * promise will be rejected.
     *
     * As long as the operation has not yet been run, calling cancel() provides a
     * guarantee that the operation will not be run.
     */    cancel(t) {
        null !== this.timerHandle && (this.clearTimeout(), this.deferred.reject(new Q(j.CANCELLED, "Operation cancelled" + (t ? ": " + t : ""))));
    }
    handleDelayElapsed() {
        this.asyncQueue.enqueueAndForget((() => null !== this.timerHandle ? (this.clearTimeout(), 
        this.op().then((t => this.deferred.resolve(t)))) : Promise.resolve()));
    }
    clearTimeout() {
        null !== this.timerHandle && (this.removalCallback(this), clearTimeout(this.timerHandle), 
        this.timerHandle = null);
    }
}

/**
 * Returns a FirestoreError that can be surfaced to the user if the provided
 * error is an IndexedDbTransactionError. Re-throws the error otherwise.
 */ function Fo(t, e) {
    if (M("AsyncQueue", `${e}: ${t}`), Zs(t)) return new Q(j.UNAVAILABLE, `${e}: ${t}`);
    throw t;
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * DocumentSet is an immutable (copy-on-write) collection that holds documents
 * in order specified by the provided comparator. We always add a document key
 * comparator on top of what is provided to guarantee document equality based on
 * the key.
 */ class Lo {
    /** The default ordering is by key if the comparator is omitted */
    constructor(t) {
        // We are adding document key comparator to the end as it's the only
        // guaranteed unique property of a document.
        this.comparator = t ? (e, n) => t(e, n) || Dt.comparator(e.key, n.key) : (t, e) => Dt.comparator(t.key, e.key), 
        this.keyedMap = Pn(), this.sortedSet = new yn(this.comparator);
    }
    /**
     * Returns an empty copy of the existing DocumentSet, using the same
     * comparator.
     */    static emptySet(t) {
        return new Lo(t.comparator);
    }
    has(t) {
        return null != this.keyedMap.get(t);
    }
    get(t) {
        return this.keyedMap.get(t);
    }
    first() {
        return this.sortedSet.minKey();
    }
    last() {
        return this.sortedSet.maxKey();
    }
    isEmpty() {
        return this.sortedSet.isEmpty();
    }
    /**
     * Returns the index of the provided key in the document set, or -1 if the
     * document key is not present in the set;
     */    indexOf(t) {
        const e = this.keyedMap.get(t);
        return e ? this.sortedSet.indexOf(e) : -1;
    }
    get size() {
        return this.sortedSet.size;
    }
    /** Iterates documents in order defined by "comparator" */    forEach(t) {
        this.sortedSet.inorderTraversal(((e, n) => (t(e), !1)));
    }
    /** Inserts or updates a document with the same key */    add(t) {
        // First remove the element if we have it.
        const e = this.delete(t.key);
        return e.copy(e.keyedMap.insert(t.key, t), e.sortedSet.insert(t, null));
    }
    /** Deletes a document with a given key */    delete(t) {
        const e = this.get(t);
        return e ? this.copy(this.keyedMap.remove(t), this.sortedSet.remove(e)) : this;
    }
    isEqual(t) {
        if (!(t instanceof Lo)) return !1;
        if (this.size !== t.size) return !1;
        const e = this.sortedSet.getIterator(), n = t.sortedSet.getIterator();
        for (;e.hasNext(); ) {
            const t = e.getNext().key, s = n.getNext().key;
            if (!t.isEqual(s)) return !1;
        }
        return !0;
    }
    toString() {
        const t = [];
        return this.forEach((e => {
            t.push(e.toString());
        })), 0 === t.length ? "DocumentSet ()" : "DocumentSet (\n  " + t.join("  \n") + "\n)";
    }
    copy(t, e) {
        const n = new Lo;
        return n.comparator = this.comparator, n.keyedMap = t, n.sortedSet = e, n;
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * DocumentChangeSet keeps track of a set of changes to docs in a query, merging
 * duplicate events for the same doc.
 */ class Bo {
    constructor() {
        this.eo = new yn(Dt.comparator);
    }
    track(t) {
        const e = t.doc.key, n = this.eo.get(e);
        n ? 
        // Merge the new change with the existing change.
        0 /* Added */ !== t.type && 3 /* Metadata */ === n.type ? this.eo = this.eo.insert(e, t) : 3 /* Metadata */ === t.type && 1 /* Removed */ !== n.type ? this.eo = this.eo.insert(e, {
            type: n.type,
            doc: t.doc
        }) : 2 /* Modified */ === t.type && 2 /* Modified */ === n.type ? this.eo = this.eo.insert(e, {
            type: 2 /* Modified */ ,
            doc: t.doc
        }) : 2 /* Modified */ === t.type && 0 /* Added */ === n.type ? this.eo = this.eo.insert(e, {
            type: 0 /* Added */ ,
            doc: t.doc
        }) : 1 /* Removed */ === t.type && 0 /* Added */ === n.type ? this.eo = this.eo.remove(e) : 1 /* Removed */ === t.type && 2 /* Modified */ === n.type ? this.eo = this.eo.insert(e, {
            type: 1 /* Removed */ ,
            doc: n.doc
        }) : 0 /* Added */ === t.type && 1 /* Removed */ === n.type ? this.eo = this.eo.insert(e, {
            type: 2 /* Modified */ ,
            doc: t.doc
        }) : 
        // This includes these cases, which don't make sense:
        // Added->Added
        // Removed->Removed
        // Modified->Added
        // Removed->Modified
        // Metadata->Added
        // Removed->Metadata
        B() : this.eo = this.eo.insert(e, t);
    }
    no() {
        const t = [];
        return this.eo.inorderTraversal(((e, n) => {
            t.push(n);
        })), t;
    }
}

class Uo {
    constructor(t, e, n, s, i, r, o, c) {
        this.query = t, this.docs = e, this.oldDocs = n, this.docChanges = s, this.mutatedKeys = i, 
        this.fromCache = r, this.syncStateChanged = o, this.excludesMetadataChanges = c;
    }
    /** Returns a view snapshot as if all documents in the snapshot were added. */    static fromInitialDocuments(t, e, n, s) {
        const i = [];
        return e.forEach((t => {
            i.push({
                type: 0 /* Added */ ,
                doc: t
            });
        })), new Uo(t, e, Lo.emptySet(e), i, n, s, 
        /* syncStateChanged= */ !0, 
        /* excludesMetadataChanges= */ !1);
    }
    get hasPendingWrites() {
        return !this.mutatedKeys.isEmpty();
    }
    isEqual(t) {
        if (!(this.fromCache === t.fromCache && this.syncStateChanged === t.syncStateChanged && this.mutatedKeys.isEqual(t.mutatedKeys) && ve(this.query, t.query) && this.docs.isEqual(t.docs) && this.oldDocs.isEqual(t.oldDocs))) return !1;
        const e = this.docChanges, n = t.docChanges;
        if (e.length !== n.length) return !1;
        for (let t = 0; t < e.length; t++) if (e[t].type !== n[t].type || !e[t].doc.isEqual(n[t].doc)) return !1;
        return !0;
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Holds the listeners and the last received ViewSnapshot for a query being
 * tracked by EventManager.
 */ class qo {
    constructor() {
        this.so = void 0, this.listeners = [];
    }
}

class Ko {
    constructor() {
        this.queries = new zi((t => Ve(t)), ve), this.onlineState = "Unknown" /* Unknown */ , 
        this.io = new Set;
    }
}

async function jo(t, e) {
    const n = K(t), s = e.query;
    let i = !1, r = n.queries.get(s);
    if (r || (i = !0, r = new qo), i) try {
        r.so = await n.onListen(s);
    } catch (t) {
        const n = Fo(t, `Initialization of query '${Se(e.query)}' failed`);
        return void e.onError(n);
    }
    if (n.queries.set(s, r), r.listeners.push(e), 
    // Run global snapshot listeners if a consistent snapshot has been emitted.
    e.ro(n.onlineState), r.so) {
        e.oo(r.so) && zo(n);
    }
}

async function Qo(t, e) {
    const n = K(t), s = e.query;
    let i = !1;
    const r = n.queries.get(s);
    if (r) {
        const t = r.listeners.indexOf(e);
        t >= 0 && (r.listeners.splice(t, 1), i = 0 === r.listeners.length);
    }
    if (i) return n.queries.delete(s), n.onUnlisten(s);
}

function Wo(t, e) {
    const n = K(t);
    let s = !1;
    for (const t of e) {
        const e = t.query, i = n.queries.get(e);
        if (i) {
            for (const e of i.listeners) e.oo(t) && (s = !0);
            i.so = t;
        }
    }
    s && zo(n);
}

function Go(t, e, n) {
    const s = K(t), i = s.queries.get(e);
    if (i) for (const t of i.listeners) t.onError(n);
    // Remove all listeners. NOTE: We don't need to call syncEngine.unlisten()
    // after an error.
        s.queries.delete(e);
}

// Call all global snapshot listeners that have been set.
function zo(t) {
    t.io.forEach((t => {
        t.next();
    }));
}

/**
 * QueryListener takes a series of internal view snapshots and determines
 * when to raise the event.
 *
 * It uses an Observer to dispatch events.
 */ class Ho {
    constructor(t, e, n) {
        this.query = t, this.co = e, 
        /**
         * Initial snapshots (e.g. from cache) may not be propagated to the wrapped
         * observer. This flag is set to true once we've actually raised an event.
         */
        this.ao = !1, this.uo = null, this.onlineState = "Unknown" /* Unknown */ , this.options = n || {};
    }
    /**
     * Applies the new ViewSnapshot to this listener, raising a user-facing event
     * if applicable (depending on what changed, whether the user has opted into
     * metadata-only changes, etc.). Returns true if a user-facing event was
     * indeed raised.
     */    oo(t) {
        if (!this.options.includeMetadataChanges) {
            // Remove the metadata only changes.
            const e = [];
            for (const n of t.docChanges) 3 /* Metadata */ !== n.type && e.push(n);
            t = new Uo(t.query, t.docs, t.oldDocs, e, t.mutatedKeys, t.fromCache, t.syncStateChanged, 
            /* excludesMetadataChanges= */ !0);
        }
        let e = !1;
        return this.ao ? this.ho(t) && (this.co.next(t), e = !0) : this.lo(t, this.onlineState) && (this.fo(t), 
        e = !0), this.uo = t, e;
    }
    onError(t) {
        this.co.error(t);
    }
    /** Returns whether a snapshot was raised. */    ro(t) {
        this.onlineState = t;
        let e = !1;
        return this.uo && !this.ao && this.lo(this.uo, t) && (this.fo(this.uo), e = !0), 
        e;
    }
    lo(t, e) {
        // Always raise the first event when we're synced
        if (!t.fromCache) return !0;
        // NOTE: We consider OnlineState.Unknown as online (it should become Offline
        // or Online if we wait long enough).
                const n = "Offline" /* Offline */ !== e;
        // Don't raise the event if we're online, aren't synced yet (checked
        // above) and are waiting for a sync.
                return (!this.options.wo || !n) && (!t.docs.isEmpty() || "Offline" /* Offline */ === e);
        // Raise data from cache if we have any documents or we are offline
        }
    ho(t) {
        // We don't need to handle includeDocumentMetadataChanges here because
        // the Metadata only changes have already been stripped out if needed.
        // At this point the only changes we will see are the ones we should
        // propagate.
        if (t.docChanges.length > 0) return !0;
        const e = this.uo && this.uo.hasPendingWrites !== t.hasPendingWrites;
        return !(!t.syncStateChanged && !e) && !0 === this.options.includeMetadataChanges;
        // Generally we should have hit one of the cases above, but it's possible
        // to get here if there were only metadata docChanges and they got
        // stripped out.
        }
    fo(t) {
        t = Uo.fromInitialDocuments(t.query, t.docs, t.mutatedKeys, t.fromCache), this.ao = !0, 
        this.co.next(t);
    }
}

/**
 * Returns a `LoadBundleTaskProgress` representing the progress that the loading
 * has succeeded.
 */
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class tc {
    constructor(t) {
        this.key = t;
    }
}

class ec {
    constructor(t) {
        this.key = t;
    }
}

/**
 * View is responsible for computing the final merged truth of what docs are in
 * a query. It gets notified of local and remote changes to docs, and applies
 * the query filters and limits to determine the most correct possible results.
 */ class nc {
    constructor(t, 
    /** Documents included in the remote target */
    e) {
        this.query = t, this.To = e, this.Eo = null, 
        /**
         * A flag whether the view is current with the backend. A view is considered
         * current after it has seen the current flag from the backend and did not
         * lose consistency within the watch stream (e.g. because of an existence
         * filter mismatch).
         */
        this.current = !1, 
        /** Documents in the view but not in the remote target */
        this.Io = Dn(), 
        /** Document Keys that have local changes */
        this.mutatedKeys = Dn(), this.Ao = Ce(t), this.Ro = new Lo(this.Ao);
    }
    /**
     * The set of remote documents that the server has told us belongs to the target associated with
     * this view.
     */    get bo() {
        return this.To;
    }
    /**
     * Iterates over a set of doc changes, applies the query limit, and computes
     * what the new results should be, what the changes were, and whether we may
     * need to go back to the local cache for more results. Does not make any
     * changes to the view.
     * @param docChanges - The doc changes to apply to this view.
     * @param previousChanges - If this is being called with a refill, then start
     *        with this set of docs and changes instead of the current view.
     * @returns a new set of docs, changes, and refill flag.
     */    Po(t, e) {
        const n = e ? e.vo : new Bo, s = e ? e.Ro : this.Ro;
        let i = e ? e.mutatedKeys : this.mutatedKeys, r = s, o = !1;
        // Track the last doc in a (full) limit. This is necessary, because some
        // update (a delete, or an update moving a doc past the old limit) might
        // mean there is some other document in the local cache that either should
        // come (1) between the old last limit doc and the new last document, in the
        // case of updates, or (2) after the new last document, in the case of
        // deletes. So we keep this doc at the old limit to compare the updates to.
        // Note that this should never get used in a refill (when previousChanges is
        // set), because there will only be adds -- no deletes or updates.
        const c = pe(this.query) && s.size === this.query.limit ? s.last() : null, a = Te(this.query) && s.size === this.query.limit ? s.first() : null;
        // Drop documents out to meet limit/limitToLast requirement.
        if (t.inorderTraversal(((t, e) => {
            const u = s.get(t), h = De(this.query, e) ? e : null, l = !!u && this.mutatedKeys.has(u.key), f = !!h && (h.hasLocalMutations || 
            // We only consider committed mutations for documents that were
            // mutated during the lifetime of the view.
            this.mutatedKeys.has(h.key) && h.hasCommittedMutations);
            let d = !1;
            // Calculate change
                        if (u && h) {
                u.data.isEqual(h.data) ? l !== f && (n.track({
                    type: 3 /* Metadata */ ,
                    doc: h
                }), d = !0) : this.Vo(u, h) || (n.track({
                    type: 2 /* Modified */ ,
                    doc: h
                }), d = !0, (c && this.Ao(h, c) > 0 || a && this.Ao(h, a) < 0) && (
                // This doc moved from inside the limit to outside the limit.
                // That means there may be some other doc in the local cache
                // that should be included instead.
                o = !0));
            } else !u && h ? (n.track({
                type: 0 /* Added */ ,
                doc: h
            }), d = !0) : u && !h && (n.track({
                type: 1 /* Removed */ ,
                doc: u
            }), d = !0, (c || a) && (
            // A doc was removed from a full limit query. We'll need to
            // requery from the local cache to see if we know about some other
            // doc that should be in the results.
            o = !0));
            d && (h ? (r = r.add(h), i = f ? i.add(t) : i.delete(t)) : (r = r.delete(t), i = i.delete(t)));
        })), pe(this.query) || Te(this.query)) for (;r.size > this.query.limit; ) {
            const t = pe(this.query) ? r.last() : r.first();
            r = r.delete(t.key), i = i.delete(t.key), n.track({
                type: 1 /* Removed */ ,
                doc: t
            });
        }
        return {
            Ro: r,
            vo: n,
            Bn: o,
            mutatedKeys: i
        };
    }
    Vo(t, e) {
        // We suppress the initial change event for documents that were modified as
        // part of a write acknowledgment (e.g. when the value of a server transform
        // is applied) as Watch will send us the same document again.
        // By suppressing the event, we only raise two user visible events (one with
        // `hasPendingWrites` and the final state of the document) instead of three
        // (one with `hasPendingWrites`, the modified document with
        // `hasPendingWrites` and the final state of the document).
        return t.hasLocalMutations && e.hasCommittedMutations && !e.hasLocalMutations;
    }
    /**
     * Updates the view with the given ViewDocumentChanges and optionally updates
     * limbo docs and sync state from the provided target change.
     * @param docChanges - The set of changes to make to the view's docs.
     * @param updateLimboDocuments - Whether to update limbo documents based on
     *        this change.
     * @param targetChange - A target change to apply for computing limbo docs and
     *        sync state.
     * @returns A new ViewChange with the given docs, changes, and sync state.
     */
    // PORTING NOTE: The iOS/Android clients always compute limbo document changes.
    applyChanges(t, e, n) {
        const s = this.Ro;
        this.Ro = t.Ro, this.mutatedKeys = t.mutatedKeys;
        // Sort changes based on type and query comparator
        const i = t.vo.no();
        i.sort(((t, e) => function(t, e) {
            const n = t => {
                switch (t) {
                  case 0 /* Added */ :
                    return 1;

                  case 2 /* Modified */ :
                  case 3 /* Metadata */ :
                    // A metadata change is converted to a modified change at the public
                    // api layer.  Since we sort by document key and then change type,
                    // metadata and modified changes must be sorted equivalently.
                    return 2;

                  case 1 /* Removed */ :
                    return 0;

                  default:
                    return B();
                }
            };
            return n(t) - n(e);
        }
        /**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ (t.type, e.type) || this.Ao(t.doc, e.doc))), this.So(n);
        const r = e ? this.Do() : [], o = 0 === this.Io.size && this.current ? 1 /* Synced */ : 0 /* Local */ , c = o !== this.Eo;
        if (this.Eo = o, 0 !== i.length || c) {
            return {
                snapshot: new Uo(this.query, t.Ro, s, i, t.mutatedKeys, 0 /* Local */ === o, c, 
                /* excludesMetadataChanges= */ !1),
                Co: r
            };
        }
        // no changes
        return {
            Co: r
        };
    }
    /**
     * Applies an OnlineState change to the view, potentially generating a
     * ViewChange if the view's syncState changes as a result.
     */    ro(t) {
        return this.current && "Offline" /* Offline */ === t ? (
        // If we're offline, set `current` to false and then call applyChanges()
        // to refresh our syncState and generate a ViewChange as appropriate. We
        // are guaranteed to get a new TargetChange that sets `current` back to
        // true once the client is back online.
        this.current = !1, this.applyChanges({
            Ro: this.Ro,
            vo: new Bo,
            mutatedKeys: this.mutatedKeys,
            Bn: !1
        }, 
        /* updateLimboDocuments= */ !1)) : {
            Co: []
        };
    }
    /**
     * Returns whether the doc for the given key should be in limbo.
     */    No(t) {
        // If the remote end says it's part of this query, it's not in limbo.
        return !this.To.has(t) && (
        // The local store doesn't think it's a result, so it shouldn't be in limbo.
        !!this.Ro.has(t) && !this.Ro.get(t).hasLocalMutations);
    }
    /**
     * Updates syncedDocuments, current, and limbo docs based on the given change.
     * Returns the list of changes to which docs are in limbo.
     */    So(t) {
        t && (t.addedDocuments.forEach((t => this.To = this.To.add(t))), t.modifiedDocuments.forEach((t => {})), 
        t.removedDocuments.forEach((t => this.To = this.To.delete(t))), this.current = t.current);
    }
    Do() {
        // We can only determine limbo documents when we're in-sync with the server.
        if (!this.current) return [];
        // TODO(klimt): Do this incrementally so that it's not quadratic when
        // updating many documents.
                const t = this.Io;
        this.Io = Dn(), this.Ro.forEach((t => {
            this.No(t.key) && (this.Io = this.Io.add(t.key));
        }));
        // Diff the new limbo docs with the old limbo docs.
        const e = [];
        return t.forEach((t => {
            this.Io.has(t) || e.push(new ec(t));
        })), this.Io.forEach((n => {
            t.has(n) || e.push(new tc(n));
        })), e;
    }
    /**
     * Update the in-memory state of the current view with the state read from
     * persistence.
     *
     * We update the query view whenever a client's primary status changes:
     * - When a client transitions from primary to secondary, it can miss
     *   LocalStorage updates and its query views may temporarily not be
     *   synchronized with the state on disk.
     * - For secondary to primary transitions, the client needs to update the list
     *   of `syncedDocuments` since secondary clients update their query views
     *   based purely on synthesized RemoteEvents.
     *
     * @param queryResult.documents - The documents that match the query according
     * to the LocalStore.
     * @param queryResult.remoteKeys - The keys of the documents that match the
     * query according to the backend.
     *
     * @returns The ViewChange that resulted from this synchronization.
     */
    // PORTING NOTE: Multi-tab only.
    ko(t) {
        this.To = t.zn, this.Io = Dn();
        const e = this.Po(t.documents);
        return this.applyChanges(e, /*updateLimboDocuments=*/ !0);
    }
    /**
     * Returns a view snapshot as if this query was just listened to. Contains
     * a document add for every existing document and the `fromCache` and
     * `hasPendingWrites` status of the already established view.
     */
    // PORTING NOTE: Multi-tab only.
    xo() {
        return Uo.fromInitialDocuments(this.query, this.Ro, this.mutatedKeys, 0 /* Local */ === this.Eo);
    }
}

/**
 * QueryView contains all of the data that SyncEngine needs to keep track of for
 * a particular query.
 */
class sc {
    constructor(
    /**
     * The query itself.
     */
    t, 
    /**
     * The target number created by the client that is used in the watch
     * stream to identify this query.
     */
    e, 
    /**
     * The view is responsible for computing the final merged truth of what
     * docs are in the query. It gets notified of local and remote changes,
     * and applies the query filters and limits to determine the most correct
     * possible results.
     */
    n) {
        this.query = t, this.targetId = e, this.view = n;
    }
}

/** Tracks a limbo resolution. */ class ic {
    constructor(t) {
        this.key = t, 
        /**
         * Set to true once we've received a document. This is used in
         * getRemoteKeysForTarget() and ultimately used by WatchChangeAggregator to
         * decide whether it needs to manufacture a delete event for the target once
         * the target is CURRENT.
         */
        this.$o = !1;
    }
}

/**
 * An implementation of `SyncEngine` coordinating with other parts of SDK.
 *
 * The parts of SyncEngine that act as a callback to RemoteStore need to be
 * registered individually. This is done in `syncEngineWrite()` and
 * `syncEngineListen()` (as well as `applyPrimaryState()`) as these methods
 * serve as entry points to RemoteStore's functionality.
 *
 * Note: some field defined in this class might have public access level, but
 * the class is not exported so they are only accessible from this module.
 * This is useful to implement optional features (like bundles) in free
 * functions, such that they are tree-shakeable.
 */ class rc {
    constructor(t, e, n, 
    // PORTING NOTE: Manages state synchronization in multi-tab environments.
    s, i, r) {
        this.localStore = t, this.remoteStore = e, this.eventManager = n, this.sharedClientState = s, 
        this.currentUser = i, this.maxConcurrentLimboResolutions = r, this.Oo = {}, this.Mo = new zi((t => Ve(t)), ve), 
        this.Fo = new Map, 
        /**
         * The keys of documents that are in limbo for which we haven't yet started a
         * limbo resolution query. The strings in this set are the result of calling
         * `key.path.canonicalString()` where `key` is a `DocumentKey` object.
         *
         * The `Set` type was chosen because it provides efficient lookup and removal
         * of arbitrary elements and it also maintains insertion order, providing the
         * desired queue-like FIFO semantics.
         */
        this.Lo = new Set, 
        /**
         * Keeps track of the target ID for each document that is in limbo with an
         * active target.
         */
        this.Bo = new yn(Dt.comparator), 
        /**
         * Keeps track of the information about an active limbo resolution for each
         * active target ID that was started for the purpose of limbo resolution.
         */
        this.Uo = new Map, this.qo = new Sr, 
        /** Stores user completion handlers, indexed by User and BatchId. */
        this.Ko = {}, 
        /** Stores user callbacks waiting for all pending writes to be acknowledged. */
        this.jo = new Map, this.Qo = Oi.re(), this.onlineState = "Unknown" /* Unknown */ , 
        // The primary state is set to `true` or `false` immediately after Firestore
        // startup. In the interim, a client should only be considered primary if
        // `isPrimary` is true.
        this.Wo = void 0;
    }
    get isPrimaryClient() {
        return !0 === this.Wo;
    }
}

/**
 * Initiates the new listen, resolves promise when listen enqueued to the
 * server. All the subsequent view snapshots or errors are sent to the
 * subscribed handlers. Returns the initial snapshot.
 */
async function oc(t, e) {
    const n = $c(t);
    let s, i;
    const r = n.Mo.get(e);
    if (r) 
    // PORTING NOTE: With Multi-Tab Web, it is possible that a query view
    // already exists when EventManager calls us for the first time. This
    // happens when the primary tab is already listening to this query on
    // behalf of another tab and the user of the primary also starts listening
    // to the query. EventManager will not have an assigned target ID in this
    // case and calls `listen` to obtain this ID.
    s = r.targetId, n.sharedClientState.addLocalQueryTarget(s), i = r.view.xo(); else {
        const t = await Tr(n.localStore, be(e)), r = n.sharedClientState.addLocalQueryTarget(t.targetId);
        s = t.targetId, i = await cc(n, e, s, "current" === r), n.isPrimaryClient && lo(n.remoteStore, t);
    }
    return i;
}

/**
 * Registers a view for a previously unknown query and computes its initial
 * snapshot.
 */ async function cc(t, e, n, s) {
    // PORTING NOTE: On Web only, we inject the code that registers new Limbo
    // targets based on view changes. This allows us to only depend on Limbo
    // changes when user code includes queries.
    t.Go = (e, n, s) => async function(t, e, n, s) {
        let i = e.view.Po(n);
        i.Bn && (
        // The query has a limit and some docs were removed, so we need
        // to re-run the query against the local store to make sure we
        // didn't lose any good docs that had been past the limit.
        i = await Ir(t.localStore, e.query, 
        /* usePreviousResults= */ !1).then((({documents: t}) => e.view.Po(t, i))));
        const r = s && s.targetChanges.get(e.targetId), o = e.view.applyChanges(i, 
        /* updateLimboDocuments= */ t.isPrimaryClient, r);
        return Tc(t, e.targetId, o.Co), o.snapshot;
    }(t, e, n, s);
    const i = await Ir(t.localStore, e, 
    /* usePreviousResults= */ !0), r = new nc(e, i.zn), o = r.Po(i.documents), c = xn.createSynthesizedTargetChangeForCurrentChange(n, s && "Offline" /* Offline */ !== t.onlineState), a = r.applyChanges(o, 
    /* updateLimboDocuments= */ t.isPrimaryClient, c);
    Tc(t, n, a.Co);
    const u = new sc(e, n, r);
    return t.Mo.set(e, u), t.Fo.has(n) ? t.Fo.get(n).push(e) : t.Fo.set(n, [ e ]), a.snapshot;
}

/** Stops listening to the query. */ async function ac(t, e) {
    const n = K(t), s = n.Mo.get(e), i = n.Fo.get(s.targetId);
    if (i.length > 1) return n.Fo.set(s.targetId, i.filter((t => !ve(t, e)))), void n.Mo.delete(e);
    // No other queries are mapped to the target, clean up the query and the target.
        if (n.isPrimaryClient) {
        // We need to remove the local query target first to allow us to verify
        // whether any other client is still interested in this target.
        n.sharedClientState.removeLocalQueryTarget(s.targetId);
        n.sharedClientState.isActiveQueryTarget(s.targetId) || await Er(n.localStore, s.targetId, 
        /*keepPersistedTargetData=*/ !1).then((() => {
            n.sharedClientState.clearQueryState(s.targetId), fo(n.remoteStore, s.targetId), 
            yc(n, s.targetId);
        })).catch(Ui);
    } else yc(n, s.targetId), await Er(n.localStore, s.targetId, 
    /*keepPersistedTargetData=*/ !0);
}

/**
 * Applies one remote event to the sync engine, notifying any views of the
 * changes, and releasing any pending mutation batches that would become
 * visible because of the snapshot version the remote event contains.
 */ async function hc(t, e) {
    const n = K(t);
    try {
        const t = await gr(n.localStore, e);
        // Update `receivedDocument` as appropriate for any limbo targets.
                e.targetChanges.forEach(((t, e) => {
            const s = n.Uo.get(e);
            s && (
            // Since this is a limbo resolution lookup, it's for a single document
            // and it could be added, modified, or removed, but not a combination.
            U(t.addedDocuments.size + t.modifiedDocuments.size + t.removedDocuments.size <= 1), 
            t.addedDocuments.size > 0 ? s.$o = !0 : t.modifiedDocuments.size > 0 ? U(s.$o) : t.removedDocuments.size > 0 && (U(s.$o), 
            s.$o = !1));
        })), await Ac(n, t, e);
    } catch (t) {
        await Ui(t);
    }
}

/**
 * Applies an OnlineState change to the sync engine and notifies any views of
 * the change.
 */ function lc(t, e, n) {
    const s = K(t);
    // If we are the secondary client, we explicitly ignore the remote store's
    // online state (the local client may go offline, even though the primary
    // tab remains online) and only apply the primary tab's online state from
    // SharedClientState.
        if (s.isPrimaryClient && 0 /* RemoteStore */ === n || !s.isPrimaryClient && 1 /* SharedClientState */ === n) {
        const t = [];
        s.Mo.forEach(((n, s) => {
            const i = s.view.ro(e);
            i.snapshot && t.push(i.snapshot);
        })), function(t, e) {
            const n = K(t);
            n.onlineState = e;
            let s = !1;
            n.queries.forEach(((t, n) => {
                for (const t of n.listeners) 
                // Run global snapshot listeners if a consistent snapshot has been emitted.
                t.ro(e) && (s = !0);
            })), s && zo(n);
        }(s.eventManager, e), t.length && s.Oo.br(t), s.onlineState = e, s.isPrimaryClient && s.sharedClientState.setOnlineState(e);
    }
}

/**
 * Rejects the listen for the given targetID. This can be triggered by the
 * backend for any active target.
 *
 * @param syncEngine - The sync engine implementation.
 * @param targetId - The targetID corresponds to one previously initiated by the
 * user as part of TargetData passed to listen() on RemoteStore.
 * @param err - A description of the condition that has forced the rejection.
 * Nearly always this will be an indication that the user is no longer
 * authorized to see the data matching the target.
 */ async function fc(t, e, n) {
    const s = K(t);
    // PORTING NOTE: Multi-tab only.
        s.sharedClientState.updateQueryState(e, "rejected", n);
    const i = s.Uo.get(e), r = i && i.key;
    if (r) {
        // TODO(klimt): We really only should do the following on permission
        // denied errors, but we don't have the cause code here.
        // It's a limbo doc. Create a synthetic event saying it was deleted.
        // This is kind of a hack. Ideally, we would have a method in the local
        // store to purge a document. However, it would be tricky to keep all of
        // the local store's invariants with another method.
        let t = new yn(Dt.comparator);
        t = t.insert(r, Gt.newNoDocument(r, ut.min()));
        const n = Dn().add(r), i = new kn(ut.min(), 
        /* targetChanges= */ new Map, 
        /* targetMismatches= */ new En(rt), t, n);
        await hc(s, i), 
        // Since this query failed, we won't want to manually unlisten to it.
        // We only remove it from bookkeeping after we successfully applied the
        // RemoteEvent. If `applyRemoteEvent()` throws, we want to re-listen to
        // this query when the RemoteStore restarts the Watch stream, which should
        // re-trigger the target failure.
        s.Bo = s.Bo.remove(r), s.Uo.delete(e), Ic(s);
    } else await Er(s.localStore, e, 
    /* keepPersistedTargetData */ !1).then((() => yc(s, e, n))).catch(Ui);
}

function yc(t, e, n = null) {
    t.sharedClientState.removeLocalQueryTarget(e);
    for (const s of t.Fo.get(e)) t.Mo.delete(s), n && t.Oo.zo(s, n);
    if (t.Fo.delete(e), t.isPrimaryClient) {
        t.qo.us(e).forEach((e => {
            t.qo.containsKey(e) || 
            // We removed the last reference for this key
            pc(t, e);
        }));
    }
}

function pc(t, e) {
    t.Lo.delete(e.path.canonicalString());
    // It's possible that the target already got removed because the query failed. In that case,
    // the key won't exist in `limboTargetsByKey`. Only do the cleanup if we still have the target.
    const n = t.Bo.get(e);
    null !== n && (fo(t.remoteStore, n), t.Bo = t.Bo.remove(e), t.Uo.delete(n), Ic(t));
}

function Tc(t, e, n) {
    for (const s of n) if (s instanceof tc) t.qo.addReference(s.key, e), Ec(t, s); else if (s instanceof ec) {
        O("SyncEngine", "Document no longer in limbo: " + s.key), t.qo.removeReference(s.key, e);
        t.qo.containsKey(s.key) || 
        // We removed the last reference for this key
        pc(t, s.key);
    } else B();
}

function Ec(t, e) {
    const n = e.key, s = n.path.canonicalString();
    t.Bo.get(n) || t.Lo.has(s) || (O("SyncEngine", "New document in limbo: " + n), t.Lo.add(s), 
    Ic(t));
}

/**
 * Starts listens for documents in limbo that are enqueued for resolution,
 * subject to a maximum number of concurrent resolutions.
 *
 * Without bounding the number of concurrent resolutions, the server can fail
 * with "resource exhausted" errors which can lead to pathological client
 * behavior as seen in https://github.com/firebase/firebase-js-sdk/issues/2683.
 */ function Ic(t) {
    for (;t.Lo.size > 0 && t.Bo.size < t.maxConcurrentLimboResolutions; ) {
        const e = t.Lo.values().next().value;
        t.Lo.delete(e);
        const n = new Dt(wt.fromString(e)), s = t.Qo.next();
        t.Uo.set(s, new ic(n)), t.Bo = t.Bo.insert(n, s), lo(t.remoteStore, new ai(be(ye(n.path)), s, 2 /* LimboResolution */ , nt.I));
    }
}

async function Ac(t, e, n) {
    const s = K(t), i = [], r = [], o = [];
    s.Mo.isEmpty() || (s.Mo.forEach(((t, c) => {
        o.push(s.Go(c, e, n).then((t => {
            if (t) {
                s.isPrimaryClient && s.sharedClientState.updateQueryState(c.targetId, t.fromCache ? "not-current" : "current"), 
                i.push(t);
                const e = hr.$n(c.targetId, t);
                r.push(e);
            }
        })));
    })), await Promise.all(o), s.Oo.br(i), await async function(t, e) {
        const n = K(t);
        try {
            await n.persistence.runTransaction("notifyLocalViewChanges", "readwrite", (t => zs.forEach(e, (e => zs.forEach(e.kn, (s => n.persistence.referenceDelegate.addReference(t, e.targetId, s))).next((() => zs.forEach(e.xn, (s => n.persistence.referenceDelegate.removeReference(t, e.targetId, s)))))))));
        } catch (t) {
            if (!Zs(t)) throw t;
            // If `notifyLocalViewChanges` fails, we did not advance the sequence
            // number for the documents that were included in this transaction.
            // This might trigger them to be deleted earlier than they otherwise
            // would have, but it should not invalidate the integrity of the data.
            O("LocalStore", "Failed to update sequence numbers: " + t);
        }
        for (const t of e) {
            const e = t.targetId;
            if (!t.fromCache) {
                const t = n.qn.get(e), s = t.snapshotVersion, i = t.withLastLimboFreeSnapshotVersion(s);
                // Advance the last limbo free snapshot version
                                n.qn = n.qn.insert(e, i);
            }
        }
    }(s.localStore, r));
}

async function Rc(t, e) {
    const n = K(t);
    if (!n.currentUser.isEqual(e)) {
        O("SyncEngine", "User change. New user:", e.toKey());
        const t = await wr(n.localStore, e);
        n.currentUser = e, 
        // Fails tasks waiting for pending writes requested by previous user.
        function(t, e) {
            t.jo.forEach((t => {
                t.forEach((t => {
                    t.reject(new Q(j.CANCELLED, e));
                }));
            })), t.jo.clear();
        }(n, "'waitForPendingWrites' promise is rejected due to a user change."), 
        // TODO(b/114226417): Consider calling this only in the primary tab.
        n.sharedClientState.handleUserChange(e, t.removedBatchIds, t.addedBatchIds), await Ac(n, t.Gn);
    }
}

function bc(t, e) {
    const n = K(t), s = n.Uo.get(e);
    if (s && s.$o) return Dn().add(s.key);
    {
        let t = Dn();
        const s = n.Fo.get(e);
        if (!s) return t;
        for (const e of s) {
            const s = n.Mo.get(e);
            t = t.unionWith(s.view.bo);
        }
        return t;
    }
}

function $c(t) {
    const e = K(t);
    return e.remoteStore.remoteSyncer.applyRemoteEvent = hc.bind(null, e), e.remoteStore.remoteSyncer.getRemoteKeysForTarget = bc.bind(null, e), 
    e.remoteStore.remoteSyncer.rejectListen = fc.bind(null, e), e.Oo.br = Wo.bind(null, e.eventManager), 
    e.Oo.zo = Go.bind(null, e.eventManager), e;
}

class Fc {
    constructor() {
        this.synchronizeTabs = !1;
    }
    async initialize(t) {
        this.k = eo(t.databaseInfo.databaseId), this.sharedClientState = this.Jo(t), this.persistence = this.Yo(t), 
        await this.persistence.start(), this.gcScheduler = this.Xo(t), this.localStore = this.Zo(t);
    }
    Xo(t) {
        return null;
    }
    Zo(t) {
        return dr(this.persistence, new lr, t.initialUser, this.k);
    }
    Yo(t) {
        return new $r(Mr.ks, this.k);
    }
    Jo(t) {
        return new Gr;
    }
    async terminate() {
        this.gcScheduler && this.gcScheduler.stop(), await this.sharedClientState.shutdown(), 
        await this.persistence.shutdown();
    }
}

/**
 * Initializes and wires the components that are needed to interface with the
 * network.
 */ class Uc {
    async initialize(t, e) {
        this.localStore || (this.localStore = t.localStore, this.sharedClientState = t.sharedClientState, 
        this.datastore = this.createDatastore(e), this.remoteStore = this.createRemoteStore(e), 
        this.eventManager = this.createEventManager(e), this.syncEngine = this.createSyncEngine(e, 
        /* startAsPrimary=*/ !t.synchronizeTabs), this.sharedClientState.onlineStateHandler = t => lc(this.syncEngine, t, 1 /* SharedClientState */), 
        this.remoteStore.remoteSyncer.handleCredentialChange = Rc.bind(null, this.syncEngine), 
        await xo(this.remoteStore, this.syncEngine.isPrimaryClient));
    }
    createEventManager(t) {
        return new Ko;
    }
    createDatastore(t) {
        const e = eo(t.databaseInfo.databaseId), n = (s = t.databaseInfo, new Xr(s));
        var s;
        /** Return the Platform-specific connectivity monitor. */        return function(t, e, n, s) {
            return new oo(t, e, n, s);
        }(t.authCredentials, t.appCheckCredentials, n, e);
    }
    createRemoteStore(t) {
        return e = this.localStore, n = this.datastore, s = t.asyncQueue, i = t => lc(this.syncEngine, t, 0 /* RemoteStore */), 
        r = Hr.Pt() ? new Hr : new zr, new ao(e, n, s, i, r);
        var e, n, s, i, r;
        /** Re-enables the network. Idempotent. */    }
    createSyncEngine(t, e) {
        return function(t, e, n, 
        // PORTING NOTE: Manages state synchronization in multi-tab environments.
        s, i, r, o) {
            const c = new rc(t, e, n, s, i, r);
            return o && (c.Wo = !0), c;
        }(this.localStore, this.remoteStore, this.eventManager, this.sharedClientState, t.initialUser, t.maxConcurrentLimboResolutions, e);
    }
    terminate() {
        return async function(t) {
            const e = K(t);
            O("RemoteStore", "RemoteStore shutting down."), e.Gr.add(5 /* Shutdown */), await ho(e), 
            e.Hr.shutdown(), 
            // Set the OnlineState to Unknown (rather than Offline) to avoid potentially
            // triggering spurious listener events with cached data, etc.
            e.Jr.set("Unknown" /* Unknown */);
        }(this.remoteStore);
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * On web, a `ReadableStream` is wrapped around by a `ByteStreamReader`.
 */
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 * A wrapper implementation of Observer<T> that will dispatch events
 * asynchronously. To allow immediate silencing, a mute call is added which
 * causes events scheduled to no longer be raised.
 */
class Kc {
    constructor(t) {
        this.observer = t, 
        /**
         * When set to true, will not raise future events. Necessary to deal with
         * async detachment of listener.
         */
        this.muted = !1;
    }
    next(t) {
        this.observer.next && this.ec(this.observer.next, t);
    }
    error(t) {
        this.observer.error ? this.ec(this.observer.error, t) : console.error("Uncaught Error in snapshot listener:", t);
    }
    nc() {
        this.muted = !0;
    }
    ec(t, e) {
        this.muted || setTimeout((() => {
            this.muted || t(e);
        }), 0);
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * FirestoreClient is a top-level class that constructs and owns all of the
 * pieces of the client SDK architecture. It is responsible for creating the
 * async queue that is shared by all of the other components in the system.
 */
class Gc {
    constructor(t, e, 
    /**
     * Asynchronous queue responsible for all of our internal processing. When
     * we get incoming work from the user (via public API) or the network
     * (incoming GRPC messages), we should always schedule onto this queue.
     * This ensures all of our work is properly serialized (e.g. we don't
     * start processing a new operation while the previous one is waiting for
     * an async I/O to complete).
     */
    n, s) {
        this.authCredentials = t, this.appCheckCredentials = e, this.asyncQueue = n, this.databaseInfo = s, 
        this.user = C.UNAUTHENTICATED, this.clientId = it.A(), this.authCredentialListener = () => Promise.resolve(), 
        this.authCredentials.start(n, (async t => {
            O("FirestoreClient", "Received user=", t.uid), await this.authCredentialListener(t), 
            this.user = t;
        })), 
        // Register an empty credentials change listener to activate token refresh.
        this.appCheckCredentials.start(n, (() => Promise.resolve()));
    }
    async getConfiguration() {
        return {
            asyncQueue: this.asyncQueue,
            databaseInfo: this.databaseInfo,
            clientId: this.clientId,
            authCredentials: this.authCredentials,
            appCheckCredentials: this.appCheckCredentials,
            initialUser: this.user,
            maxConcurrentLimboResolutions: 100
        };
    }
    setCredentialChangeListener(t) {
        this.authCredentialListener = t;
    }
    /**
     * Checks that the client has not been terminated. Ensures that other methods on
     * this class cannot be called after the client is terminated.
     */    verifyNotTerminated() {
        if (this.asyncQueue.isShuttingDown) throw new Q(j.FAILED_PRECONDITION, "The client has already been terminated.");
    }
    terminate() {
        this.asyncQueue.enterRestrictedMode();
        const t = new W;
        return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async () => {
            try {
                this.onlineComponents && await this.onlineComponents.terminate(), this.offlineComponents && await this.offlineComponents.terminate(), 
                // The credentials provider must be terminated after shutting down the
                // RemoteStore as it will prevent the RemoteStore from retrieving auth
                // tokens.
                this.authCredentials.shutdown(), this.appCheckCredentials.shutdown(), t.resolve();
            } catch (e) {
                const n = Fo(e, "Failed to shutdown persistence");
                t.reject(n);
            }
        })), t.promise;
    }
}

async function zc(t, e) {
    t.asyncQueue.verifyOperationInProgress(), O("FirestoreClient", "Initializing OfflineComponentProvider");
    const n = await t.getConfiguration();
    await e.initialize(n);
    let s = n.initialUser;
    t.setCredentialChangeListener((async t => {
        s.isEqual(t) || (await wr(e.localStore, t), s = t);
    })), 
    // When a user calls clearPersistence() in one client, all other clients
    // need to be terminated to allow the delete to succeed.
    e.persistence.setDatabaseDeletedListener((() => t.terminate())), t.offlineComponents = e;
}

async function Hc(t, e) {
    t.asyncQueue.verifyOperationInProgress();
    const n = await Jc(t);
    O("FirestoreClient", "Initializing OnlineComponentProvider");
    const s = await t.getConfiguration();
    await e.initialize(n, s), 
    // The CredentialChangeListener of the online component provider takes
    // precedence over the offline component provider.
    t.setCredentialChangeListener((t => async function(t, e) {
        const n = K(t);
        n.asyncQueue.verifyOperationInProgress(), O("RemoteStore", "RemoteStore received new credentials");
        const s = yo(n);
        // Tear down and re-create our network streams. This will ensure we get a
        // fresh auth token for the new user and re-fill the write pipeline with
        // new mutations from the LocalStore (since mutations are per-user).
                n.Gr.add(3 /* CredentialChange */), await ho(n), s && 
        // Don't set the network status to Unknown if we are offline.
        n.Jr.set("Unknown" /* Unknown */), await n.remoteSyncer.handleCredentialChange(e), 
        n.Gr.delete(3 /* CredentialChange */), await uo(n);
    }(e.remoteStore, t))), t.onlineComponents = e;
}

async function Jc(t) {
    return t.offlineComponents || (O("FirestoreClient", "Using default OfflineComponentProvider"), 
    await zc(t, new Fc)), t.offlineComponents;
}

async function Yc(t) {
    return t.onlineComponents || (O("FirestoreClient", "Using default OnlineComponentProvider"), 
    await Hc(t, new Uc)), t.onlineComponents;
}

function Zc(t) {
    return Jc(t).then((t => t.localStore));
}

async function na(t) {
    const e = await Yc(t), n = e.eventManager;
    return n.onListen = oc.bind(null, e.syncEngine), n.onUnlisten = ac.bind(null, e.syncEngine), 
    n;
}

/**
 * Returns a Promise that resolves when all writes that were pending at the time
 * this method was called received server acknowledgement. An acknowledgement
 * can be either acceptance or rejection.
 */ function ra(t, e) {
    const n = new W;
    return t.asyncQueue.enqueueAndForget((async () => async function(t, e, n) {
        try {
            const s = await function(t, e) {
                const n = K(t);
                return n.persistence.runTransaction("read document", "readonly", (t => n.Wn.Rn(t, e)));
            }(t, e);
            s.isFoundDocument() ? n.resolve(s) : s.isNoDocument() ? n.resolve(null) : n.reject(new Q(j.UNAVAILABLE, "Failed to get document from cache. (However, this document may exist on the server. Run again without setting 'source' in the GetOptions to attempt to retrieve the document from the server.)"));
        } catch (t) {
            const s = Fo(t, `Failed to get document '${e} from cache`);
            n.reject(s);
        }
    }
    /**
 * Retrieves a latency-compensated document from the backend via a
 * SnapshotListener.
 */ (await Zc(t), e, n))), n.promise;
}

function oa(t, e, n = {}) {
    const s = new W;
    return t.asyncQueue.enqueueAndForget((async () => function(t, e, n, s, i) {
        const r = new Kc({
            next: r => {
                // Remove query first before passing event to user to avoid
                // user actions affecting the now stale query.
                e.enqueueAndForget((() => Qo(t, o)));
                const c = r.docs.has(n);
                !c && r.fromCache ? 
                // TODO(dimond): If we're online and the document doesn't
                // exist then we resolve with a doc.exists set to false. If
                // we're offline however, we reject the Promise in this
                // case. Two options: 1) Cache the negative response from
                // the server so we can deliver that even when you're
                // offline 2) Actually reject the Promise in the online case
                // if the document doesn't exist.
                i.reject(new Q(j.UNAVAILABLE, "Failed to get document because the client is offline.")) : c && r.fromCache && s && "server" === s.source ? i.reject(new Q(j.UNAVAILABLE, 'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')) : i.resolve(r);
            },
            error: t => i.reject(t)
        }), o = new Ho(ye(n.path), r, {
            includeMetadataChanges: !0,
            wo: !0
        });
        return jo(t, o);
    }(await na(t), t.asyncQueue, e, n, s))), s.promise;
}

class da {
    /**
     * Constructs a DatabaseInfo using the provided host, databaseId and
     * persistenceKey.
     *
     * @param databaseId - The database to use.
     * @param appId - The Firebase App Id.
     * @param persistenceKey - A unique identifier for this Firestore's local
     * storage (used in conjunction with the databaseId).
     * @param host - The Firestore backend host to connect to.
     * @param ssl - Whether to use SSL when connecting.
     * @param forceLongPolling - Whether to use the forceLongPolling option
     * when using WebChannel as the network transport.
     * @param autoDetectLongPolling - Whether to use the detectBufferingProxy
     * option when using WebChannel as the network transport.
     * @param useFetchStreams Whether to use the Fetch API instead of
     * XMLHTTPRequest
     */
    constructor(t, e, n, s, i, r, o, c) {
        this.databaseId = t, this.appId = e, this.persistenceKey = n, this.host = s, this.ssl = i, 
        this.forceLongPolling = r, this.autoDetectLongPolling = o, this.useFetchStreams = c;
    }
}

/** The default database name for a project. */
/**
 * Represents the database ID a Firestore client is associated with.
 * @internal
 */
class wa {
    constructor(t, e) {
        this.projectId = t, this.database = e || "(default)";
    }
    get isDefaultDatabase() {
        return "(default)" === this.database;
    }
    isEqual(t) {
        return t instanceof wa && t.projectId === this.projectId && t.database === this.database;
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ const _a = new Map;

/**
 * An instance map that ensures only one Datastore exists per Firestore
 * instance.
 */
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function ma(t, e, n) {
    if (!n) throw new Q(j.INVALID_ARGUMENT, `Function ${t}() cannot be called with an empty ${e}.`);
}

/**
 * Validates that two boolean options are not set at the same time.
 * @internal
 */ function ga(t, e, n, s) {
    if (!0 === e && !0 === s) throw new Q(j.INVALID_ARGUMENT, `${t} and ${n} cannot be used together.`);
}

/**
 * Validates that `path` refers to a document (indicated by the fact it contains
 * an even numbers of segments).
 */ function ya(t) {
    if (!Dt.isDocumentKey(t)) throw new Q(j.INVALID_ARGUMENT, `Invalid document reference. Document references must have an even number of segments, but ${t} has ${t.length}.`);
}

/**
 * Returns true if it's a non-null object without a custom prototype
 * (i.e. excludes Array, Date, etc.).
 */
/** Returns a string describing the type / value of the provided input. */
function Ta(t) {
    if (void 0 === t) return "undefined";
    if (null === t) return "null";
    if ("string" == typeof t) return t.length > 20 && (t = `${t.substring(0, 20)}...`), 
    JSON.stringify(t);
    if ("number" == typeof t || "boolean" == typeof t) return "" + t;
    if ("object" == typeof t) {
        if (t instanceof Array) return "an array";
        {
            const e = 
            /** try to get the constructor name for an object. */
            function(t) {
                if (t.constructor) return t.constructor.name;
                return null;
            }
            /**
 * Casts `obj` to `T`, optionally unwrapping Compat types to expose the
 * underlying instance. Throws if  `obj` is not an instance of `T`.
 *
 * This cast is used in the Lite and Full SDK to verify instance types for
 * arguments passed to the public API.
 * @internal
 */ (t);
            return e ? `a custom ${e} object` : "an object";
        }
    }
    return "function" == typeof t ? "a function" : B();
}

function Ea(t, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
e) {
    if ("_delegate" in t && (
    // Unwrap Compat types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t = t._delegate), !(t instanceof e)) {
        if (e.name === t.constructor.name) throw new Q(j.INVALID_ARGUMENT, "Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");
        {
            const n = Ta(t);
            throw new Q(j.INVALID_ARGUMENT, `Expected type '${e.name}', but it was: ${n}`);
        }
    }
    return t;
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// settings() defaults:
/**
 * A concrete type describing all the values that can be applied via a
 * user-supplied `FirestoreSettings` object. This is a separate type so that
 * defaults can be supplied and the value can be checked for equality.
 */
class Aa {
    constructor(t) {
        var e;
        if (void 0 === t.host) {
            if (void 0 !== t.ssl) throw new Q(j.INVALID_ARGUMENT, "Can't provide ssl option if host option is not set");
            this.host = "firestore.googleapis.com", this.ssl = true;
        } else this.host = t.host, this.ssl = null === (e = t.ssl) || void 0 === e || e;
        if (this.credentials = t.credentials, this.ignoreUndefinedProperties = !!t.ignoreUndefinedProperties, 
        void 0 === t.cacheSizeBytes) this.cacheSizeBytes = 41943040; else {
            if (-1 !== t.cacheSizeBytes && t.cacheSizeBytes < 1048576) throw new Q(j.INVALID_ARGUMENT, "cacheSizeBytes must be at least 1048576");
            this.cacheSizeBytes = t.cacheSizeBytes;
        }
        this.experimentalForceLongPolling = !!t.experimentalForceLongPolling, this.experimentalAutoDetectLongPolling = !!t.experimentalAutoDetectLongPolling, 
        this.useFetchStreams = !!t.useFetchStreams, ga("experimentalForceLongPolling", t.experimentalForceLongPolling, "experimentalAutoDetectLongPolling", t.experimentalAutoDetectLongPolling);
    }
    isEqual(t) {
        return this.host === t.host && this.ssl === t.ssl && this.credentials === t.credentials && this.cacheSizeBytes === t.cacheSizeBytes && this.experimentalForceLongPolling === t.experimentalForceLongPolling && this.experimentalAutoDetectLongPolling === t.experimentalAutoDetectLongPolling && this.ignoreUndefinedProperties === t.ignoreUndefinedProperties && this.useFetchStreams === t.useFetchStreams;
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * The Cloud Firestore service interface.
 *
 * Do not call this constructor directly. Instead, use {@link getFirestore}.
 */ class Ra {
    /** @hideconstructor */
    constructor(t, e, n) {
        this._authCredentials = e, this._appCheckCredentials = n, 
        /**
         * Whether it's a Firestore or Firestore Lite instance.
         */
        this.type = "firestore-lite", this._persistenceKey = "(lite)", this._settings = new Aa({}), 
        this._settingsFrozen = !1, t instanceof wa ? this._databaseId = t : (this._app = t, 
        this._databaseId = function(t) {
            if (!Object.prototype.hasOwnProperty.apply(t.options, [ "projectId" ])) throw new Q(j.INVALID_ARGUMENT, '"projectId" not provided in firebase.initializeApp.');
            return new wa(t.options.projectId);
        }
        /**
 * Modify this instance to communicate with the Cloud Firestore emulator.
 *
 * Note: This must be called before this instance has been used to do any
 * operations.
 *
 * @param firestore - The `Firestore` instance to configure to connect to the
 * emulator.
 * @param host - the emulator host (ex: localhost).
 * @param port - the emulator port (ex: 9000).
 * @param options.mockUserToken - the mock auth token to use for unit testing
 * Security Rules.
 */ (t));
    }
    /**
     * The {@link @firebase/app#FirebaseApp} associated with this `Firestore` service
     * instance.
     */    get app() {
        if (!this._app) throw new Q(j.FAILED_PRECONDITION, "Firestore was not initialized using the Firebase SDK. 'app' is not available");
        return this._app;
    }
    get _initialized() {
        return this._settingsFrozen;
    }
    get _terminated() {
        return void 0 !== this._terminateTask;
    }
    _setSettings(t) {
        if (this._settingsFrozen) throw new Q(j.FAILED_PRECONDITION, "Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");
        this._settings = new Aa(t), void 0 !== t.credentials && (this._authCredentials = function(t) {
            if (!t) return new z;
            switch (t.type) {
              case "gapi":
                const e = t.client;
                // Make sure this really is a Gapi client.
                                return U(!("object" != typeof e || null === e || !e.auth || !e.auth.getAuthHeaderValueForFirstParty)), 
                new X(e, t.sessionIndex || "0", t.iamToken || null);

              case "provider":
                return t.client;

              default:
                throw new Q(j.INVALID_ARGUMENT, "makeAuthCredentialsProvider failed due to invalid credential type");
            }
        }(t.credentials));
    }
    _getSettings() {
        return this._settings;
    }
    _freezeSettings() {
        return this._settingsFrozen = !0, this._settings;
    }
    _delete() {
        return this._terminateTask || (this._terminateTask = this._terminate()), this._terminateTask;
    }
    /** Returns a JSON-serializable representation of this `Firestore` instance. */    toJSON() {
        return {
            app: this._app,
            databaseId: this._databaseId,
            settings: this._settings
        };
    }
    /**
     * Terminates all components used by this client. Subclasses can override
     * this method to clean up their own dependencies, but must also call this
     * method.
     *
     * Only ever called once.
     */    _terminate() {
        /**
 * Removes all components associated with the provided instance. Must be called
 * when the `Firestore` instance is terminated.
 */
        return function(t) {
            const e = _a.get(t);
            e && (O("ComponentProvider", "Removing Datastore"), _a.delete(t), e.terminate());
        }(this), Promise.resolve();
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A `DocumentReference` refers to a document location in a Firestore database
 * and can be used to write, read, or listen to the location. The document at
 * the referenced location may or may not exist.
 */ class Pa {
    /** @hideconstructor */
    constructor(t, 
    /**
     * If provided, the `FirestoreDataConverter` associated with this instance.
     */
    e, n) {
        this.converter = e, this._key = n, 
        /** The type of this Firestore reference. */
        this.type = "document", this.firestore = t;
    }
    get _path() {
        return this._key.path;
    }
    /**
     * The document's identifier within its collection.
     */    get id() {
        return this._key.path.lastSegment();
    }
    /**
     * A string representing the path of the referenced document (relative
     * to the root of the database).
     */    get path() {
        return this._key.path.canonicalString();
    }
    /**
     * The collection this `DocumentReference` belongs to.
     */    get parent() {
        return new Va(this.firestore, this.converter, this._key.path.popLast());
    }
    withConverter(t) {
        return new Pa(this.firestore, t, this._key);
    }
}

/**
 * A `Query` refers to a query which you can read or listen to. You can also
 * construct refined `Query` objects by adding filters and ordering.
 */ class va {
    // This is the lite version of the Query class in the main SDK.
    /** @hideconstructor protected */
    constructor(t, 
    /**
     * If provided, the `FirestoreDataConverter` associated with this instance.
     */
    e, n) {
        this.converter = e, this._query = n, 
        /** The type of this Firestore reference. */
        this.type = "query", this.firestore = t;
    }
    withConverter(t) {
        return new va(this.firestore, t, this._query);
    }
}

/**
 * A `CollectionReference` object can be used for adding documents, getting
 * document references, and querying for documents (using {@link query}).
 */ class Va extends va {
    /** @hideconstructor */
    constructor(t, e, n) {
        super(t, e, ye(n)), this._path = n, 
        /** The type of this Firestore reference. */
        this.type = "collection";
    }
    /** The collection's identifier. */    get id() {
        return this._query.path.lastSegment();
    }
    /**
     * A string representing the path of the referenced collection (relative
     * to the root of the database).
     */    get path() {
        return this._query.path.canonicalString();
    }
    /**
     * A reference to the containing `DocumentReference` if this is a
     * subcollection. If this isn't a subcollection, the reference is null.
     */    get parent() {
        const t = this._path.popLast();
        return t.isEmpty() ? null : new Pa(this.firestore, 
        /* converter= */ null, new Dt(t));
    }
    withConverter(t) {
        return new Va(this.firestore, t, this._path);
    }
}

function Ca(t, e, ...n) {
    if (t = getModularInstance(t), 
    // We allow omission of 'pathString' but explicitly prohibit passing in both
    // 'undefined' and 'null'.
    1 === arguments.length && (e = it.A()), ma("doc", "path", e), t instanceof Ra) {
        const s = wt.fromString(e, ...n);
        return ya(s), new Pa(t, 
        /* converter= */ null, new Dt(s));
    }
    {
        if (!(t instanceof Pa || t instanceof Va)) throw new Q(j.INVALID_ARGUMENT, "Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");
        const s = t._path.child(wt.fromString(e, ...n));
        return ya(s), new Pa(t.firestore, t instanceof Va ? t.converter : null, new Dt(s));
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ class xa {
    constructor() {
        // The last promise in the queue.
        this.mc = Promise.resolve(), 
        // A list of retryable operations. Retryable operations are run in order and
        // retried with backoff.
        this.gc = [], 
        // Is this AsyncQueue being shut down? Once it is set to true, it will not
        // be changed again.
        this.yc = !1, 
        // Operations scheduled to be queued in the future. Operations are
        // automatically removed after they are run or canceled.
        this.Tc = [], 
        // visible for testing
        this.Ec = null, 
        // Flag set while there's an outstanding AsyncQueue operation, used for
        // assertion sanity-checks.
        this.Ic = !1, 
        // Enabled during shutdown on Safari to prevent future access to IndexedDB.
        this.Ac = !1, 
        // List of TimerIds to fast-forward delays for.
        this.Rc = [], 
        // Backoff timer used to schedule retries for retryable operations
        this.ur = new no(this, "async_queue_retry" /* AsyncQueueRetry */), 
        // Visibility handler that triggers an immediate retry of all retryable
        // operations. Meant to speed up recovery when we regain file system access
        // after page comes into foreground.
        this.bc = () => {
            const t = to();
            t && O("AsyncQueue", "Visibility state changed to " + t.visibilityState), this.ur.er();
        };
        const t = to();
        t && "function" == typeof t.addEventListener && t.addEventListener("visibilitychange", this.bc);
    }
    get isShuttingDown() {
        return this.yc;
    }
    /**
     * Adds a new operation to the queue without waiting for it to complete (i.e.
     * we ignore the Promise result).
     */    enqueueAndForget(t) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.enqueue(t);
    }
    enqueueAndForgetEvenWhileRestricted(t) {
        this.Pc(), 
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.vc(t);
    }
    enterRestrictedMode(t) {
        if (!this.yc) {
            this.yc = !0, this.Ac = t || !1;
            const e = to();
            e && "function" == typeof e.removeEventListener && e.removeEventListener("visibilitychange", this.bc);
        }
    }
    enqueue(t) {
        if (this.Pc(), this.yc) 
        // Return a Promise which never resolves.
        return new Promise((() => {}));
        // Create a deferred Promise that we can return to the callee. This
        // allows us to return a "hanging Promise" only to the callee and still
        // advance the queue even when the operation is not run.
                const e = new W;
        return this.vc((() => this.yc && this.Ac ? Promise.resolve() : (t().then(e.resolve, e.reject), 
        e.promise))).then((() => e.promise));
    }
    enqueueRetryable(t) {
        this.enqueueAndForget((() => (this.gc.push(t), this.Vc())));
    }
    /**
     * Runs the next operation from the retryable queue. If the operation fails,
     * reschedules with backoff.
     */    async Vc() {
        if (0 !== this.gc.length) {
            try {
                await this.gc[0](), this.gc.shift(), this.ur.reset();
            } catch (t) {
                if (!Zs(t)) throw t;
 // Failure will be handled by AsyncQueue
                                O("AsyncQueue", "Operation failed with retryable error: " + t);
            }
            this.gc.length > 0 && 
            // If there are additional operations, we re-schedule `retryNextOp()`.
            // This is necessary to run retryable operations that failed during
            // their initial attempt since we don't know whether they are already
            // enqueued. If, for example, `op1`, `op2`, `op3` are enqueued and `op1`
            // needs to  be re-run, we will run `op1`, `op1`, `op2` using the
            // already enqueued calls to `retryNextOp()`. `op3()` will then run in the
            // call scheduled here.
            // Since `backoffAndRun()` cancels an existing backoff and schedules a
            // new backoff on every call, there is only ever a single additional
            // operation in the queue.
            this.ur.Zi((() => this.Vc()));
        }
    }
    vc(t) {
        const e = this.mc.then((() => (this.Ic = !0, t().catch((t => {
            this.Ec = t, this.Ic = !1;
            const e = 
            /**
 * Chrome includes Error.message in Error.stack. Other browsers do not.
 * This returns expected output of message + stack when available.
 * @param error - Error or FirestoreError
 */
            function(t) {
                let e = t.message || "";
                t.stack && (e = t.stack.includes(t.message) ? t.stack : t.message + "\n" + t.stack);
                return e;
            }
            /**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ (t);
            // Re-throw the error so that this.tail becomes a rejected Promise and
            // all further attempts to chain (via .then) will just short-circuit
            // and return the rejected Promise.
            throw M("INTERNAL UNHANDLED ERROR: ", e), t;
        })).then((t => (this.Ic = !1, t))))));
        return this.mc = e, e;
    }
    enqueueAfterDelay(t, e, n) {
        this.Pc(), 
        // Fast-forward delays for timerIds that have been overriden.
        this.Rc.indexOf(t) > -1 && (e = 0);
        const s = Mo.createAndSchedule(this, t, e, n, (t => this.Sc(t)));
        return this.Tc.push(s), s;
    }
    Pc() {
        this.Ec && B();
    }
    verifyOperationInProgress() {}
    /**
     * Waits until all currently queued tasks are finished executing. Delayed
     * operations are not run.
     */    async Dc() {
        // Operations in the queue prior to draining may have enqueued additional
        // operations. Keep draining the queue until the tail is no longer advanced,
        // which indicates that no more new operations were enqueued and that all
        // operations were executed.
        let t;
        do {
            t = this.mc, await t;
        } while (t !== this.mc);
    }
    /**
     * For Tests: Determine if a delayed operation with a particular TimerId
     * exists.
     */    Cc(t) {
        for (const e of this.Tc) if (e.timerId === t) return !0;
        return !1;
    }
    /**
     * For Tests: Runs some or all delayed operations early.
     *
     * @param lastTimerId - Delayed operations up to and including this TimerId
     * will be drained. Pass TimerId.All to run all delayed operations.
     * @returns a Promise that resolves once all operations have been run.
     */    Nc(t) {
        // Note that draining may generate more delayed ops, so we do that first.
        return this.Dc().then((() => {
            // Run ops in the same order they'd run if they ran naturally.
            this.Tc.sort(((t, e) => t.targetTimeMs - e.targetTimeMs));
            for (const e of this.Tc) if (e.skipDelay(), "all" /* All */ !== t && e.timerId === t) break;
            return this.Dc();
        }));
    }
    /**
     * For Tests: Skip all subsequent delays for a timer id.
     */    kc(t) {
        this.Rc.push(t);
    }
    /** Called once a DelayedOperation is run or canceled. */    Sc(t) {
        // NOTE: indexOf / slice are O(n), but delayedOperations is expected to be small.
        const e = this.Tc.indexOf(t);
        this.Tc.splice(e, 1);
    }
}

/**
 * The Cloud Firestore service interface.
 *
 * Do not call this constructor directly. Instead, use {@link getFirestore}.
 */
class Fa extends Ra {
    /** @hideconstructor */
    constructor(t, e, n) {
        super(t, e, n), 
        /**
         * Whether it's a {@link Firestore} or Firestore Lite instance.
         */
        this.type = "firestore", this._queue = new xa, this._persistenceKey = "name" in t ? t.name : "[DEFAULT]";
    }
    _terminate() {
        return this._firestoreClient || 
        // The client must be initialized to ensure that all subsequent API
        // usage throws an exception.
        qa(this), this._firestoreClient.terminate();
    }
}

/**
 * Returns the existing {@link Firestore} instance that is associated with the
 * provided {@link @firebase/app#FirebaseApp}. If no instance exists, initializes a new
 * instance with default settings.
 *
 * @param app - The {@link @firebase/app#FirebaseApp} instance that the returned {@link Firestore}
 * instance is associated with.
 * @returns The {@link Firestore} instance of the provided app.
 */ function Ba(e = getApp()) {
    return _getProvider(e, "firestore").getImmediate();
}

/**
 * @internal
 */ function Ua(t) {
    return t._firestoreClient || qa(t), t._firestoreClient.verifyNotTerminated(), t._firestoreClient;
}

function qa(t) {
    var e;
    const n = t._freezeSettings(), s = function(t, e, n, s) {
        return new da(t, e, n, s.host, s.ssl, s.experimentalForceLongPolling, s.experimentalAutoDetectLongPolling, s.useFetchStreams);
    }(t._databaseId, (null === (e = t._app) || void 0 === e ? void 0 : e.options.appId) || "", t._persistenceKey, n);
    t._firestoreClient = new Gc(t._authCredentials, t._appCheckCredentials, t._queue, s);
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A `FieldPath` refers to a field in a document. The path may consist of a
 * single field name (referring to a top-level field in the document), or a
 * list of field names (referring to a nested field in the document).
 *
 * Create a `FieldPath` by providing field names. If more than one field
 * name is provided, the path will point to a nested field in a document.
 */
class tu {
    /**
     * Creates a `FieldPath` from the provided field names. If more than one field
     * name is provided, the path will point to a nested field in a document.
     *
     * @param fieldNames - A list of field names.
     */
    constructor(...t) {
        for (let e = 0; e < t.length; ++e) if (0 === t[e].length) throw new Q(j.INVALID_ARGUMENT, "Invalid field name at argument $(i + 1). Field names must not be empty.");
        this._internalPath = new mt(t);
    }
    /**
     * Returns true if this `FieldPath` is equal to the provided one.
     *
     * @param other - The `FieldPath` to compare against.
     * @returns true if this `FieldPath` is equal to the provided one.
     */    isEqual(t) {
        return this._internalPath.isEqual(t._internalPath);
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * An immutable object representing an array of bytes.
 */ class nu {
    /** @hideconstructor */
    constructor(t) {
        this._byteString = t;
    }
    /**
     * Creates a new `Bytes` object from the given Base64 string, converting it to
     * bytes.
     *
     * @param base64 - The Base64 string used to create the `Bytes` object.
     */    static fromBase64String(t) {
        try {
            return new nu(pt.fromBase64String(t));
        } catch (t) {
            throw new Q(j.INVALID_ARGUMENT, "Failed to construct data from Base64 string: " + t);
        }
    }
    /**
     * Creates a new `Bytes` object from the given Uint8Array.
     *
     * @param array - The Uint8Array used to create the `Bytes` object.
     */    static fromUint8Array(t) {
        return new nu(pt.fromUint8Array(t));
    }
    /**
     * Returns the underlying bytes as a Base64-encoded string.
     *
     * @returns The Base64-encoded string created from the `Bytes` object.
     */    toBase64() {
        return this._byteString.toBase64();
    }
    /**
     * Returns the underlying bytes in a new `Uint8Array`.
     *
     * @returns The Uint8Array created from the `Bytes` object.
     */    toUint8Array() {
        return this._byteString.toUint8Array();
    }
    /**
     * Returns a string representation of the `Bytes` object.
     *
     * @returns A string representation of the `Bytes` object.
     */    toString() {
        return "Bytes(base64: " + this.toBase64() + ")";
    }
    /**
     * Returns true if this `Bytes` object is equal to the provided one.
     *
     * @param other - The `Bytes` object to compare against.
     * @returns true if this `Bytes` object is equal to the provided one.
     */    isEqual(t) {
        return this._byteString.isEqual(t._byteString);
    }
}

/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * An immutable object representing a geographic location in Firestore. The
 * location is represented as latitude/longitude pair.
 *
 * Latitude values are in the range of [-90, 90].
 * Longitude values are in the range of [-180, 180].
 */ class iu {
    /**
     * Creates a new immutable `GeoPoint` object with the provided latitude and
     * longitude values.
     * @param latitude - The latitude as number between -90 and 90.
     * @param longitude - The longitude as number between -180 and 180.
     */
    constructor(t, e) {
        if (!isFinite(t) || t < -90 || t > 90) throw new Q(j.INVALID_ARGUMENT, "Latitude must be a number between -90 and 90, but was: " + t);
        if (!isFinite(e) || e < -180 || e > 180) throw new Q(j.INVALID_ARGUMENT, "Longitude must be a number between -180 and 180, but was: " + e);
        this._lat = t, this._long = e;
    }
    /**
     * The latitude of this `GeoPoint` instance.
     */    get latitude() {
        return this._lat;
    }
    /**
     * The longitude of this `GeoPoint` instance.
     */    get longitude() {
        return this._long;
    }
    /**
     * Returns true if this `GeoPoint` is equal to the provided one.
     *
     * @param other - The `GeoPoint` to compare against.
     * @returns true if this `GeoPoint` is equal to the provided one.
     */    isEqual(t) {
        return this._lat === t._lat && this._long === t._long;
    }
    /** Returns a JSON-serializable representation of this GeoPoint. */    toJSON() {
        return {
            latitude: this._lat,
            longitude: this._long
        };
    }
    /**
     * Actually private to JS consumers of our API, so this function is prefixed
     * with an underscore.
     */    _compareTo(t) {
        return rt(this._lat, t._lat) || rt(this._long, t._long);
    }
}

/**
 * Matches any characters in a field path string that are reserved.
 */ const vu = new RegExp("[~\\*/\\[\\]]");

/**
 * Wraps fromDotSeparatedString with an error message about the method that
 * was thrown.
 * @param methodName - The publicly visible method name
 * @param path - The dot-separated string form of a field path which will be
 * split on dots.
 * @param targetDoc - The document against which the field path will be
 * evaluated.
 */ function Vu(t, e, n) {
    if (e.search(vu) >= 0) throw Su(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`, t, 
    /* hasConverter= */ !1, 
    /* path= */ void 0, n);
    try {
        return new tu(...e.split("."))._internalPath;
    } catch (s) {
        throw Su(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`, t, 
        /* hasConverter= */ !1, 
        /* path= */ void 0, n);
    }
}

function Su(t, e, n, s, i) {
    const r = s && !s.isEmpty(), o = void 0 !== i;
    let c = `Function ${e}() called with invalid data`;
    n && (c += " (via `toFirestore()`)"), c += ". ";
    let a = "";
    return (r || o) && (a += " (found", r && (a += ` in field ${s}`), o && (a += ` in document ${i}`), 
    a += ")"), new Q(j.INVALID_ARGUMENT, c + t + a);
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A `DocumentSnapshot` contains data read from a document in your Firestore
 * database. The data can be extracted with `.data()` or `.get(<field>)` to
 * get a specific field.
 *
 * For a `DocumentSnapshot` that points to a non-existing document, any data
 * access will return 'undefined'. You can use the `exists()` method to
 * explicitly verify a document's existence.
 */ class Cu {
    // Note: This class is stripped down version of the DocumentSnapshot in
    // the legacy SDK. The changes are:
    // - No support for SnapshotMetadata.
    // - No support for SnapshotOptions.
    /** @hideconstructor protected */
    constructor(t, e, n, s, i) {
        this._firestore = t, this._userDataWriter = e, this._key = n, this._document = s, 
        this._converter = i;
    }
    /** Property of the `DocumentSnapshot` that provides the document's ID. */    get id() {
        return this._key.path.lastSegment();
    }
    /**
     * The `DocumentReference` for the document included in the `DocumentSnapshot`.
     */    get ref() {
        return new Pa(this._firestore, this._converter, this._key);
    }
    /**
     * Signals whether or not the document at the snapshot's location exists.
     *
     * @returns true if the document exists.
     */    exists() {
        return null !== this._document;
    }
    /**
     * Retrieves all fields in the document as an `Object`. Returns `undefined` if
     * the document doesn't exist.
     *
     * @returns An `Object` containing all fields in the document or `undefined`
     * if the document doesn't exist.
     */    data() {
        if (this._document) {
            if (this._converter) {
                // We only want to use the converter and create a new DocumentSnapshot
                // if a converter has been provided.
                const t = new Nu(this._firestore, this._userDataWriter, this._key, this._document, 
                /* converter= */ null);
                return this._converter.fromFirestore(t);
            }
            return this._userDataWriter.convertValue(this._document.data.value);
        }
    }
    /**
     * Retrieves the field specified by `fieldPath`. Returns `undefined` if the
     * document or field doesn't exist.
     *
     * @param fieldPath - The path (for example 'foo' or 'foo.bar') to a specific
     * field.
     * @returns The data at the specified field location or undefined if no such
     * field exists in the document.
     */
    // We are using `any` here to avoid an explicit cast by our users.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(t) {
        if (this._document) {
            const e = this._document.data.field(ku("DocumentSnapshot.get", t));
            if (null !== e) return this._userDataWriter.convertValue(e);
        }
    }
}

/**
 * A `QueryDocumentSnapshot` contains data read from a document in your
 * Firestore database as part of a query. The document is guaranteed to exist
 * and its data can be extracted with `.data()` or `.get(<field>)` to get a
 * specific field.
 *
 * A `QueryDocumentSnapshot` offers the same API surface as a
 * `DocumentSnapshot`. Since query results contain only existing documents, the
 * `exists` property will always be true and `data()` will never return
 * 'undefined'.
 */ class Nu extends Cu {
    /**
     * Retrieves all fields in the document as an `Object`.
     *
     * @override
     * @returns An `Object` containing all fields in the document.
     */
    data() {
        return super.data();
    }
}

/**
 * Helper that calls `fromDotSeparatedString()` but wraps any error thrown.
 */ function ku(t, e) {
    return "string" == typeof e ? Vu(t, e) : e instanceof tu ? e._internalPath : e._delegate._internalPath;
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Metadata about a snapshot, describing the state of the snapshot.
 */ class xu {
    /** @hideconstructor */
    constructor(t, e) {
        this.hasPendingWrites = t, this.fromCache = e;
    }
    /**
     * Returns true if this `SnapshotMetadata` is equal to the provided one.
     *
     * @param other - The `SnapshotMetadata` to compare against.
     * @returns true if this `SnapshotMetadata` is equal to the provided one.
     */    isEqual(t) {
        return this.hasPendingWrites === t.hasPendingWrites && this.fromCache === t.fromCache;
    }
}

/**
 * A `DocumentSnapshot` contains data read from a document in your Firestore
 * database. The data can be extracted with `.data()` or `.get(<field>)` to
 * get a specific field.
 *
 * For a `DocumentSnapshot` that points to a non-existing document, any data
 * access will return 'undefined'. You can use the `exists()` method to
 * explicitly verify a document's existence.
 */ class $u extends Cu {
    /** @hideconstructor protected */
    constructor(t, e, n, s, i, r) {
        super(t, e, n, s, r), this._firestore = t, this._firestoreImpl = t, this.metadata = i;
    }
    /**
     * Property of the `DocumentSnapshot` that signals whether or not the data
     * exists. True if the document exists.
     */    exists() {
        return super.exists();
    }
    /**
     * Retrieves all fields in the document as an `Object`. Returns `undefined` if
     * the document doesn't exist.
     *
     * By default, `serverTimestamp()` values that have not yet been
     * set to their final value will be returned as `null`. You can override
     * this by passing an options object.
     *
     * @param options - An options object to configure how data is retrieved from
     * the snapshot (for example the desired behavior for server timestamps that
     * have not yet been set to their final value).
     * @returns An `Object` containing all fields in the document or `undefined` if
     * the document doesn't exist.
     */    data(t = {}) {
        if (this._document) {
            if (this._converter) {
                // We only want to use the converter and create a new DocumentSnapshot
                // if a converter has been provided.
                const e = new Ou(this._firestore, this._userDataWriter, this._key, this._document, this.metadata, 
                /* converter= */ null);
                return this._converter.fromFirestore(e, t);
            }
            return this._userDataWriter.convertValue(this._document.data.value, t.serverTimestamps);
        }
    }
    /**
     * Retrieves the field specified by `fieldPath`. Returns `undefined` if the
     * document or field doesn't exist.
     *
     * By default, a `serverTimestamp()` that has not yet been set to
     * its final value will be returned as `null`. You can override this by
     * passing an options object.
     *
     * @param fieldPath - The path (for example 'foo' or 'foo.bar') to a specific
     * field.
     * @param options - An options object to configure how the field is retrieved
     * from the snapshot (for example the desired behavior for server timestamps
     * that have not yet been set to their final value).
     * @returns The data at the specified field location or undefined if no such
     * field exists in the document.
     */
    // We are using `any` here to avoid an explicit cast by our users.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(t, e = {}) {
        if (this._document) {
            const n = this._document.data.field(ku("DocumentSnapshot.get", t));
            if (null !== n) return this._userDataWriter.convertValue(n, e.serverTimestamps);
        }
    }
}

/**
 * A `QueryDocumentSnapshot` contains data read from a document in your
 * Firestore database as part of a query. The document is guaranteed to exist
 * and its data can be extracted with `.data()` or `.get(<field>)` to get a
 * specific field.
 *
 * A `QueryDocumentSnapshot` offers the same API surface as a
 * `DocumentSnapshot`. Since query results contain only existing documents, the
 * `exists` property will always be true and `data()` will never return
 * 'undefined'.
 */ class Ou extends $u {
    /**
     * Retrieves all fields in the document as an `Object`.
     *
     * By default, `serverTimestamp()` values that have not yet been
     * set to their final value will be returned as `null`. You can override
     * this by passing an options object.
     *
     * @override
     * @param options - An options object to configure how data is retrieved from
     * the snapshot (for example the desired behavior for server timestamps that
     * have not yet been set to their final value).
     * @returns An `Object` containing all fields in the document.
     */
    data(t = {}) {
        return super.data(t);
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Converts Firestore's internal types to the JavaScript types that we expose
 * to the user.
 *
 * @internal
 */ class oh {
    convertValue(t, e = "none") {
        switch (Ct(t)) {
          case 0 /* NullValue */ :
            return null;

          case 1 /* BooleanValue */ :
            return t.booleanValue;

          case 2 /* NumberValue */ :
            return It(t.integerValue || t.doubleValue);

          case 3 /* TimestampValue */ :
            return this.convertTimestamp(t.timestampValue);

          case 4 /* ServerTimestampValue */ :
            return this.convertServerTimestamp(t, e);

          case 5 /* StringValue */ :
            return t.stringValue;

          case 6 /* BlobValue */ :
            return this.convertBytes(At(t.bytesValue));

          case 7 /* RefValue */ :
            return this.convertReference(t.referenceValue);

          case 8 /* GeoPointValue */ :
            return this.convertGeoPoint(t.geoPointValue);

          case 9 /* ArrayValue */ :
            return this.convertArray(t.arrayValue, e);

          case 10 /* ObjectValue */ :
            return this.convertObject(t.mapValue, e);

          default:
            throw B();
        }
    }
    convertObject(t, e) {
        const n = {};
        return lt(t.fields, ((t, s) => {
            n[t] = this.convertValue(s, e);
        })), n;
    }
    convertGeoPoint(t) {
        return new iu(It(t.latitude), It(t.longitude));
    }
    convertArray(t, e) {
        return (t.values || []).map((t => this.convertValue(t, e)));
    }
    convertServerTimestamp(t, e) {
        switch (e) {
          case "previous":
            const n = bt(t);
            return null == n ? null : this.convertValue(n, e);

          case "estimate":
            return this.convertTimestamp(Pt(t));

          default:
            return null;
        }
    }
    convertTimestamp(t) {
        const e = Et(t);
        return new at(e.seconds, e.nanos);
    }
    convertDocumentKey(t, e) {
        const n = wt.fromString(t);
        U(Rs(n));
        const s = new wa(n.get(1), n.get(3)), i = new Dt(n.popFirst(5));
        return s.isEqual(e) || 
        // TODO(b/64130202): Somehow support foreign references.
        M(`Document ${i} contains a document reference within a different database (${s.projectId}/${s.database}) which is not supported. It will be treated as a reference in the current database (${e.projectId}/${e.database}) instead.`), 
        i;
    }
}

/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// TODO(mrschmidt) Consider using `BaseTransaction` as the base class in the
// legacy SDK.
/**
 * A reference to a transaction.
 *
 * The `Transaction` object passed to a transaction's `updateFunction` provides
 * the methods to read and write data within the transaction context. See
 * {@link runTransaction}.
 */
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Reads the document referred to by this `DocumentReference`.
 *
 * Note: `getDoc()` attempts to provide up-to-date data when possible by waiting
 * for data from the server, but it may return cached data or fail if you are
 * offline and the server cannot be reached. To specify this behavior, invoke
 * {@link getDocFromCache} or {@link getDocFromServer}.
 *
 * @param reference - The reference of the document to fetch.
 * @returns A Promise resolved with a `DocumentSnapshot` containing the
 * current document contents.
 */
function lh(t) {
    t = Ea(t, Pa);
    const e = Ea(t.firestore, Fa);
    return oa(Ua(e), t._key).then((n => bh(e, t, n)));
}

class fh extends oh {
    constructor(t) {
        super(), this.firestore = t;
    }
    convertBytes(t) {
        return new nu(t);
    }
    convertReference(t) {
        const e = this.convertDocumentKey(t, this.firestore._databaseId);
        return new Pa(this.firestore, /* converter= */ null, e);
    }
}

/**
 * Reads the document referred to by this `DocumentReference` from cache.
 * Returns an error if the document is not currently cached.
 *
 * @returns A `Promise` resolved with a `DocumentSnapshot` containing the
 * current document contents.
 */ function dh(t) {
    t = Ea(t, Pa);
    const e = Ea(t.firestore, Fa), n = Ua(e), s = new fh(e);
    return ra(n, t._key).then((n => new $u(e, s, t._key, n, new xu(null !== n && n.hasLocalMutations, 
    /* fromCache= */ !0), t.converter)));
}

/**
 * Converts a {@link ViewSnapshot} that contains the single document specified by `ref`
 * to a {@link DocumentSnapshot}.
 */ function bh(t, e, n) {
    const s = n.docs.get(e._key), i = new fh(t);
    return new $u(t, i, e._key, s, new xu(n.hasPendingWrites, n.fromCache), e.converter);
}

/**
 * Cloud Firestore
 *
 * @packageDocumentation
 */ !function(t, e = !0) {
    !function(t) {
        N = t;
    }(SDK_VERSION), _registerComponent(new Component("firestore", ((t, {options: n}) => {
        const s = t.getProvider("app").getImmediate(), i = new Fa(s, new J(t.getProvider("auth-internal")), new tt(t.getProvider("app-check-internal")));
        return n = Object.assign({
            useFetchStreams: e
        }, n), i._setSettings(n), i;
    }), "PUBLIC")), registerVersion(D, "3.4.3", t), 
    // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
    registerVersion(D, "3.4.3", "esm2017");
}();

// var efbThemeSettings = {
//   colorBG: "white",
//   colorText: "black",
//   colorHeader: "blue",
// };
var efbSettings = {
    internet: true,
    signedIn: false,
    currentVersion: '',
    latestVersion: '',
};

var aircraft = {
    details: {
        livery: "",
        reg: "",
        model: "",
        type: "C152",
    },
    fuel: {
        leftTank: {
            Quantity: 0,
            Capacity: 0,
        },
        rightTank: {
            Quantity: 0,
            Capacity: 0,
        },
    },
    payload: {
        pilot: 0,
        copilot: 0,
        cargo: {
            forward: 0,
            rear: 0,
        },
    },
    location: {
        lat: 0,
        long: 0,
        heading: 360,
        altitude: 0,
        speed: 0,
    },
    settings: {
        stateSaving: false,
        maintenance: {
            enabled: true,
            oilRemaining: 0,
            timeSinceService: 0,
            sparkFoulTime: 0,
        },
        equipment: {
            ap: true,
            egt: true,
            copilot: true,
            pilot: false,
            dme: true,
        },
    },
};

function round(value, decimals) {
    return parseFloat(value).toFixed(decimals);
}
function uploadAircraftVar() {
}
async function updateAircraftVar(initialize) {
    if (initialize) {
        aircraft.details.livery = SimVar.GetSimVarValue("TITLE", "string").replace(/\s+/g, "_");
        aircraft.settings.stateSaving = SimVar.GetSimVarValue("JPL152IP_SSONOFF_" + aircraft.details.livery, "bool");
        aircraft.details.reg = SimVar.GetSimVarValue("", "string");
        aircraft.details.model = SimVar.GetSimVarValue("", "string");
        aircraft.fuel.leftTank.Capacity = SimVar.GetSimVarValue("A:FUEL TANK LEFT MAIN CAPACITY", "Gallons");
        aircraft.fuel.rightTank.Capacity = SimVar.GetSimVarValue("A:FUEL TANK RIGHT MAIN CAPACITY", "Gallons");
        aircraft.settings.equipment.egt = SimVar.GetSimVarValue("JPL152IP_CLOCKEGT_" + aircraft.details.livery, "bool");
    }
    aircraft.fuel.leftTank.Quantity = SimVar.GetSimVarValue("A:FUEL TANK LEFT MAIN QUANTITY", "Gallons");
    aircraft.fuel.rightTank.Quantity = SimVar.GetSimVarValue("A:FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
    aircraft.location.lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degrees");
    aircraft.location.long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degrees");
    aircraft.location.heading = SimVar.GetSimVarValue("PLANE HEADING", "degrees");
    return true;
}

// import { efbThemeSettings } from "./functions/settings";
class Pages extends DisplayComponent {
    render() {
        return (FSComponent.buildComponent("div", { id: "pages" },
            FSComponent.buildComponent("div", { id: "BootPage" },
                FSComponent.buildComponent("div", { class: "absolute-center" },
                    FSComponent.buildComponent("div", { id: "circle" },
                        FSComponent.buildComponent("svg", { version: "1.1", xmlns: "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", x: "0px", y: "0px", width: "300px", height: "300px", viewBox: "0 0 300 300", "enable-background": "new 0 0 300 300", "xml:space": "preserve" },
                            FSComponent.buildComponent("defs", null,
                                FSComponent.buildComponent("path", { id: "circlePath", d: " M 150, 150 m -60, 0 a 60,60 0 0,1 120,0 a 60,60 0 0,1 -120,0 " })),
                            FSComponent.buildComponent("circle", { cx: "150", cy: "100", r: "75", fill: "none" }),
                            FSComponent.buildComponent("g", null,
                                FSComponent.buildComponent("use", { "xlink:href": "#circlePath", fill: "none" }),
                                FSComponent.buildComponent("text", { fill: "#fff" },
                                    FSComponent.buildComponent("textPath", { "xlink:href": "#circlePath" }, "Text rotating around a circle path with SVG!"))))))),
            FSComponent.buildComponent("div", { id: "HomePage", class: "hidden" },
                FSComponent.buildComponent("div", { class: "grid grid-cols-3 gap-4 absolute-center" },
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("button", { id: "navButton2", class: "rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500" },
                            FSComponent.buildComponent("svg", { xmlns: "http://www.w3.org/2000/svg", height: "360px", viewBox: "0 0 20 20", width: "360px", fill: "#000000" },
                                FSComponent.buildComponent("g", null,
                                    FSComponent.buildComponent("rect", { fill: "none", height: "20", width: "20", x: "0" })),
                                FSComponent.buildComponent("g", null,
                                    FSComponent.buildComponent("path", { d: "M10,18c-0.83,0-1.5-0.67-1.5-1.5c0-0.41,0.17-0.79,0.44-1.06l0,0C9.54,14.84,13,13.5,13,13.5s-1.34,3.46-1.94,4.06\r\n                            C10.79,17.83,10.41,18,10,18z M18,18h-5v-1.5l3.4,0c-0.77-5.48-5.79-5.65-6.4-5.65c-0.61,0-5.63,0.17-6.4,5.65l3.4,0V18H2 c0-5.88,3.72-7.97,6.5-8.5V7C4.8,6.55,2,4.49,2,2h16c0,2.49-2.8,4.55-6.5,5v2.5C14.28,10.03,18,12.12,18,18z M10,5.6 c2.67,0,4.83-0.95,5.84-2.1H4.16C5.17,4.65,7.33,5.6,10,5.6z" }))))),
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("button", { id: "navButton3", class: "rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500" },
                            FSComponent.buildComponent("svg", { xmlns: "http://www.w3.org/2000/svg", height: "360px", viewBox: "0 0 24 24", width: "360px", fill: "#000000" },
                                FSComponent.buildComponent("path", { d: "M0 0h24v24H0V0z", fill: "none" }),
                                FSComponent.buildComponent("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12\r\n                            2zM4 12c0-.61.08-1.21.21-1.78L8.99 15v1c0 1.1.9 2 2 2v1.93C7.06 19.43 4 16.07 4 12zm13.89 5.4c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41C17.92 5.77 20 8.65 20 12c0 2.08-.81 3.98-2.11 5.4z" })))),
                    FSComponent.buildComponent("div", { id: "navButton4" },
                        FSComponent.buildComponent("button", { id: "navButton4", class: "rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500" },
                            FSComponent.buildComponent("svg", { xmlns: "http://www.w3.org/2000/svg", height: "360px", viewBox: "0 0 20 20", width: "360px", fill: "#000000" },
                                FSComponent.buildComponent("g", null,
                                    FSComponent.buildComponent("rect", { fill: "none", height: "20", width: "20", x: "0" })),
                                FSComponent.buildComponent("g", null,
                                    FSComponent.buildComponent("g", null,
                                        FSComponent.buildComponent("rect", { height: "5.5", transform: "matrix(0.7071 -0.7071\r\n                            0.7071 0.7071 -5.3383 13.8538)", width: "2", x: "13.05", y: "10.62" }),
                                        FSComponent.buildComponent("path", { d: "M14.23,8.98c1.38,0,2.5-1.12,2.5-2.5c0-0.51-0.15-0.98-0.42-1.38l-2.08,2.08l-0.71-0.71l2.08-2.08 c-0.4-0.26-0.87-0.42-1.38-0.42c-1.38,0-2.5,1.12-2.5,2.5c0,0.32,0.07,0.63,0.18,0.91L10.69,8.6L9.64,7.54l0.71-0.71L8.93,5.42\r\n                            L10.34,4C9.56,3.22,8.29,3.22,7.51,4L4.69,6.83l1.06,1.06l-2.13,0L3.27,8.24l2.83,2.83l0.35-0.35L6.46,8.6l1.06,1.06l0.71-0.71 l1.06,1.06l-4.6,4.6l1.41,1.41l7.22-7.22C13.6,8.91,13.91,8.98,14.23,8.98z" })))))),
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("button", { id: "navButton5", class: "rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500" },
                            FSComponent.buildComponent("svg", { xmlns: "http://www.w3.org/2000/svg", height: "360px", viewBox: "0 0 24 24", width: "360px", fill: "#000000" },
                                FSComponent.buildComponent("path", { d: "M0 0h24v24H0V0z", fill: "none" }),
                                FSComponent.buildComponent("path", { d: "M4 4h16v12H5.17L4 17.17V4m0-2c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1\r\n                            0 2-.9 2-2V4c0-1.1-.9-2-2-2H4zm2 10h8v2H6v-2zm0-3h12v2H6V9zm0-3h12v2H6V6z" })))),
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("button", { id: "navButton6", class: "rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500" },
                            FSComponent.buildComponent("svg", { xmlns: "http://www.w3.org/2000/svg", height: "360px", viewBox: "0 0 24 24", width: "360px", fill: "#000000" },
                                FSComponent.buildComponent("path", { d: "M0 0h24v24H0V0z", fill: "none" }),
                                FSComponent.buildComponent("path", { d: "M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.09-.16-.26-.25-.44-.25-.06\r\n                            0-.12.01-.17.03l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.06-.02-.12-.03-.18-.03-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98\r\n                            0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17\r\n                            0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21\r\n                            1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7\r\n                            1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" })))),
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("button", { id: "navButton7", class: "rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500" },
                            FSComponent.buildComponent("svg", { xmlns: "http://www.w3.org/2000/svg", height: "360px", viewBox: "0 0 24 24", width: "360px", fill: "#000000" },
                                FSComponent.buildComponent("path", { d: "M0 0h24v24H0V0z", fill: "none" }),
                                FSComponent.buildComponent("path", { d: "M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0\r\n                            3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" })))))),
            FSComponent.buildComponent("div", { id: "PayloadPage", class: "hidden" },
                FSComponent.buildComponent("div", { class: "svg-center", id: "aircraft-svg" })),
            FSComponent.buildComponent("div", { id: "MapPage", class: "hidden" },
                FSComponent.buildComponent("div", { class: "map-center", id: "map" })),
            FSComponent.buildComponent("div", { id: "SettingsPage", class: "hidden" },
                FSComponent.buildComponent("div", { class: "grid grid-cols-4 gap-4 absolute-center" },
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("button", { id: "settingsToggleStateSaving", height: "350px", width: "350px", class: "rounded-lg bg-blue-500 hover:bg-blue-400 transition-colors rounded-[8px] px-[15px] py-[4px] text-white focus:ring-2 ring-blue-500" })),
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("label", { class: "toggle" },
                            FSComponent.buildComponent("input", { id: "settingsToggleStateSaving", type: "checkbox" }),
                            FSComponent.buildComponent("span", { class: "toggleKnob" })),
                        " ",
                        "State Saving"),
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("label", { class: "toggle" },
                            FSComponent.buildComponent("input", { id: "settingsToggleMaintenance", type: "checkbox" }),
                            FSComponent.buildComponent("span", { class: "toggleKnob" })),
                        " ",
                        "Engine Realism"),
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("label", { class: "toggle" },
                            FSComponent.buildComponent("input", { id: "settingsToggleEGT", type: "checkbox" }),
                            FSComponent.buildComponent("span", { class: "toggleKnob" })),
                        " ",
                        "Show EGT"),
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("label", { class: "toggle" },
                            FSComponent.buildComponent("input", { id: "settingsToggleAP", type: "checkbox" }),
                            FSComponent.buildComponent("span", { class: "toggleKnob" })),
                        " ",
                        "Show AP"),
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("label", { class: "toggle" },
                            FSComponent.buildComponent("input", { id: "settingsTogglepilotViz", type: "checkbox" }),
                            FSComponent.buildComponent("span", { class: "toggleKnob" })),
                        " ",
                        "Show Pilot"),
                    FSComponent.buildComponent("div", null,
                        FSComponent.buildComponent("label", { class: "toggle" },
                            FSComponent.buildComponent("input", { id: "settingsToggleCopilotViz", type: "checkbox" }),
                            FSComponent.buildComponent("span", { class: "toggleKnob" })),
                        " ",
                        "Show CoPilot"),
                    FSComponent.buildComponent("div", { id: "loadoutButtons" },
                        FSComponent.buildComponent("div", { id: "stateCAD", class: "button", style: "position: absolute; left: 292px; top: 440px;" }, "Cold and Dark"),
                        FSComponent.buildComponent("div", { id: "stateRFF", class: "button", style: "position: absolute; left: 516px; top: 440px;" }, "Ready For Flight"))))));
    }
}
class Headers$1 extends DisplayComponent {
    render() {
        return (FSComponent.buildComponent("div", { id: "Header" },
            FSComponent.buildComponent("div", { id: "navButton1", style: "width:200px;float:left", class: "rounded-lg  hover:bg-blue-400 transition-colors rounded-[8px] px-[4px] py-[4px] text-white focus:ring-2 ring-blue-500" },
                FSComponent.buildComponent("svg", { xmlns: "http://www.w3.org/2000/svg", height: "192px", viewBox: "0 0 24 24", width: "192px", fill: "#ffffff" },
                    FSComponent.buildComponent("path", { d: " M0 0h24v24H0V0z", fill: "none" }),
                    FSComponent.buildComponent("path", { d: "M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" }))),
            FSComponent.buildComponent("div", { id: "appPageTitle", style: "width:600px;float:left" }, "JPLogistics EFB V0.0.1")));
    }
}
class Warning extends DisplayComponent {
    render() {
        return (FSComponent.buildComponent("div", { id: "outdatedVersion" },
            FSComponent.buildComponent("div", { class: "absolute-center rounded-full" },
                FSComponent.buildComponent("div", { width: "120px", id: "Close Button", class: "hover:bg-yellow-400 rounded-[8px] px-[4px] py-[4px]", style: "inline-block" },
                    FSComponent.buildComponent("svg", { xmlns: "http://www.w3.org/2000/svg", width: "100", height: "100", viewBox: "0 0 24 24", fill: "#000000" },
                        FSComponent.buildComponent("path", { d: "M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z" }))),
                FSComponent.buildComponent("span", { id: "warningText", style: "inline-block" }, "OUTDATED: A newer version of this aircraft is availiable!"))));
    }
}
class Error$1 extends DisplayComponent {
    render() {
        return (FSComponent.buildComponent("div", { class: "absolute-center rounded-full" }, "Oops... somethings went wrong!"));
    }
}

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
const db = Ba(app);
console.log("Got here - 1");
const loader1 = new Loader({
    apiKey: "AIzaSyAVyRSMwRRdJQNTiuewVeGwi5j550OxqGc",
    version: "weekly",
});
let map;
class EFB extends BaseInstrument {
    constructor() {
        super(...arguments);
        this.tablet_init_complete = false;
        this.appCount = 7;
        this.appSelected = "Boot";
        this.appPrevious = "Boot";
        this.frame = 0;
        this.aircraft = Subject.create(aircraft);
        this.aircraftSettings = Subject.create(aircraft.settings);
        this.aircraftSVGmy = {
            path: "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
            strokeColor: "#F00",
            fillColor: "#F00",
            fillOpacity: 1,
            rotation: aircraft.location.heading
        };
    }
    get templateID() {
        console.log("Here....1.2");
        return "EFB";
    }
    get isInteractive() {
        return true;
    }
    async connectedCallback() {
        this.frame = 0;
        super.connectedCallback();
        await updateAircraftVar(true);
        console.log("Got here... 1.5");
        this.aircraftSettings.sub(val => console.log("Aircraft Settings Triggered"));
        FSComponent.render(FSComponent.buildComponent(Pages, { aircraftSettings: this.aircraftSettings }), document.getElementById("efbContent"));
        FSComponent.render(FSComponent.buildComponent(Headers$1, null), document.getElementById("efbHeader"));
        FSComponent.render(FSComponent.buildComponent(Warning, null), document.getElementById("efbWarning"));
        FSComponent.render(FSComponent.buildComponent(Error$1, null), document.getElementById("efbError"));
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
        this.settingsToggleStateSaving = this.getChildById("settingsToggleStateSaving");
        this.settingsToggleStateSaving.addEventListener("click", this.settingsToggleStateSavingPress.bind(this));
        this.settingsToggleMaintenance = this.getChildById("settingsToggleMaintenance");
        this.settingsToggleMaintenance.addEventListener("change", this.settingsToggleMaintenancePress.bind(this));
        this.settingsToggleEGT = this.getChildById("settingsToggleEGT");
        this.settingsToggleEGT.addEventListener("change", this.settingsToggleEGTPress.bind(this));
        this.settingsToggleAP = this.getChildById("settingsToggleAP");
        this.settingsToggleAP.addEventListener("change", this.settingsToggleAPPress.bind(this));
        this.settingsTogglepilotViz = this.getChildById("settingsTogglepilotViz");
        this.settingsTogglepilotViz.addEventListener("change", this.settingsTogglepilotVizPress.bind(this));
        this.settingsToggleCopilotViz = this.getChildById("settingsToggleCopilotViz");
        this.settingsToggleCopilotViz.addEventListener("change", this.settingsToggleCopilotVizPress.bind(this));
        this.stateCAD = this.getChildById("stateCAD");
        this.stateCAD.addEventListener("mouseup", this.stateCADPress.bind(this));
        this.stateRFF = this.getChildById("stateRFF");
        this.stateRFF.addEventListener("mouseup", this.stateRFFPress.bind(this));
        // SET INFO TO IPAD
        if (aircraft.settings.stateSaving) {
            console.log("State-saving showing as ENABLED!");
        }
        // if ((await SimVar.GetSimVarValue("JPL152IP_SSONOFF_" + aircraft.details.livery, 'bool')) == 1) {
        //   this.settingsToggleStateSaving.checked = true;
        // } else {
        //   this.settingsToggleStateSaving.checked = false;
        // }
        if (aircraft.settings.maintenance.enabled) {
            this.settingsToggleMaintenance.checked = true;
            console.log("Aircraft Maintenance is ENABLED!");
        }
        else {
            this.settingsToggleMaintenance.checked = false;
            console.log("Aircraft Maintenance is DISABLED!");
        }
        if (aircraft.settings.equipment.egt) {
            this.settingsToggleEGT.checked = true;
        }
        else {
            this.settingsToggleEGT.checked = false;
        }
        if (aircraft.settings.equipment.ap) {
            this.settingsToggleAP.checked = true;
            console.log("Cockpit: AP is ENABLED!");
        }
        else {
            this.settingsToggleAP.checked = false;
            console.log("Cockpit: AP is DSIABLED!");
        }
        if (SimVar.GetSimVarValue("JPL152IP_PILOTVIZ_" + aircraft.details.livery, "bool") == 1) {
            this.settingsTogglepilotViz.checked = true;
        }
        else {
            this.settingsTogglepilotViz.checked = false;
        }
        if (SimVar.GetSimVarValue("JPL152IP_COPILOTVIZ_" + aircraft.details.livery, "bool") == 1) {
            this.settingsToggleCopilotViz.checked = true;
        }
        else {
            this.settingsToggleCopilotViz.checked = false;
        }
    }
    settingsToggleStateSavingPress() {
        SimVar.SetSimVarValue("L:JPL152_SSONOFF", "Bool", aircraft.settings.stateSaving ? false : true);
    }
    settingsToggleMaintenancePress() {
        SimVar.SetSimVarValue("L:JPL152_MAINTENANCE_ONOFF", "Bool", this.settingsToggleMaintenance.checked);
        aircraft.settings.stateSaving ? false : true;
    }
    settingsToggleEGTPress() {
        SimVar.SetSimVarValue("L:JPL152_CLOCKEGT", "Bool", this.settingsToggleEGT.checked);
    }
    settingsToggleAPPress() {
        SimVar.SetSimVarValue("L:JPL152_APVIZ", "Bool", this.settingsToggleAP.checked);
    }
    settingsTogglepilotVizPress() {
        SimVar.SetSimVarValue("L:C152_PilotsState", "Bool", this.settingsTogglepilotViz.checked);
    }
    settingsToggleCopilotVizPress() {
        SimVar.SetSimVarValue("L:C152_CoPilotsState", "Bool", this.settingsToggleCopilotViz.checked);
    }
    navButton1Press() {
        this.setScreen("Home");
    }
    navButton2Press() {
        this.setScreen("Payload");
    }
    navButton3Press() {
        this.setScreen("Map");
        map.setCenter({
            lat: aircraft.location.lat,
            lng: aircraft.location.long,
        });
    }
    navButton4Press() {
        this.setScreen("Maintenance");
    }
    navButton5Press() {
        this.setScreen("Chat");
    }
    navButton6Press() {
        this.setScreen("Settings");
    }
    navButton7Press() {
        this.setScreen("stowed");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    Update() {
        this.frame++;
        super.Update();
        var debugVar = "";
        try {
            debugVar = "Set Aircraft Vars";
            if (this.frame % 5 == 0) {
                updateAircraftVar(false);
            }
            debugVar = "Upload Aircraft Vars";
            if (this.frame % 60 == 0) {
                uploadAircraftVar();
            }
            if (this.appSelected == "Boot") {
                debugVar = "Boot Screen";
            }
            else if (this.appSelected == "Home") {
                debugVar = "Home Screen";
            }
            else if (this.appSelected == "Settings") {
                debugVar = "Settings Screen";
                this.aircraftSettings.sub(val => ((this.getChildById("settingsToggleStateSaving").innerHTML("State Savinggg: " && aircraft.settings.stateSaving ? "ON" : "OFF"))));
            }
            else if (this.appSelected == "Payload") {
                debugVar = "Payload Screen";
                this.drawAircraftFuel("aircraft-svg");
            }
            else if (this.appSelected == "Map") {
                if (this.frame % 30 == 0) {
                    this.mapMarkersAircraft();
                }
            }
        }
        catch (e) {
            document.getElementById("efbError").innerHTML =
                "Ex." + debugVar + "<br/>" + "Ex." + e;
            document.getElementById("efbError").classList.remove("hidden");
        }
    }
    setScreen(page) {
        var x = "Start setScreen";
        try {
            this.appPrevious = this.appSelected;
            x = "Set previous";
            this.appSelected = page;
            x = "Set selected";
            console.log(this.appSelected + "Page");
            document
                .getElementById(this.appPrevious + "Page")
                .classList.add("hidden");
            x = "Boot Page Hide?";
            document
                .getElementById(this.appSelected + "Page")
                .classList.remove("hidden");
            x = "Show new page";
            if (this.appSelected != "Boot") {
                document.getElementById("efbHeader").classList.remove("hidden");
                x = "Show Header";
            }
            else {
                document.getElementById("efbHeader").classList.add("hidden");
                x = "Hide Header";
            }
        }
        catch (e) {
            document.getElementById("efbError").innerHTML =
                "Ex." + x + "<br/>" + "Ex." + e;
            document.getElementById("efbError").classList.remove("hidden");
        }
        // document.getElementById("efbContent")!.innerHTML = "";
        // if (this.appSelected == "Boot") {
        //   FSComponent.render(<BootPage />, document.getElementById("efbContent"));
    }
    async tablet_init() {
        console.log("Got here - Init - Start of Tablet Init");
        if (this.tablet_init_complete == false) {
            // App
            //SimVar.SetSimVarValue("L:EFB_Theme", "string", "light");
            const docRef = Ca(db, "JPL-Data", "Versions");
            console.log("Got here - Init - Set Simvar & Doc");
            try {
                var docSnap = await lh(docRef);
                if (docSnap.exists()) {
                    console.log("Document data:", docSnap.data());
                    const data = docSnap.data();
                    console.log("Document data:", data["C152"]);
                    console.log("Got here - Init - Fetched Data... Valid?");
                    efbSettings.latestVersion = data["C152"];
                }
                else {
                    // doc.data() will be undefined in this case
                    console.log("No such document!");
                }
            }
            catch (e) {
                console.log("Error getting live document:", e);
                try {
                    const doc = await dh(docRef);
                    console.log("Cached document data:", doc.data());
                }
                catch (e) {
                    console.log("Cached Error:", e);
                }
                finally {
                    document.getElementById("test").innerHTML = "Failed";
                }
            }
            console.log("Got here - Init - Finally - Everything good?");
            var UUID = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
            console.log(UUID);
            loader1.load().then(() => {
                map = new google.maps.Map(document.getElementById("map"), {
                    center: {
                        lat: aircraft.location.lat,
                        lng: aircraft.location.long
                    },
                    zoom: 12,
                });
            });
            // document.getElementById("header")!.classList.remove("hidden");
            setTimeout(() => {
                this.tablet_init_complete = true;
                if (efbSettings.currentVersion != efbSettings.latestVersion) {
                    document.getElementById("warningText").innerHTML =
                        "UPDATE: C152 Version " +
                            efbSettings.latestVersion +
                            ", is available! \n Please update to ensure the best experience!";
                    document.getElementById("efbWarning").classList.remove("hidden");
                }
                this.setScreen("Home");
            }, 500);
        }
    }
    mapMarkersAircraft() {
        var marker = new google.maps.Marker({
            position: {
                lat: aircraft.location.lat,
                lng: aircraft.location.long,
            },
            icon: this.aircraftSVGmy,
            title: "My Aircraft!!",
        });
        marker.setMap(map);
    }
    drawAircraftFuel(id) {
        const width = 36;
        const height = 60;
        const labelHeight = 10;
        const barHeight = height - labelHeight;
        let colorLabelBackground = "565656";
        let lGallons = aircraft.fuel.leftTank.Quantity;
        let lCapacity = aircraft.fuel.leftTank.Capacity;
        let rGallons = aircraft.fuel.rightTank.Quantity;
        let rCapacity = aircraft.fuel.rightTank.Capacity;
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
        <rect x="164" y="${labelHeight + 16}" width="${width}" height="${barHeight}" style="fill: #1a1a1a;" />
        <rect x="166" y="${height - lfilledHeight + 14}" width="${width - 4}" height="${lfilledHeight}" style="fill: #9b2f25;" />
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
        <text x="182" y="54" style="font-size:8px;line-height:1.25;stroke-width:0.2" text-anchor="middle" fill="#fffdf4">${round((lGallons / lCapacity) * 100, 0)}%</text>

    <rect
       style="fill:#0000ff;fill-opacity:0;fill-rule:evenodd;stroke:#000067;stroke-width:0.816148;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
       id="rect131-4"
       width="36"
       height="60"
       x="252"
       y="16" />
       <rect x="252" y="16" width="${width}" height="${labelHeight}" style="fill: #${colorLabelBackground};" />
        <rect x="252" y="${labelHeight + 16}" width="${width}" height="${barHeight}" style="fill: #1a1a1a;" />
        <rect x="254" y="${height - rfilledHeight + 14}" width="${width - 4}" height="${rfilledHeight}" style="fill: #9b2f25;" />
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

        <text x="270" y="54" style="font-size:8px;line-height:1.25;stroke-width:0.2" text-anchor="middle" fill="#fffdf4">${round((rGallons / rCapacity) * 100, 0)}%</text>
  </g>
       </svg>
       `;
        this.getChildById(id).innerHTML = svg;
    }
}
registerInstrument("efb-element", EFB);
