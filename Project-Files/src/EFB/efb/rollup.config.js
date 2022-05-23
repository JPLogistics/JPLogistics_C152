import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import css from 'rollup-plugin-import-css';

export default {
    input: 'efb.tsx',
    output: {
        dir: 'build',
        format: 'es'
    },
    plugins: [css({ output: 'efb.css' }), resolve(), typescript()]
}