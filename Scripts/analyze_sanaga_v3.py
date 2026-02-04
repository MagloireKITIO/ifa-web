
import pandas as pd
import os

def analyze_sanaga_clean():
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Effectifs des assemblées EoY2025.xlsx"
    sheet_name = "SANAGA MARITIME"
    
    df = pd.read_excel(file_path, sheet_name=sheet_name, header=1)
    
    # Filter where EGLISES is not null
    clean_df = df[df['EGLISES'].notna()]
    
    print(clean_df[['ARRONDISSEMENT', 'EGLISES', 'DIRIGEANTS DES EGLISES', 'EFFECTIFS\nEoY 2023']])

if __name__ == "__main__":
    analyze_sanaga_clean()
