
import os
import pandas as pd
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

# Helper: Get Bonamoussadi Center ID
print("Fetching Bonamoussadi Center ID...")
res = supabase.table('centers').select('id').eq('name', 'BONAMOUSSADI').execute()
if not res.data:
    print("Error: BONAMOUSSADI Center not found.")
    exit(1)
center_id = res.data[0]['id']

def import_bonamoussadi():
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\ETAT ASSEMBLEES BONAMOUSSADI 2025.xlsx"
    print(f"Processing {os.path.basename(file_path)}...")
    
    # 1. READ THE FILE
    # Hunt for the header row dynamically
    df_raw = pd.read_excel(file_path, header=None)
    header_row_idx = None
    
    # We look for a row that contains known HC names or "ASSEMBLEES"
    known_headers = ["ASSEMBLEES", "FOUDA", "MEKOULOU", "DOUMBE", "ONOMO"]
    
    for idx, row in df_raw.iterrows():
        row_str = str(row.values).upper()
        matches = sum(1 for h in known_headers if h in row_str)
        if matches >= 2: # At least 2 matches to be sure
            header_row_idx = idx
            break
            
    if header_row_idx is None:
        print("Error: Could not find header row in Bonamoussadi file")
        return

    print(f"Found header at row index {header_row_idx}")
    df = pd.read_excel(file_path, header=header_row_idx)
    
    # Inspect columns to find House Churches
    # We expect columns to be names of Leaders/House Churches
    # We need to filter out columns like "ASSEMBLEES" or "Total"
    
    hc_columns = []
    for col in df.columns:
        col_str = str(col).strip()
        if "UNNAMED" in col_str: continue # Skip if header failed
        if col_str.upper() in ["ASSEMBLEES", "TOTAL", "SANS ASSEMBLEES", "NBRE DE MEMBRES TOTAL"]: 
            # Note: "SANS ASSEMBLEES" is a valid bucket for members without a HC
            if col_str.upper() == "SANS ASSEMBLEES":
                hc_columns.append(col)
            continue
            
        # Assume it's a House Church
        hc_columns.append(col)
        
    print(f"Found {len(hc_columns)} House Churches columns: {hc_columns}")
    
    total_imported = 0
    
    for hc_name in hc_columns:
        # 2. ENSURE HOUSE CHURCH EXISTS
        hc_name_clean = str(hc_name).strip()
        
        # Check/Create HC
        hc_id = None
        if hc_name_clean.upper() != "SANS ASSEMBLEES":
            res = supabase.table('house_churches').select('id').eq('name', hc_name_clean).eq('center_id', center_id).execute()
            if res.data:
                hc_id = res.data[0]['id']
            else:
                print(f"  Creating House Church: {hc_name_clean}")
                res = supabase.table('house_churches').insert({"name": hc_name_clean, "center_id": center_id}).execute()
                hc_id = res.data[0]['id']
        
        # 3. IMPORT MEMBERS FOR THIS HC
        # Iterate down the column
        members_series = df[hc_name].dropna()
        
        for member_name in members_series:
            member_name = str(member_name).strip()
            
            # Skip rows that are clearly stats or noise
            if member_name.isdigit(): continue # Skip counts at bottom
            if len(member_name) < 3: continue 
            if member_name.upper() in ["TOTAL", "NBRE DE MEMBRES"]: continue
            
            # Insert Member
            data = {
                "full_name": member_name,
                "center_id": center_id,
                "house_church_id": hc_id,
                "status": 'active'
            }
            
            try:
                supabase.table('members').insert(data).execute()
                total_imported += 1
            except Exception as e:
                # print(f"    Error inserting {member_name}: {e}")
                pass
                
    print(f"-> Successfully imported {total_imported} members for BONAMOUSSADI")

if __name__ == "__main__":
    import_bonamoussadi()
