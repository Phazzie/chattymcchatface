const solidPlugin = require("./eslint-solid-plugin");

module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "./tsconfig.json",
    },
    plugins: ["@typescript-eslint", "sonarjs"],
    // Add our custom SOLID plugin
    plugins: ["@typescript-eslint", "sonarjs", { rules: solidPlugin.rules }],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:sonarjs/recommended",
    ],
    rules: {
        // SRP (Single Responsibility Principle)
        "max-lines-per-function": ["error", { max: 50 }],
        "max-lines": [
            "error",
            {
                max: 80,
                skipBlankLines: true,
                skipComments: true,
                // Exclude test files
                exclude: {
                    test: "\\.(test|spec)\\.(ts|js)$",
                },
            },
        ],
        "max-classes-per-file": ["error", 1],

        // KISS (Keep It Simple)
        complexity: ["error", 8],
        "max-depth": ["error", 2],
        "max-nested-callbacks": ["error", 2],
        "max-params": ["error", 3],

        // DRY (Don't Repeat Yourself)
        "no-duplicate-imports": "error",
        "sonarjs/no-duplicate-string": ["error", { threshold: 2 }],
        "sonarjs/no-identical-functions": "error",
        "no-unused-vars": "error",

        // OCP (Open/Closed Principle)
        "@typescript-eslint/no-explicit-any": "error",
        "sonarjs/no-switch": "error",
        "no-restricted-syntax": [
            "error",
            {
                selector: 'BinaryExpression[operator="instanceof"]',
                message: "Prefer polymorphism over instanceof checks for better extensibility.",
            },
        ],

        // LSP (Liskov Substitution Principle)
        "@typescript-eslint/explicit-module-boundary-types": "error",
        "@typescript-eslint/no-non-null-assertion": "error",

        // ISP (Interface Segregation Principle)
        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/interface-name-prefix": "off",

        // DIP (Dependency Inversion Principle)
        "@typescript-eslint/no-var-requires": "error",
        "no-new": "error",

        // Custom SOLID rules
        "0/single-responsibility": "warn",
        "0/interface-segregation": "warn",
        "0/dependency-inversion": "warn",
    },
};
