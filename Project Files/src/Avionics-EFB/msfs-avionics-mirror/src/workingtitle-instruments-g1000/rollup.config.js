import resolve from '@rollup/plugin-node-resolve';
import css from 'rollup-plugin-import-css';

export default [
  {
    input: 'build/workingtitle-instruments-g1000/html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/MFD/WTG1000_MFD.js',
    output: {
      file: 'build/workingtitle-instruments-g1000/html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/MFD/MFD.js',
      format: 'es',
      name: 'mfd'
    },
    plugins: [css({ output: 'MFD.css' }), resolve()]
  },
  {
    input: 'build/workingtitle-instruments-g1000/html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/PFD/WTG1000_PFD.js',
    output: {
      file: 'build/workingtitle-instruments-g1000/html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/PFD/PFD.js',
      format: 'es',
      name: 'pfd'
    },
    plugins: [css({ output: 'PFD.css' }), resolve()]
  }
]