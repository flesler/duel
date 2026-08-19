const eslintJs = require('@eslint/js')
const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const stylisticPlugin = require('@stylistic/eslint-plugin')

module.exports = [
	eslintJs.configs.recommended,
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.json',
			},
			ecmaVersion: 2020,
			sourceType: 'module',
			globals: {
				Phaser: 'readonly',
				PIXI: 'readonly',
				DEBUG: 'readonly',
				GOOGLE_WEB_FONTS: 'readonly',
				SOUND_EXTENSIONS_PREFERENCE: 'readonly',
				require: 'readonly',
				window: 'readonly',
				document: 'readonly',
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			'stylistic': stylisticPlugin,
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
			'stylistic/semi': ['error', 'never'],
			'stylistic/indent': ['error', 'tab'],
			'stylistic/quotes': ['error', 'single', { avoidEscape: true }],
			'stylistic/comma-dangle': ['error', 'always-multiline'],
			'stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1, maxBOF: 0 }],
			'stylistic/brace-style': 'off',
			'stylistic/space-before-function-paren': ['error', { anonymous: 'always', named: 'never' }],
			'stylistic/member-delimiter-style': ['error', {
				multiline: { delimiter: 'semi', requireLast: false },
				singleline: { delimiter: 'semi', requireLast: false },
			}],
			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'no-empty': 'off',
			'no-prototype-builtins': 'off',
			'no-console': 'off',
		},
	},
]
