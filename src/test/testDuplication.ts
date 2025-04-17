// This is a test file with intentional code duplication to test our DRY code action

import * as vscode from 'vscode';

export class TestClass {
    // First duplicated block
    public method1() {
        const items = ['item1', 'item2', 'item3'];
        for (const item of items) {
            console.log(`Processing ${item}`);
            if (item === 'item2') {
                console.log('Found special item');
            }
        }
        return true;
    }
    
    // Some other method
    public method2() {
        return 'Hello World';
    }
    
    // Second duplicated block (almost identical to the first)
    public method3() {
        const items = ['item1', 'item2', 'item3'];
        for (const item of items) {
            console.log(`Processing ${item}`);
            if (item === 'item2') {
                console.log('Found special item');
            }
        }
        return false;
    }
}
