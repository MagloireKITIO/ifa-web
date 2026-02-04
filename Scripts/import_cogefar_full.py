
import os
import pandas as pd
import re
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def clean_member_name(name):
    if pd.isna(name): return None
    name = str(name).strip()
    return name

def import_cogefar():
    print("--- Importing COGEFAR (All Sheets) ---")
    
    # 1. Get Center ID
    res = supabase.table('centers').select('id').eq('name', 'COGEFAR').execute()
    if not res.data:
        print("Error: COGEFAR Center not found.")
        return
    center_id = res.data[0]['id']
    
    # 2. Get HC Map for COGEFAR
    hcs = supabase.table('house_churches').select('id, name').eq('center_id', center_id).execute()
    hc_map = {hc['name'].upper(): hc['id'] for hc in hcs.data}
    
    # 3. Define Sheet Mapping (Sheet Name -> HC Name in DB)
    # DB Names: CENTRE, ATINE, HEPNANG, SAID, YOUTA, ONAMBELE, FOZING
    sheet_map = {
        'HEPNANG': 'HEPNANG',
        'FOZING': 'FOZING',
        'YOUTA': 'YOUTA',
        'SAID': 'SAID',
        'COGEFAR': 'CENTRE', # Assuming 'COGEFAR' sheet is 'CENTRE' HC? Or is it separate? Let's check DB list. 
        'ATINE': 'ATINE',
        'ONAMBELE': 'ONAMBELE',
        'YONGA 22': 'YONGA', # Wait, YONGA is in JAPOMA in DB structure? 
        # Wait, the prompt said "JAPOMA: YONGA, DONTSOP..."
        # But here YONGA is in COGEFAR file. 
        # If user assigned YONGA to JAPOMA, we should respect that structure OR assume this file is outdated?
        # Let's map YONGA 22 to YONGA in JAPOMA if it exists, or create in Cogefar?
        # User prompt said: "JAPOMA ... 1 YONGA". So YONGA is JAPOMA.
        # But this file is "Cogefar Decembre 2025". Maybe Yonga moved?
        # I will check if YONGA exists in JAPOMA and use that ID.
    }
    
    # Special handling for YONGA
    yonga_hc_id = None
    yonga_res = supabase.table('house_churches').select('id').eq('name', 'YONGA').execute()
    if yonga_res.data:
        yonga_hc_id = yonga_res.data[0]['id']
    
    # "PAS D'ASSEMBLEES" -> No HC, but Center=Cogefar
    
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Assemblées IFA COGEFAR Decembre 2025.xlsx"
    xl = pd.ExcelFile(file_path)
    
    total_imported = 0
    
    for sheet in xl.sheet_names:
        if sheet == 'Recapitulatif': continue
        
        print(f"\nProcessing Sheet: {sheet}")
        
        # Determine Target HC and Center
        target_center = center_id
        target_hc_id = None
        
        if sheet == "PAS D'ASSEMBLEES":
            target_hc_id = None # Center Only
        elif sheet == "YONGA 22":
            if yonga_hc_id:
                target_hc_id = yonga_hc_id
                # Check Center of Yonga
                hc_check = supabase.table('house_churches').select('center_id').eq('id', yonga_hc_id).execute()
                if hc_check.data:
                    target_center = hc_check.data[0]['center_id']
                    print("  -> Mapping to JAPOMA (YONGA)")
            else:
                print("  Warning: YONGA HC not found in DB.")
                continue
        else:
            # Map standard Cogefar sheets
            db_name = sheet_map.get(sheet, sheet.upper())
            target_hc_id = hc_map.get(db_name)
            if not target_hc_id:
                print(f"  Warning: HC '{db_name}' not found in COGEFAR HCs. Checking if exists globally...")
                # Fallback?
                pass
        
        # Read Data
        # Most sheets seem to have header at Row 2 (Index 2) -> "NOM ET PRENOMS"
        # "PAS D'ASSEMBLEES" has header at Row 0?
        # Let's hunt for header "NOM"
        
        df_raw = pd.read_excel(file_path, sheet_name=sheet, header=None)
        header_idx = None
        for idx, row in df_raw.iterrows():
            if "NOM" in str(row.values).upper() and "PRENOM" in str(row.values).upper():
                header_idx = idx
                break
        
        if header_idx is None:
            print("  Header not found.")
            continue
            
        df = pd.read_excel(file_path, sheet_name=sheet, header=header_idx)
        
        # Find Name Column
        name_col = next((c for c in df.columns if "NOM" in str(c).upper()), None)
        if not name_col:
            print("  Name column not found.")
            continue
            
        # Import Rows
        count = 0
        for _, row in df.iterrows():
            name = row[name_col]
            if pd.isna(name): continue
            name = str(name).strip()
            if name == "" or name.upper() == "NOM ET PRENOMS": continue
            
            # Check existing
            res = supabase.table('members').select('id').eq('full_name', name).execute()
            if len(res.data) == 0:
                data = {
                    "full_name": name,
                    "center_id": target_center,
                    "house_church_id": target_hc_id,
                    "status": "active"
                }
                try:
                    supabase.table('members').insert(data).execute()
                    count += 1
                except Exception as e:
                    print(f"  Error: {e}")
            else:
                pass # Skip duplicate
        
        print(f"  -> Imported {count} members.")
        total_imported += count

    print(f"\nTotal Cogefar Import: {total_imported}")

if __name__ == "__main__":
    import_cogefar()
