/**
 * Custom ESLint plugin to enforce SOLID principles
 */
module.exports = {
    rules: {
        // Single Responsibility Principle
        "single-responsibility": {
            meta: {
                type: "suggestion",
                docs: {
                    description: "Enforce Single Responsibility Principle",
                    category: "SOLID",
                    recommended: true
                },
                fixable: null,
                schema: []
            },
            create: function(context) {
                return {
                    ClassDeclaration(node) {
                        // Check if class has too many methods or properties
                        const methods = node.body.body.filter(member => 
                            member.type === 'MethodDefinition' || 
                            (member.type === 'PropertyDefinition' && member.value && member.value.type === 'ArrowFunctionExpression')
                        );
                        
                        const properties = node.body.body.filter(member => 
                            member.type === 'PropertyDefinition' && 
                            (!member.value || member.value.type !== 'ArrowFunctionExpression')
                        );
                        
                        if (methods.length > 5) {
                            context.report({
                                node,
                                message: `Class '${node.id.name}' has ${methods.length} methods, which suggests it may have multiple responsibilities. Consider breaking it down into smaller classes.`
                            });
                        }
                        
                        if (properties.length > 7) {
                            context.report({
                                node,
                                message: `Class '${node.id.name}' has ${properties.length} properties, which suggests it may have multiple responsibilities. Consider breaking it down into smaller classes.`
                            });
                        }
                    }
                };
            }
        },
        
        // Interface Segregation Principle
        "interface-segregation": {
            meta: {
                type: "suggestion",
                docs: {
                    description: "Enforce Interface Segregation Principle",
                    category: "SOLID",
                    recommended: true
                },
                fixable: null,
                schema: []
            },
            create: function(context) {
                return {
                    TSInterfaceDeclaration(node) {
                        const methods = node.body.body.filter(member => 
                            member.type === 'TSMethodSignature'
                        );
                        
                        const properties = node.body.body.filter(member => 
                            member.type === 'TSPropertySignature'
                        );
                        
                        if (methods.length + properties.length > 5) {
                            context.report({
                                node,
                                message: `Interface '${node.id.name}' has ${methods.length + properties.length} members, which may violate the Interface Segregation Principle. Consider breaking it into smaller interfaces.`
                            });
                        }
                    }
                };
            }
        },
        
        // Dependency Inversion Principle
        "dependency-inversion": {
            meta: {
                type: "suggestion",
                docs: {
                    description: "Enforce Dependency Inversion Principle",
                    category: "SOLID",
                    recommended: true
                },
                fixable: null,
                schema: []
            },
            create: function(context) {
                return {
                    NewExpression(node) {
                        // Check if new expression is inside a constructor
                        let parent = node.parent;
                        while (parent && parent.type !== 'MethodDefinition' && parent.type !== 'Program') {
                            parent = parent.parent;
                        }
                        
                        if (parent && parent.type === 'MethodDefinition' && parent.kind === 'constructor') {
                            context.report({
                                node,
                                message: `Creating concrete instances in constructor may violate Dependency Inversion Principle. Consider using dependency injection instead.`
                            });
                        }
                    }
                };
            }
        }
    }
};
