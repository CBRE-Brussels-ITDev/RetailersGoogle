# FIXING JSREPORT TEMPLATE SYNTAX ERROR

## Problem
The error "getColorByIndex doesn't match each - 73:59" indicates a Handlebars template syntax issue in your JSReport template at line 73, character 59.

## Common Issues and Solutions

### 1. Incorrect Helper Usage in {{#each}} Loop

**❌ WRONG:**
```handlebars
{{#each defaultBreaks}}
  <div class="color-{{getColorByIndex @index}}">
    {{name}}
  </div>
{{/each}}
```

**✅ CORRECT:**
```handlebars
{{#each defaultBreaks}}
  <div class="color-{{@index}}">
    {{name}}
  </div>
{{/each}}
```

### 2. Missing Helper Registration

If you need a `getColorByIndex` helper, register it properly in JSReport:

```javascript
// In JSReport helpers
function getColorByIndex(index) {
    const colors = ['blue', 'yellow', 'red', 'green', 'purple'];
    return colors[index % colors.length];
}
```

### 3. CSS Class Approach (Recommended)

Instead of a helper function, use CSS classes:

```css
.color-0 { border-left-color: #007bff; }
.color-1 { border-left-color: #ffc107; }
.color-2 { border-left-color: #dc3545; }
.color-3 { border-left-color: #28a745; }
.color-4 { border-left-color: #6f42c1; }
```

```handlebars
{{#each defaultBreaks}}
  <div class="metric-card color-{{@index}}">
    {{name}}
  </div>
{{/each}}
```

## Step-by-Step Fix

1. **Access your JSReport template editor**
2. **Navigate to line 73** (where the error occurs)
3. **Look for this pattern:**
   ```handlebars
   {{getColorByIndex ...}}
   ```
4. **Replace with:**
   ```handlebars
   {{@index}}
   ```

## Complete Working Template

See the file `catchment-business-template.html` for a complete working template that:
- ✅ Uses proper Handlebars syntax
- ✅ Includes business analysis support
- ✅ Has no syntax errors
- ✅ Uses CSS classes for colors

## Testing Your Fix

1. **Upload the corrected template to JSReport**
2. **Test with sample data:**
   ```json
   {
     "defaultBreaks": [
       {"name": "15 minutes", "totalPopulation": 45000}
     ]
   }
   ```
3. **Verify no compilation errors**

## Business Analysis Integration

The enhanced template now supports:
- ✅ Business metrics (total businesses, average rating)
- ✅ Top businesses table
- ✅ Market analysis insights
- ✅ Competition level assessment

## Data Structure for Business Analysis

Send this structure from your frontend:

```javascript
{
  catchmentData: [...], // Your existing catchment data
  businessData: {
    category: 'restaurant',
    businesses: [
      {
        name: 'Business Name',
        rating: 4.5,
        user_ratings_total: 123,
        price_level: 2,
        distance: 500,
        vicinity: 'Address'
      }
    ]
  }
}
```

The backend will automatically process this into the correct format for the PDF template.
