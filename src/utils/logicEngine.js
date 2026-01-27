// Helper to compare values based on operator
const checkCondition = (value, operator, threshold) => {
  const numValue = parseFloat(value);
  const numThreshold = parseFloat(threshold);

  if (isNaN(numValue) || isNaN(numThreshold)) return false;

  switch (operator) {
    case '>': return numValue > numThreshold;
    case '<': return numValue < numThreshold;
    case '>=': return numValue >= numThreshold;
    case '<=': return numValue <= numThreshold;
    case '==': return numValue === numThreshold;
    default: return false;
  }
};

/**
 * Main function to determine cell styling
 * @param {string|number} value - The content of the cell
 * @param {string} columnName - The header of the column (e.g., "PSI", "Status")
 * @param {string} modelId - The ID of the current model (e.g., "GMD03")
 * @param {object} manifest - The loaded .vlm JSON object
 * @returns {string} - Tailwind classes to apply
 */
export const getCellStyle = (value, columnName, modelId, manifest) => {
  if (!manifest) return "";

  // 1. Priority: Check Model-Specific Rules first
  // Structure: manifest.model_specific_rules.GMD03.PSI
  const modelRules = manifest.model_specific_rules?.[modelId]?.[columnName];
  
  if (modelRules) {
    // If it's a simple rule (Threshold based)
    if (modelRules.threshold && modelRules.operator) {
      if (checkCondition(value, modelRules.operator, modelRules.threshold)) {
        return modelRules.style;
      }
    }
  }

  // 2. Fallback: Check Global Rules (Apply to all models)
  // Structure: manifest.global_rules list
  if (manifest.global_rules) {
    const globalRule = manifest.global_rules.find(r => r.column_name === columnName);
    
    if (globalRule) {
      // Type A: Exact Match (e.g., Status = "Green")
      if (globalRule.match_type === 'exact' && globalRule.values) {
        return globalRule.values[value] || "";
      }
      
      // Type B: Threshold (e.g., All "Gini" columns < 0.4)
      if (globalRule.threshold && globalRule.operator) {
        if (checkCondition(value, globalRule.operator, globalRule.threshold)) {
          return globalRule.style;
        }
      }
    }
  }

  return "";
};