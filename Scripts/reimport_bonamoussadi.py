
import os
import pandas as pd
import re
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Supabase URL or Key not found in .env.local")
    exit(1)

supabase: Client = create_client(url, key)

def clean_member_name(name):
    if pd.isna(name): return None
    name = str(name).strip()
    # Remove leading numbers like "1.", "2 ", "14."
    # Regex: Start of string, one or more digits, optional dot, optional space
    clean = re.sub(r'^\d+[\.\s]*', '', name)
    return clean.strip()

def reimport_bonamoussadi():
    print("--- Re-Importing Bonamoussadi ---")
    
    # 1. Get Center ID
    res = supabase.table('centers').select('id').eq('name', 'BONAMOUSSADI').execute()
    if not res.data:
        print("Error: BONAMOUSSADI Center not found.")
        return
    center_id = res.data[0]['id']

    # 2. WIPE EXISTING MEMBERS for this Center to ensure no duplicates/bad formatting
    print("Wiping existing Bonamoussadi members...")
    supabase.table('members').delete().eq('center_id', center_id).execute()
    
    # 3. Read File
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\ETAT ASSEMBLEES BONAMOUSSADI 2025.xlsx"
    
    # Find Header dynamically
    df_raw = pd.read_excel(file_path, header=None)
    header_row_idx = None
    known_headers = ["MEKOULOU", "FOUDA", "DOUMBE"]
    
    for idx, row in df_raw.iterrows():
        row_str = str(row.values).upper()
        if any(h in row_str for h in known_headers):
            header_row_idx = idx
            break
            
    if header_row_idx is None:
        print("Error: Header row not found")
        return

    print(f"Header found at row {header_row_idx}")
    df = pd.read_excel(file_path, header=header_row_idx)
    
    # 4. Iterate House Churches
    hc_columns = [c for c in df.columns if "UNNAMED" not in str(c).upper() and str(c).upper() not in ["TOTAL", "ASSEMBLEES"]]
    
    total_imported = 0
    
    for hc_name in hc_columns:
        hc_name_clean = str(hc_name).strip()
        
        # Ensure HC exists
        hc_id = None
        res = supabase.table('house_churches').select('id').eq('name', hc_name_clean).eq('center_id', center_id).execute()
        if res.data:
            hc_id = res.data[0]['id']
        else:
            print(f"Creating HC: {hc_name_clean}")
            res = supabase.table('house_churches').insert({"name": hc_name_clean, "center_id": center_id}).execute()
            hc_id = res.data[0]['id']
            
        # Iterate Members
        for raw_name in df[hc_name]:
            if pd.isna(raw_name): continue
            s_name = str(raw_name).strip()
            
            # Skip metadata rows
            if "NBRE DE MEMBRES" in s_name.upper(): continue
            if "OBSERVATION" in s_name.upper(): continue
            if s_name == "": continue
            if s_name.replace('.', '', 1).isdigit(): continue # Skip pure numbers if any
            
            # Clean Name
            final_name = clean_member_name(s_name)
            if not final_name: continue
            
            # Insert
            data = {
                "full_name": final_name,
                "center_id": center_id,
                "house_church_id": hc_id,
                "status": "active"
            }
            try:
                supabase.table('members').insert(data).execute()
                total_imported += 1
            except Exception as e:
                print(f"Error inserting {final_name}: {e}")

    print(f"SUCCESS: Re-imported {total_imported} members for Bonamoussadi.")

if __name__ == "__main__":
    reimport_bonamoussadi()
