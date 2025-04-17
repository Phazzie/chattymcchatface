# Code Quality Actions for ChattyMcChatface

This module adds code quality actions to help enforce best practices in your code.

## Currently Implemented Actions

### DRY (Don't Repeat Yourself) Code Action

The DRY code action detects duplicated code blocks in your TypeScript and JavaScript files and suggests extracting them into reusable methods.

#### How to Use

1. Open a TypeScript or JavaScript file that might contain duplicated code
2. Look for the lightbulb icon (or press Ctrl+. / Cmd+.) when your cursor is in a duplicated code block
3. Select "DRY: Extract Duplicate Code" from the code actions menu
4. A panel will open showing the duplicated code and suggesting how to refactor it

#### Benefits

- **Maintainability**: When you need to change the logic, you only need to change it in one place
- **Readability**: Your code becomes more concise and easier to understand
- **Bug Prevention**: Fixes in one place automatically apply to all occurrences

## Planned Actions

- **Single Responsibility Principle (SRP)** detector
- **Open/Closed Principle (OCP)** analyzer
- **Interface Segregation Principle (ISP)** analyzer
- **Dependency Inversion Principle (DIP)** enforcer
- **KISS (Keep It Simple)** complexity analyzer

## How It Works

The code action providers analyze your code for specific patterns and offer suggestions for improvement. They use VS Code's CodeActionProvider API to integrate seamlessly with your development workflow.
