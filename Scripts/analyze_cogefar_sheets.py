
import pandas as pd
import os

def analyze_sheets():
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Assemblées IFA COGEFAR Decembre 2025.xlsx"
    print(f"Analyzing {os.path.basename(file_path)}...")
    
    xl = pd.ExcelFile(file_path)
    print(f"Sheets found: {xl.sheet_names}")
    
    for sheet in xl.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        try:
            df = pd.read_excel(file_path, sheet_name=sheet, header=None, nrows=10)
            # Print first few rows to eyeball structure
            print(df.head(5))
        except Exception as e:
            print(f"Error reading sheet: {e}")

if __name__ == "__main__":
    analyze_sheets()
