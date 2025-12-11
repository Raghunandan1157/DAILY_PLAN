import * as XLSX from 'xlsx';
import fs from 'fs';

try {
    const buf = fs.readFileSync('Plan.xlsx');
    const wb = XLSX.read(buf);
    const result = { sheets: wb.SheetNames, data: {} };

    wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }); // Array of arrays
        if (data.length > 0) {
            result.data[sheetName] = {
                columns: data[0],
                sample_rows: data.slice(1, 20),
                total_rows: data.length
            };
        }
    });

    console.log(JSON.stringify(result, null, 2));
} catch (e) {
    console.error(e);
}
