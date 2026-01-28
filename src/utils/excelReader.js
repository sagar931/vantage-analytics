import * as XLSX from 'xlsx';

export const readExcelFile = async (fileHandle) => {
  try {
    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
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
  
  // 1. Get Data
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // 2. Get Merges (SheetJS stores them in the '!merges' property)
  // Format: [ { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, ... ]
  const merges = sheet['!merges'] || [];

  return { data, merges };
};