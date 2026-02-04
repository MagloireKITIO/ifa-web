
import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv('.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Supabase URL or Key not found in .env.local")
    exit(1)

supabase: Client = create_client(url, key)

# Helper: Get all centers and house churches for lookups
print("Fetching structure map...")
centers_map = {c['name'].upper(): c['id'] for c in supabase.table('centers').select('id, name').execute().data}
hc_data = supabase.table('house_churches').select('id, name, center_id').execute().data
hc_map = {} 
for hc in hc_data:
    hc_map[hc['name'].upper()] = hc['id']

def clean_phone(val):
    if pd.isna(val): return None
    s = str(val).replace(' ', '').replace('-', '').replace('.', '')
    digits = "".join(filter(str.isdigit, s))
    if len(digits) == 9: return digits
    return digits[:9] if len(digits) > 9 else digits

def clean_bool(val):
    if pd.isna(val): return False
    s = str(val).upper()
    return s in ['OUI', 'YES', 'X', 'TRUE', '1']

def clean_year(val):
    if pd.isna(val): return None
    try:
        return int(float(val))
    except:
        return None

def import_members_japoma():
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\LISTE DES MEMBRES DU CENTRE A JAPOMA.xlsx"
    print(f"Processing {os.path.basename(file_path)}...")
    
    # Try reading without header first to find the real header
    df_raw = pd.read_excel(file_path, header=None)
    header_row_idx = None
    
    # Hunt for "Nom & Prénom"
    for idx, row in df_raw.iterrows():
        row_str = str(row.values).upper()
        if "NOM" in row_str and "PRÉNOM" in row_str:
            header_row_idx = idx
            break
            
    if header_row_idx is None:
        print("  Error: Could not find header row in Japoma file")
        return

    # Read again with correct header
    df = pd.read_excel(file_path, header=header_row_idx)
    
    # Normalize columns
    df.columns = df.columns.str.strip()
    
    center_id = centers_map.get('JAPOMA')
    count = 0
    
    # Find correct column names
    name_col = next((c for c in df.columns if "NOM" in str(c).upper()), None)
    hc_col = next((c for c in df.columns if "ASSEMBL" in str(c).upper()), None)
    
    if not name_col:
        print("  Error: Could not identify Name column")
        return

    for _, row in df.iterrows():
        name = row[name_col]
        if pd.isna(name) or str(name).strip() == "": continue
        if str(name).upper() == "NOM & PRÉNOM": continue # Skip header repetition
        
        hc_name = str(row.get(hc_col, '')).upper().strip() if hc_col else ""
        hc_id = hc_map.get(hc_name)
        
        data = {
            "full_name": name,
            "center_id": center_id,
            "house_church_id": hc_id,
            "status": 'active'
        }
        
        try:
            supabase.table('members').insert(data).execute()
            count += 1
        except Exception as e:
            # print(f"  Error inserting {name}: {e}")
            pass
            
    print(f"  -> Imported {count} members for JAPOMA")

def import_members_cogefar():
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Assemblées IFA COGEFAR Decembre 2025.xlsx"
    print(f"Processing {os.path.basename(file_path)}...")
    
    # Hunt for header
    df_raw = pd.read_excel(file_path, header=None)
    header_row_idx = None
    
    for idx, row in df_raw.iterrows():
        row_str = str(row.values).upper()
        # Fuzzy match for Cogefar header
        if "NOM" in row_str and ("PRENOM" in row_str or "PRÉNOM" in row_str):
            header_row_idx = idx
            break
            
    if header_row_idx is None:
        print("  Error: Could not find header row in Cogefar file")
        return

    df = pd.read_excel(file_path, header=header_row_idx)
    center_id = centers_map.get('COGEFAR')
    
    # Map Columns
    col_map = {}
    for c in df.columns:
        c_str = str(c).upper()
        if "NOM" in c_str: col_map['name'] = c
        if "CONTACT" in c_str: col_map['phone'] = c
        if "NAISSANCE" in c_str: col_map['birth'] = c
        if "CONVERSION" in c_str: col_map['conversion'] = c
        if "BAPTÊME DANS L'EAU" in c_str: col_map['water_baptism'] = c
    
    count = 0
    for _, row in df.iterrows():
        if 'name' not in col_map: break
        name = row[col_map['name']]
        
        # Skip garbage
        if pd.isna(name): continue
        if str(name).strip().upper() in ["NOM ET PRENOMS", "TOTAL"]: continue
        if "ANNEE DE NAISSANCE" in str(name).upper(): continue
        
        data = {
            "full_name": name,
            "center_id": center_id,
            "phone": clean_phone(row.get(col_map.get('phone'))),
            "birth_year": clean_year(row.get(col_map.get('birth'))),
            "conversion_year": clean_year(row.get(col_map.get('conversion'))),
            "is_baptized": clean_bool(row.get(col_map.get('water_baptism'))),
        }
        
        try:
            supabase.table('members').insert(data).execute()
            count += 1
        except:
            pass
            
    print(f"  -> Imported {count} members for COGEFAR")

if __name__ == "__main__":
    import_members_japoma()
    import_members_cogefar()
