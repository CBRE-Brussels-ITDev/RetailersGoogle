// Handlebars Template Validator
// This script helps identify unclosed block helpers in JSReport templates

const fs = require('fs');

function validateHandlebarsTemplate(templateContent) {
    const lines = templateContent.split('\n');
    const stack = [];
    const errors = [];
    
    // Regex patterns for Handlebars blocks
    const blockOpenPattern = /\{\{#(if|unless|each|with|[a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const blockClosePattern = /\{\{\/(if|unless|each|with|[a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    
    lines.forEach((line, lineNumber) => {
        const lineNum = lineNumber + 1;
        
        // Find opening blocks
        let match;
        while ((match = blockOpenPattern.exec(line)) !== null) {
            const blockType = match[1];
            stack.push({
                type: blockType,
                line: lineNum,
                column: match.index + 1,
                content: match[0]
            });
            console.log(`Line ${lineNum}: Opening block {{#${blockType}}}`);
        }
        
        // Reset regex for closing blocks
        blockClosePattern.lastIndex = 0;
        
        // Find closing blocks
        while ((match = blockClosePattern.exec(line)) !== null) {
            const blockType = match[1];
            const lastOpened = stack.pop();
            
            if (!lastOpened) {
                errors.push({
                    type: 'UNEXPECTED_CLOSE',
                    line: lineNum,
                    column: match.index + 1,
                    message: `Unexpected closing tag {{/${blockType}}} - no matching opening tag`
                });
            } else if (lastOpened.type !== blockType) {
                errors.push({
                    type: 'MISMATCHED_CLOSE',
                    line: lineNum,
                    column: match.index + 1,
                    message: `Closing tag {{/${blockType}}} doesn't match opening tag {{#${lastOpened.type}}} at line ${lastOpened.line}`
                });
                // Put the mismatched block back on the stack
                stack.push(lastOpened);
            } else {
                console.log(`Line ${lineNum}: Closing block {{/${blockType}}} matches opening at line ${lastOpened.line}`);
            }
        }
    });
    
    // Check for unclosed blocks
    stack.forEach(block => {
        errors.push({
            type: 'UNCLOSED_BLOCK',
            line: block.line,
            column: block.column,
            message: `Unclosed block {{#${block.type}}} - missing {{/${block.type}}}`
        });
    });
    
    return { errors, unclosedBlocks: stack };
}

// Test with the template content you're having issues with
const problematicTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>CBRE Catchment Analysis</title>
</head>
<body>
    <h1>Catchment Analysis Report</h1>
    
    {{#each defaultBreaks}}
        <div class="catchment-section">
            <h2>{{name}}</h2>
            
            {{#if totalPopulation}}
                <p>Population: {{totalPopulation}}</p>
                
                {{#if businessAnalysis}}
                    <div class="business-section">
                        <h3>Business Analysis</h3>
                        
                        {{#each businessAnalysis.topBusinesses}}
                            <div class="business-item">
                                <span>{{name}} - {{rating}} stars</span>
                            </div>
                        {{/each}}
                        
                        {{#if businessAnalysis.categoryAnalysis}}
                            <p>Market Saturation: {{businessAnalysis.categoryAnalysis.marketSaturation}}</p>
                        {{/if}}
                        
                    </div>
                    <!-- Missing {{/if}} for businessAnalysis here! -->
                
            {{/if}}
            
        </div>
    {{/each}}
    
</body>
</html>
`;

console.log('=== HANDLEBARS TEMPLATE VALIDATION ===\n');

const result = validateHandlebarsTemplate(problematicTemplate);

console.log('\n=== VALIDATION RESULTS ===');

if (result.errors.length === 0) {
    console.log('✅ Template is valid - no errors found!');
} else {
    console.log(`❌ Found ${result.errors.length} error(s):\n`);
    
    result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.type} at line ${error.line}, column ${error.column}`);
        console.log(`   ${error.message}\n`);
    });
}

if (result.unclosedBlocks.length > 0) {
    console.log('🔍 UNCLOSED BLOCKS TO FIX:');
    result.unclosedBlocks.forEach(block => {
        console.log(`   - Add {{/${block.type}}} to close the {{#${block.type}}} block opened at line ${block.line}`);
    });
}

console.log('\n=== COMMON FIXES ===');
console.log('1. Make sure every {{#if}} has a matching {{/if}}');
console.log('2. Make sure every {{#each}} has a matching {{/each}}');
console.log('3. Make sure every {{#unless}} has a matching {{/unless}}');
console.log('4. Check for nested blocks - they must be properly closed in reverse order');
console.log('5. Use proper indentation to visualize block structure');
