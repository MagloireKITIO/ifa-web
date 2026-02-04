
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
    clean = re.sub(r'^\d+[\.\s]*', '', name)
    return clean.strip()

def restore_members():
    print("--- Restoring Deleted Members ---")
    
    # 1. Resolve Centers
    centers = supabase.table('centers').select('id, name').execute().data
    c_map = {c['name']: c['id'] for c in centers}
    
    bonamoussadi_id = c_map.get('BONAMOUSSADI')
    logbessou_id = c_map.get('LOGBESSOU')
    akwa_id = c_map.get('AKWA')
    
    # 2. Define Restoration Map
    # Column Name -> Target Center ID
    restore_map = {
        "Logbessou sans Assemblé": logbessou_id,
        "Ancien Ass. AKWA NORD": akwa_id,
        "SANS ASSEMBLEES": bonamoussadi_id
    }
    
    # 3. Read File
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\ETAT ASSEMBLEES BONAMOUSSADI 2025.xlsx"
    df_raw = pd.read_excel(file_path, header=None)
    header_row_idx = None
    for idx, row in df_raw.iterrows():
        row_str = str(row.values).upper()
        if "MEKOULOU" in row_str:
            header_row_idx = idx
            break
            
    if header_row_idx is None:
        print("Header not found")
        return
        
    df = pd.read_excel(file_path, header=header_row_idx)
    
    total_restored = 0
    
    for col_name, target_center_id in restore_map.items():
        if col_name not in df.columns:
            print(f"Column {col_name} not found in Excel")
            continue
            
        print(f"Restoring from '{col_name}' -> Center ID: {target_center_id}")
        
        for raw_name in df[col_name]:
            if pd.isna(raw_name): continue
            s_name = str(raw_name).strip()
            if "NBRE" in s_name.upper() or s_name == "": continue
            if s_name.replace('.', '', 1).isdigit(): continue
            
            final_name = clean_member_name(s_name)
            if not final_name: continue
            
            # Check if exists (to avoid duplicates if run multiple times)
            # We assume unique name per center for now
            res = supabase.table('members').select('id').eq('full_name', final_name).eq('center_id', target_center_id).execute()
            if len(res.data) == 0:
                data = {
                    "full_name": final_name,
                    "center_id": target_center_id,
                    "house_church_id": None, # Explicitly no HC
                    "status": "active"
                }
                supabase.table('members').insert(data).execute()
                total_restored += 1
            else:
                print(f"  Skipping {final_name} (Already exists)")
                
    print(f"SUCCESS: Restored {total_restored} members.")

if __name__ == "__main__":
    restore_members()
