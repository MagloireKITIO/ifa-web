
import pandas as pd
import glob
import os
import json

raw_data_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data"
files = glob.glob(os.path.join(raw_data_path, "*.xlsx"))

report = {}

for file in files:
    try:
        filename = os.path.basename(file)
        print(f"Analyzing {filename}...")
        
        # Read the excel file
        # Attempt to read the first sheet
        df = pd.read_excel(file)
        
        file_info = {
            "rows": len(df),
            "columns": list(df.columns),
            "dtypes": {k: str(v) for k, v in df.dtypes.items()},
            "null_counts": {k: int(v) for k, v in df.isnull().sum().items()},
            "sample_data": json.loads(df.head(3).to_json(orient="records", date_format="iso"))
        }
        
        report[filename] = file_info
        
    except Exception as e:
        report[filename] = {"error": str(e)}

print(json.dumps(report, indent=2))
