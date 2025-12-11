import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const EXCEL_FILE = 'Plan.xlsx';
const OUTPUT_FILE = 'src/data/branches.json';

// Column mapping based on the provided sample data
// Index in the array (0-based)
// Column mapping based on the provided sample data
// Index in the array (0-based)
const COL = {
    BRANCH: 0,
    DISTRICT: 1,
    DM_NAME: 2,
    REGION: 3,
    FO_COUNT: 4,

    // Disbursement Targets
    SANCTION_PENDING_ACC: 5,
    SANCTION_PENDING_AMT: 6,
    IGL_FIG_ACC: 7,
    IGL_FIG_AMT: 8,
    IL_ACC: 9,
    IL_AMT: 10,
    KYC_SOURCING: 11,

    // Collection Plan (1-30 DPD)
    NOV_SLIPPED_ACC: 17,
    EMI1_COLLECTION: 18,
    EMI2_COLLECTION: 19,

    // FTOD Plan
    FTOD_ACC: 23,
    FTOD_COLL: 24,

    // PNPA Plan
    PNPA_ACC: 27,
    PNPA_COLL: 28,

    // NPA Plan
    NPA_KYC: 31,
    NPA_ACTIVATION: 32,
    NPA_CLOSURE: 33
};

// Re-map based on the analyze_plan.js output we saw earlier for "KADIRI"
// Row 2 (0-indexed) was the headers
// Row 3 was data: "KADIRI", "KADAPA", "PUTTA PRASAD", "ANDRA PRADESH", 5, null, null, null, 0, null, 0 ...
// It seems some columns are null.

// Let's create a more robust mapper that reads the File and tries to find the data rows.
try {
    const buf = fs.readFileSync(EXCEL_FILE);
    const wb = XLSX.read(buf);
    const sheetName = wb.SheetNames[0]; // Assuming first sheet
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

    // Find the header row that contains "Branch"
    let headerRowIndex = -1;
    for (let i = 0; i < data.length; i++) {
        if (data[i] && data[i].includes('Branch')) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        throw new Error('Could not find header row with "Branch"');
    }

    // Process rows after header
    const branches = [];
    const headers = data[headerRowIndex];

    // We need to define which index maps to which JSON key
    // We'll iterate and build the hierarchy later

    // Helper to get value
    const getVal = (row, idx) => {
        const val = row[idx];
        return (val === undefined || val === null) ? 0 : val;
    };

    for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue; // Skip empty rows or rows without Branch name

        const branch = {
            id: i, // distinct ID based on row index
            name: row[COL.BRANCH],
            district: row[COL.DISTRICT],
            dmName: row[COL.DM_NAME],
            region: row[COL.REGION],
            foCount: getVal(row, COL.FO_COUNT),

            // Structured Targets
            targets: {
                disbursement: {
                    sanctionPending: {
                        accounts: getVal(row, COL.SANCTION_PENDING_ACC),
                        amount: getVal(row, COL.SANCTION_PENDING_AMT)
                    },
                    iglFig: {
                        accounts: getVal(row, COL.IGL_FIG_ACC),
                        amount: getVal(row, COL.IGL_FIG_AMT)
                    },
                    il: {
                        accounts: getVal(row, COL.IL_ACC),
                        amount: getVal(row, COL.IL_AMT)
                    },
                    kycSourcing: getVal(row, COL.KYC_SOURCING)
                },
                collection: {
                    oneToThirtyDpd: {
                        novSlippedAccounts: getVal(row, COL.NOV_SLIPPED_ACC),
                        emi1: getVal(row, COL.EMI1_COLLECTION),
                        emi2: getVal(row, COL.EMI2_COLLECTION)
                    },
                    ftod: {
                        accounts: getVal(row, COL.FTOD_ACC),
                        collection: getVal(row, COL.FTOD_COLL)
                    },
                    pnpa: {
                        accounts: getVal(row, COL.PNPA_ACC),
                        collection: getVal(row, COL.PNPA_COLL)
                    },
                    npa: {
                        kyc: getVal(row, COL.NPA_KYC),
                        activation: getVal(row, COL.NPA_ACTIVATION),
                        closure: getVal(row, COL.NPA_CLOSURE)
                    }
                }
            }
        };

        branches.push(branch);
    }

    // Build Hierarchy
    const hierarchy = {};

    branches.forEach(b => {
        const region = b.region || 'Unknown Region';
        const district = b.district || 'Unknown District';

        if (!hierarchy[region]) hierarchy[region] = {};
        if (!hierarchy[region][district]) hierarchy[region][district] = [];

        hierarchy[region][district].push(b);
    });

    const output = {
        meta: {
            totalBranches: branches.length,
            generatedAt: new Date().toISOString()
        },
        hierarchy: hierarchy,
        flatList: branches
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`Successfully generated ${OUTPUT_FILE} with ${branches.length} branches.`);

} catch (e) {
    console.error('Error processing Excel file:', e);
    process.exit(1);
}
