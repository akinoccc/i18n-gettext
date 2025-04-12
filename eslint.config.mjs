import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['node_modules', 'dist'],
  rules: {
    'unused-imports/no-unused-vars': 'warn',
    'node/prefer-global/buffer': 'warn',
    'no-restricted-syntax': 'off',
    'node/prefer-global/process': 'off',
  },
})
