import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const PLAN_FILE = path.join(ROOT_DIR, 'Plan.xlsx');
const OUTPUT_FILE = path.join(ROOT_DIR, 'src', 'data', 'trends.json');

function parseExcel() {
    try {
        const buf = fs.readFileSync(PLAN_FILE);
        const wb = XLSX.read(buf);
        const ws = wb.Sheets[wb.SheetNames[0]]; // Assume first sheet
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Identify Rows
        // Row 0: Super Headers (Disbursement TARGET, etc)
        // Row 1: Category Headers (Sanction Pending, etc)
        // Row 2: Columns (Branch, District, Amount, etc)
        // Row 3+: Data

        // Map columns based on Row 2 (Index 2)
        const headers = data[2];
        const branchIdx = headers.indexOf('Branch');
        const districtIdx = headers.indexOf('District');
        const regionIdx = headers.indexOf('Region');

        // We need to find columns for metrics. 
        // Since headers like "Amount" are repeated, we need to use index ranges or improved mapping.
        // Let's perform a smart mapping based on parent headers.

        const metrics = {
            disbursement: { target: 0, achievement: 0 },
            collection: { target: 0, achievement: 0 }
        };

        // Helper to find column index by hierarchy
        // We'll iterate columns and track the "Latest" super headers
        const columnMap = [];
        let lastSuper = '';
        let lastCategory = '';

        // Row 0 - Super Header
        const row0 = data[0];
        // Row 1 - Category Header
        const row1 = data[1];
        // Row 2 - Main Header
        const row2 = data[2];

        for (let i = 0; i < row2.length; i++) {
            if (row0 && row0[i]) lastSuper = row0[i];
            if (row1 && row1[i]) lastCategory = row1[i];

            columnMap[i] = {
                super: lastSuper,
                category: lastCategory,
                header: row2[i]
            };
        }

        const regions = {};
        const districts = {};
        const branches = [];

        // Iterate Data Rows
        for (let i = 3; i < data.length; i++) {
            const row = data[i];
            const branchName = row[branchIdx];
            if (!branchName) continue;

            const districtName = row[districtIdx] || 'Unknown';
            const regionName = row[regionIdx] || 'Unknown';

            // Extract Metrics
            let disbTarget = 0;
            let disbAch = 0;
            let collTarget = 0;
            let collAch = 0;

            console.log(`Processing ${branchName}...`);

            columnMap.forEach((col, idx) => {
                const val = Number(row[idx]) || 0;

                // Logic to identify columns
                // Disbursement Target
                if (col.super?.includes('Disbursement TARGET') && col.header === 'Amount') {
                    disbTarget += val;
                }
                // Disbursement Achievement
                if (col.super?.includes('Disbursement Achievement') && col.header === 'Amount') {
                    disbAch += val;
                }
                // Collection Target/Plan
                // "1 - 30 DPD Collection Plan", "FTOD PLAN", "PNPA PLAN", "NPA PLAN"
                if (col.category?.includes('Plan') && col.super?.includes('Collection')) {
                    // Check specific columns if needed or sum all "Collection Plan"
                    // Inspecting analyze_plan.js output: 
                    // Row 1 has "1 - 30 DPD Collection Plan", "FTOD PLAN", "PNPA PLAN", "NPA PLAN"
                    // Wait, in analyze_plan output: 
                    // Row 0 has "Collection" at the end.
                    // Row 1 has "FTOD PLAN", "PNPA PLAN" etc. 
                    // Row 2 has "Collection Plan" under those?
                    // Let's look at analyzing output again.

                    // Row 0: ..., "Collection"
                    // Row 1: ..., "FTOD PLAN", ..., "PNPA PLAN", ...
                    // Row 2: ..., "Collection Plan", "Actual Collected", "Balance"

                    // So if Row 2 matches "Collection Plan" or "1 EMI Collection" etc, we add to target.
                    if (col.header === 'Collection Plan' || col.header.includes('Collection')) {
                        collTarget += val;
                    }
                }

                // Collection Achievement
                if (col.header === 'Actual Collected' || col.header === 'Actual collected') {
                    collAch += val;
                }
            });

            // Initialize Region/District if needed
            if (!regions[regionName]) regions[regionName] = {
                name: regionName,
                current: { disbursement: 0, collection: 0 },
                previous: { disbursement: 0, collection: 0 } // Mock previous
            };
            if (!districts[districtName]) districts[districtName] = {
                name: districtName,
                region: regionName,
                current: { disbursement: 0, collection: 0 },
                previous: { disbursement: 0, collection: 0 }
            };

            // Accumulate Valid Data
            // We only have "Current" data in the sheet effectively.
            // For TREND demo, we will SIMULATE previous month as varying +/- 10-20% of current.
            // In a real scenario, we'd read another file or column.

            // Deterministic mock for "Previous" to keep it stable
            const mockFactor = 0.8 + ((branchName.length % 5) / 10); // 0.8 to 1.2

            const branchData = {
                name: branchName,
                region: regionName,
                district: districtName,
                current: { disbursement: disbAch, collection: collAch },
                previous: {
                    disbursement: Math.round(disbAch * mockFactor),
                    collection: Math.round(collAch * mockFactor)
                }
            };
            branches.push(branchData);

            // Aggregate
            regions[regionName].current.disbursement += disbAch;
            regions[regionName].current.collection += collAch;
            regions[regionName].previous.disbursement += branchData.previous.disbursement;
            regions[regionName].previous.collection += branchData.previous.collection;

            districts[districtName].current.disbursement += disbAch;
            districts[districtName].current.collection += collAch;
            districts[districtName].previous.disbursement += branchData.previous.disbursement;
            districts[districtName].previous.collection += branchData.previous.collection;
        }

        const output = {
            lastUpdated: new Date().toISOString(),
            regions: Object.values(regions),
            districts: Object.values(districts),
            branches: branches
        };

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
        console.log('Trends data generated successfully!');

    } catch (error) {
        console.error('Error parsing Excel:', error);
    }
}

parseExcel();
