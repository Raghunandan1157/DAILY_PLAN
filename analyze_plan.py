import pandas as pd
import json
import sys

# Ensure stdout uses utf-8
sys.stdout.reconfigure(encoding='utf-8')

try:
    xl = pd.ExcelFile("Plan.xlsx")
    result = {"sheets": xl.sheet_names, "data": {}}
    
    for sheet in xl.sheet_names:
        df = xl.parse(sheet)
        # Clean data: Replace NaN with None for valid JSON
        df = df.where(pd.notnull(df), None)
        
        result["data"][sheet] = {
            "columns": list(df.columns),
            "sample_rows": df.head(20).to_dict(orient='records'),
            "total_rows": len(df)
        }
    
    print(json.dumps(result, indent=2, default=str))
except Exception as e:
    print(f"Error: {e}")
