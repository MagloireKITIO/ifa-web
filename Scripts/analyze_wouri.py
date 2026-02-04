
import pandas as pd
import os

def analyze_wouri():
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Effectifs des assemblées EoY2025.xlsx"
    sheet_name = "WOURI"
    
    print(f"Reading {sheet_name}...")
    
    # Try reading header at Row 1 (index 1) based on previous sheet experience
    df = pd.read_excel(file_path, sheet_name=sheet_name, header=1)
    
    print("Columns:", df.columns.tolist())
    print("-" * 30)
    
    # Filter where EGLISES is not null to see data rows
    if 'EGLISES' in df.columns:
        clean_df = df[df['EGLISES'].notna()]
        print(clean_df.head(20))
    else:
        print("Column 'EGLISES' not found. Raw head:")
        print(df.head(10))

if __name__ == "__main__":
    analyze_wouri()
