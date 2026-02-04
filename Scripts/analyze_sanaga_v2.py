
import pandas as pd
import os

def analyze_sanaga_detailed():
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Effectifs des assemblées EoY2025.xlsx"
    sheet_name = "SANAGA MARITIME"
    
    print(f"Reading {sheet_name}...")
    
    # Try reading header at Row 1 (index 1)
    df = pd.read_excel(file_path, sheet_name=sheet_name, header=1)
    
    print("Columns:", df.columns.tolist())
    print("-" * 30)
    
    # Show first 20 rows
    print(df.head(20))

if __name__ == "__main__":
    analyze_sanaga_detailed()
