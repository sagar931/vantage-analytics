/**
 * Helper to normalize values for comparison
 * Handles numbers stored as strings, percentages, etc.
 */
const normalizeValue = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  if (!isNaN(str) && str !== "") return parseFloat(str);
  return str;
};

/**
 * Evaluates a single condition
 */
const evaluateCondition = (targetValue, operator, threshold) => {
  const val = normalizeValue(targetValue);
  const thr = normalizeValue(threshold);

  // Numeric Comparison
  if (typeof val === 'number' && typeof thr === 'number') {
    switch (operator) {
      case '>': return val > thr;
      case '<': return val < thr;
      case '>=': return val >= thr;
      case '<=': return val <= thr;
      case '==': return val === thr;
      case '!=': return val !== thr;
      default: return false;
    }
  }

  // String Comparison (Case Insensitive)
  const strVal = String(val).toLowerCase();
  const strThr = String(thr).toLowerCase();
  
  switch (operator) {
    case '==': return strVal === strThr;
    case '!=': return strVal !== strThr;
    case 'contains': return strVal.includes(strThr);
    default: return false;
  }
};

/**
 * Main Logic Engine
 * @param {any} cellValue - The value of the cell being rendered
 * @param {string} columnName - The header of the column
 * @param {Object} rowData - Key-Value pair of the entire row (e.g., {PSI: 0.4, Status: "Green"})
 * @param {string} modelId - "GMD03"
 * @param {string} sheetName - "PSI_Report"
 * @param {Object} manifest - The .vlm JSON
 */

// ... keep helper functions (normalizeValue, evaluateCondition) ...

export const STYLE_PRESETS = {
  "Red Alert": { 
    className: "font-bold border border-red-500", 
    style: { backgroundColor: "rgba(239, 68, 68, 0.25)", color: "#fca5a5" } // Explicit Red
  },
  "Amber Warning": { 
    className: "font-bold border border-amber-500", 
    style: { backgroundColor: "rgba(245, 158, 11, 0.25)", color: "#fcd34d" } // Explicit Amber
  },
  "Green Safe": { 
    className: "font-bold border border-emerald-500", 
    style: { backgroundColor: "rgba(16, 185, 129, 0.25)", color: "#6ee7b7" } // Explicit Green
  },
  "Blue Info": { 
    className: "font-bold border border-blue-500", 
    style: { backgroundColor: "rgba(59, 130, 246, 0.25)", color: "#93c5fd" } // Explicit Blue
  },
};

export const getCellStyle = (cellValue, columnName, rowData, modelId, sheetName, manifest, currentFileName) => {
  const defaultStyle = { className: "", style: {} };
  if (!manifest) return defaultStyle;

  // 1. Check Model Specific Rules
  const sheetRules = manifest.conditional_formatting?.[modelId]?.[sheetName];
  if (sheetRules) {
    const targetRules = sheetRules.filter(r => {
      // A. Column Match
      const colMatch = r.target_column === columnName;
      
      // B. Scope Match (New Logic)
      // If rule has 'fileFilter', it MUST match currentFileName. 
      // If rule has no 'fileFilter', it applies to ALL files (Global).
      const scopeMatch = r.fileFilter ? r.fileFilter === currentFileName : true;
      
      // C. Exclusion Match (New Logic)
      // If rule has 'exceptions' list, currentFileName must NOT be in it.
      const notExcluded = r.exceptions ? !r.exceptions.includes(currentFileName) : true;

      return colMatch && scopeMatch && notExcluded;
    });

    for (const rule of targetRules) {
      const allConditionsMet = rule.conditions.every(cond => {
        const valueToCheck = cond.column ? rowData[cond.column] : cellValue;
        return evaluateCondition(valueToCheck, cond.operator, cond.value);
      });

      if (allConditionsMet) {
        if (STYLE_PRESETS[rule.style]) return STYLE_PRESETS[rule.style];
        return { className: rule.style, style: {} };
      }
    }
  }
  
  // 2. Global Rules
  if (manifest.global_rules) {
    const globalRule = manifest.global_rules.find(r => r.column_name === columnName);
    if (globalRule && globalRule.match_type === 'exact' && globalRule.values) {
      const styleName = globalRule.values[cellValue];
      if (STYLE_PRESETS[styleName]) return STYLE_PRESETS[styleName];
      return { className: styleName || "", style: {} };
    }
  }

  return defaultStyle;
};