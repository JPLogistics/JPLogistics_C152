import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

import packageJson from './package.json';

export default {
    input: 'src/index.ts',
    output: [
        { dir: 'dist/' },
        {
            file: packageJson.main,
            format: 'cjs',
            sourcemap: true,
        },
        {
            file: packageJson.module,
            format: 'esm',
            sourcemap: true,
        },
    ],
    plugins: [
        commonjs(),
        typescript(),
    ],
};
