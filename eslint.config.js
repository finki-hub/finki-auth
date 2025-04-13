import { base, node, perfectionist, prettier, typescript, vitest } from 'eslint-config-imperium';

export default [
  { ignores: ["dist", "**/*.js"] },
  base,
  node,
  perfectionist,
  prettier,
  typescript,
  vitest,
] ;
