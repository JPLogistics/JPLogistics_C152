import { Plugin, LoadHook, TransformHook } from "rollup";

declare interface Options {
    include?: string | string[];
    exclude?: string | string[];
    output?: string;
    transform?: Function;
    minify?: boolean;
    alwaysOutput?: boolean;
}

export default function (options?: Options) : Plugin & {
    load: LoadHook;
    transform: TransformHook;
}