
import pandas as pd
import os

def analyze_sanaga():
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Effectifs des assemblées EoY2025.xlsx"
    sheet_name = "SANAGA MARITIME"
    
    print(f"Reading {sheet_name} from {os.path.basename(file_path)}...")
    
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None, nrows=15)
        print(df)
    except Exception as e:
        print(f"Error: {e}")
        # List sheets just in case
        xl = pd.ExcelFile(file_path)
        print(f"Available sheets: {xl.sheet_names}")

if __name__ == "__main__":
    analyze_sanaga()
