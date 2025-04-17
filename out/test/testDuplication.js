"use strict";
// This is a test file with intentional code duplication to test our DRY code action
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestClass = void 0;
class TestClass {
    // First duplicated block
    method1() {
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
    method2() {
        return 'Hello World';
    }
    // Second duplicated block (almost identical to the first)
    method3() {
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
exports.TestClass = TestClass;
//# sourceMappingURL=testDuplication.js.map