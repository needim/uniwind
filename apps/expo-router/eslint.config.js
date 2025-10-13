// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
    expoConfig,
    {
        ignores: ['dist/*'],
        settings: {
            // Handle monorepo workspace packages
            'import/resolver': {
                uniwind: {
                    root: '../../packages/uniwind',
                },
            },
        },
    },
])
