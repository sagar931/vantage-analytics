import * as XLSX from 'xlsx';

export const readExcelFile = async (fileHandle) => {
  try {
    // 1. Get the actual File object from the handle
    const file = await fileHandle.getFile();
    
    // 2. Read into an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 3. Parse with SheetJS
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // 4. Return the list of Sheet Names and the Workbook object
    // We don't parse rows yet to keep it fast. We only parse rows when a specific sheet is clicked.
    return {
      sheetNames: workbook.SheetNames,
      workbook: workbook,
      fileName: file.name
    };
  } catch (err) {
    console.error("Error reading Excel file:", err);
    throw new Error("Failed to read file");
  }
};

export const parseSheetData = (workbook, sheetName) => {
  const sheet = workbook.Sheets[sheetName];
  // Convert sheet to JSON (Array of Arrays is best for preserving layout)
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
};