import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['node_modules', 'dist'],
  rules: {
    'unused-imports/no-unused-vars': 'warn',
    'node/prefer-global/buffer': 'warn',
    'no-restricted-syntax': 'off',
    'node/prefer-global/process': 'off',
    'no-template-curly-in-string': 'off',
    'ts/no-empty-object-type': 'off',
    'prefer-regex-literals': 'off',
    'no-async-promise-executor': 'off',
  },
})
