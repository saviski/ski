import pkg from './package.json';
import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
// import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'ski.ts',
    output: {
      file: pkg.module,
      sourcemap: true,
    },
    plugins: [
      nodeResolve(),
      typescript({
        include: '**/*.ts'
      }),
      // terser({
      //   output: {
      //     comments: false
      //   }
      // })
    ]
  }
]
