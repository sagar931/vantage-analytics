import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../fraud_data_repository');

// 1. Setup Data Structures
const MODELS = [
  { id: 'GMD01', name: 'Unsecured_PL', segments: ['Salaried', 'SelfEmployed'] },
  { id: 'GMD02', name: 'CreditCards_Premium', segments: ['Existing', 'NewToBank'] },
  { id: 'GMD03', name: 'Auto_Loans', segments: ['Used', 'New'] }
];

const MONTHS = ['Jan', 'Feb', 'Mar'];
const YEARS = ['2025', '2026'];

// 2. Helper: Generate Random PSI Data
const generatePSIData = (rows = 20) => {
  const data = [['Score Band', 'Actual %', 'Expected %', 'PSI', 'Status']];
  for (let i = 0; i < rows; i++) {
    const act = Math.random() * 0.1;
    const exp = Math.random() * 0.1;
    const psi = (act - exp) * Math.log(act / exp);
    // Add logic: If PSI > 0.25 mark as Red (simulating drift)
    const status = psi > 0.25 ? 'Red' : psi > 0.1 ? 'Amber' : 'Green';
    data.push([`Band ${i + 1}`, act.toFixed(4), exp.toFixed(4), psi.toFixed(4), status]);
  }
  return data;
};

// 3. Helper: Generate Summary Data
const generateSummaryData = (modelName, period) => {
  return [
    ['Metric', 'Value', 'Threshold', 'Status'],
    ['Gini', (0.4 + Math.random() * 0.2).toFixed(2), '> 0.40', 'Green'],
    ['KS Score', (30 + Math.random() * 20).toFixed(0), '> 30', 'Green'],
    ['PSI Total', (Math.random() * 0.5).toFixed(3), '< 0.1', Math.random() > 0.8 ? 'Red' : 'Green'], // Randomly make some fail
    ['Model Owner', 'Risk Team A', '', ''],
    ['Review Date', new Date().toISOString().split('T')[0], '', '']
  ];
};

// 4. Main Generator
const generateFiles = () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
    console.log(`📂 Created root folder: ${OUTPUT_DIR}`);
  }

  MODELS.forEach(model => {
    // Create Model Folder
    const modelDir = path.join(OUTPUT_DIR, `${model.id}_${model.name}`);
    if (!fs.existsSync(modelDir)) fs.mkdirSync(modelDir);

    YEARS.forEach(year => {
        // Create Monthly Files
        MONTHS.forEach(month => {
            const fileName = `${model.id}_${model.name}_M_${month}${year}.xlsx`;
            const filePath = path.join(modelDir, fileName);
            
            // Create Workbook
            const wb = XLSX.utils.book_new();

            // Sheet 1: Summary
            const wsSummary = XLSX.utils.aoa_to_sheet(generateSummaryData(model.name, `${month} ${year}`));
            XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

            // Sheet 2: PSI (Heavy Data)
            const wsPSI = XLSX.utils.aoa_to_sheet(generatePSIData(50)); // 50 Bands
            XLSX.utils.book_append_sheet(wb, wsPSI, "PSI_Report");

            // Sheet 3: Volume (Dummy)
            const wsVol = XLSX.utils.aoa_to_sheet([['Date', 'Applications'], ['Total', Math.floor(Math.random() * 10000)]]);
            XLSX.utils.book_append_sheet(wb, wsVol, "Volume_Trends");

            XLSX.writeFile(wb, filePath);
            console.log(`   📄 Created: ${fileName}`);
        });

        // Create Quarterly File (Just one for demo)
        const qFileName = `${model.id}_${model.name}_Q_Q1${year}.xlsx`;
        const qFilePath = path.join(modelDir, qFileName);
        const wbQ = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbQ, XLSX.utils.aoa_to_sheet(generateSummaryData(model.name, `Q1 ${year}`)), "Summary_Q1");
        XLSX.writeFile(wbQ, qFilePath);
        console.log(`   📊 Created: ${qFileName}`);
    });
  });
  
  console.log("\n✅ Dummy Data Generation Complete!");
  console.log(`Location: ${OUTPUT_DIR}`);
};

generateFiles();