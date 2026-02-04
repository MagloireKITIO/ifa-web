
import pandas as pd
import os

def convert_to_md():
    input_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\ETAT ASSEMBLEES BONAMOUSSADI 2025.xlsx"
    output_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\ETAT_ASSEMBLEES_BONAMOUSSADI_2025.md"
    
    print(f"Reading {input_path}...")
    
    # Hunt for the header row dynamically (same logic as import script)
    df_raw = pd.read_excel(input_path, header=None)
    header_row_idx = None
    known_headers = ["ASSEMBLEES", "FOUDA", "MEKOULOU", "DOUMBE", "ONOMO"]
    
    for idx, row in df_raw.iterrows():
        row_str = str(row.values).upper()
        matches = sum(1 for h in known_headers if h in row_str)
        if matches >= 2:
            header_row_idx = idx
            break
            
    if header_row_idx is None:
        print("Error: Could not find header row.")
        return

    # Read with correct header
    df = pd.read_excel(input_path, header=header_row_idx)
    
    # Clean up: Replace NaNs with empty string
    df = df.fillna("")
    
    # Convert to Markdown
    md_content = f"# ETAT ASSEMBLEES BONAMOUSSADI 2025\n\n"
    md_content += f"**Source File:** `{os.path.basename(input_path)}`\n"
    md_content += f"**Generated:** {pd.Timestamp.now()}\n\n"
    
    md_content += df.to_markdown(index=False)
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(md_content)
        
    print(f"Markdown file created at: {output_path}")

if __name__ == "__main__":
    convert_to_md()
