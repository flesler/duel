const importNewlinesPlugin = require('eslint-plugin-import-newlines')
const unusedImportsPlugin = require('eslint-plugin-unused-imports')
const eslintJs = require('@eslint/js')
const tsParser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const stylisticPlugin = require('@stylistic/eslint-plugin')

module.exports = [
	{
		ignores: ['node_modules', 'dist', 'public', '**/*.tsbuildinfo'],
	},
	eslintJs.configs.recommended,
	{
		files: ['{src,bin}/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './bin/tsconfig.json',
			},
			ecmaVersion: 2020,
			sourceType: 'module',
			globals: {
				console: 'readonly',
				process: 'readonly',
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
			'import-newlines': importNewlinesPlugin,
			'unused-imports': unusedImportsPlugin,
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
			'@typescript-eslint/consistent-type-imports': 'error',
			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unsafe-function-type': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				ignoreRestSiblings: true,
			}],
			'unused-imports/no-unused-imports': 'warn',
			'import-newlines/enforce': ['error', { items: Infinity, semi: false }],
			'object-curly-newline': ['error', { consistent: true }],
			'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
			'no-undef': 'off',
			'no-redeclare': 'off',
			'no-unused-vars': 'off',
			'no-empty': 'off',
			'no-prototype-builtins': 'off',
			'no-console': 'off',
			'no-useless-assignment': 'off',
		},
	},
]
