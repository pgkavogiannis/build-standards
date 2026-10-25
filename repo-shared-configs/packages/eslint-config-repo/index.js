const js = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
    globalIgnores(['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/e2e/**', '**/test/**', '**/testing/**']),
    {
        files: ['**/*.ts'],
        extends: [js.configs.recommended, tseslint.configs.recommended, angular.configs.tsRecommended, prettier],
        processor: angular.processInlineTemplates,
        languageOptions: {
            parserOptions: {
                projectService: true
            }
        },
        rules: {
            '@angular-eslint/component-selector': [
                'error',
                {
                    type: 'element',
                    prefix: ['app', '{{COMPONENT_PREFIX}}'],
                    style: 'kebab-case'
                }
            ],
            '@angular-eslint/directive-selector': [
                'error',
                {
                    type: 'attribute',
                    prefix: ['app', '{{COMPONENT_PREFIX}}'],
                    style: 'camelCase'
                }
            ],
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/consistent-type-definitions': 'off',
            '@typescript-eslint/dot-notation': 'off',
            '@typescript-eslint/explicit-member-accessibility': 'off',
            '@typescript-eslint/no-require-imports': 'error',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-var-requires': 'error',
            '@typescript-eslint/require-await': 'error',
            'id-match': 'off',
            'no-duplicate-case': 'error',
            'no-duplicate-imports': 'off',
            'no-invalid-this': 'error',
            'no-new-func': 'error',
            'no-redeclare': 'off',
            '@typescript-eslint/no-redeclare': ['error'],
            'no-template-curly-in-string': 'error',
            'no-underscore-dangle': 'off',
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'enum',
                    format: ['PascalCase', 'UPPER_CASE']
                }
            ],
            '@typescript-eslint/member-ordering': [
                'error',
                {
                    default: [
                        'public-static-field',
                        'public-instance-field',
                        'private-static-field',
                        'private-instance-field',
                        'public-constructor',
                        'private-constructor',
                        'public-instance-method',
                        'protected-instance-method',
                        'private-instance-method'
                    ]
                }
            ]
        }
    },
    {
        files: ['**/*.html'],
        extends: [angular.configs.templateRecommended, prettier],
        rules: {
            '@angular-eslint/template/attributes-order': [
                'error',
                {
                    alphabetical: false,
                    order: [
                        // e.g. `*ngIf="true"`, `*ngFor="let item of items"`,
                        'STRUCTURAL_DIRECTIVE',
                        // e.g. `<input #inputRef>`,
                        'TEMPLATE_REFERENCE',
                        // e.g. `<input required>`, `id="3"`,
                        'ATTRIBUTE_BINDING',
                        // e.g. `[id]="3"`, `[attr.colspan]="colspan"`, [style.width.%]="100", [@triggerName]="expression", `bind-id="handleChange()"`,
                        'INPUT_BINDING',
                        // e.g. `[(id)]="id"`, `bindon-id="id",
                        'TWO_WAY_BINDING',
                        // e.g. `(idChange)="handleChange()"`, `on-id="handleChange()"`,
                        'OUTPUT_BINDING'
                    ]
                }
            ]
        }
    }
]);
