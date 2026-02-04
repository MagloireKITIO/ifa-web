
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
# For house churches, we might have duplicate names in different centers, so map by (name, center_id) or fuzzy match
hc_data = supabase.table('house_churches').select('id, name, center_id').execute().data
hc_map = {} # name -> id (Warning: collision risk if same HC name in diff centers)
for hc in hc_data:
    hc_map[hc['name'].upper()] = hc['id']

def clean_phone(val):
    if pd.isna(val): return None
    s = str(val).replace(' ', '').replace('-', '').replace('.', '')
    # Extract digits
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
    
    # Analyze showed header at row 3 (index 2)
    df = pd.read_excel(file_path, header=2)
    
    # Center: JAPOMA
    center_id = centers_map.get('JAPOMA')
    if not center_id:
        print("  Error: Center JAPOMA not found")
        return

    count = 0
    for _, row in df.iterrows():
        name = row.get('Nom & Prénom')
        if pd.isna(name) or str(name).strip() == "": continue
        
        hc_name = str(row.get('Assemblée de Maison', '')).upper().strip()
        status = row.get('Statut', 'active')
        
        # Link HC
        hc_id = hc_map.get(hc_name)
        
        # Insert
        data = {
            "full_name": name,
            "center_id": center_id,
            "house_church_id": hc_id,
            "status": status,
            # No phone/dates in this specific file based on sample
        }
        
        try:
            supabase.table('members').insert(data).execute()
            count += 1
        except Exception as e:
            print(f"  Error inserting {name}: {e}")
            
    print(f"  -> Imported {count} members for JAPOMA")

def import_members_bonaberi():
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Listes Assemblées Bonaberi.xlsx"
    print(f"Processing {os.path.basename(file_path)}...")
    
    center_id = centers_map.get('BONABERI')
    
    # This file has multiple tables. We need to parse row by row.
    df = pd.read_excel(file_path, header=None)
    
    current_hc_id = None
    count = 0
    
    for _, row in df.iterrows():
        val0 = str(row[0]) if not pd.isna(row[0]) else ""
        val1 = str(row[1]) if not pd.isna(row[1]) else ""
        
        # Detect Header "ASSEMBLEE..."
        if "ASSEMBLEE" in val1.upper():
            hc_name = val1.strip().upper()
            current_hc_id = hc_map.get(hc_name)
            if not current_hc_id:
                # Try creating it? Or fuzzy match?
                # We created them in step 1, so it should exist if names match
                # Let's try partial match if direct fail
                pass
            continue
            
        # Detect Member Row (If Col 0 is a number like "1", "2"...)
        if val0.isdigit():
            name = val1
            if not name or name.upper() == "NOM": continue
            
            condition = str(row[2]) if len(row) > 2 else ""
            
            data = {
                "full_name": name,
                "center_id": center_id,
                "house_church_id": current_hc_id,
                "notes": condition
            }
            
            try:
                supabase.table('members').insert(data).execute()
                count += 1
            except Exception as e:
                pass

    print(f"  -> Imported {count} members for BONABERI")

def import_members_cogefar():
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Assemblées IFA COGEFAR Decembre 2025.xlsx"
    print(f"Processing {os.path.basename(file_path)}...")
    
    center_id = centers_map.get('COGEFAR')
    
    # This file has explicit columns but headers might be tricky
    # Sample showed "NOM ET PRENOMS" at row 1 (index 0 if we read with header=1)
    df = pd.read_excel(file_path, header=1)
    
    # Identify columns
    # We need to map dynamic columns. Let's find index.
    col_map = {}
    for c in df.columns:
        c_str = str(c).upper()
        if "NOM" in c_str: col_map['name'] = c
        if "CONTACT" in c_str: col_map['phone'] = c
        if "NAISSANCE" in c_str: col_map['birth'] = c
        if "CONVERSION" in c_str: col_map['conversion'] = c
        if "BAPTÊME DANS L'EAU" in c_str: col_map['water_baptism'] = c
        if "QUARTIER" in c_str: col_map['address'] = c
    
    count = 0
    for _, row in df.iterrows():
        if 'name' not in col_map: break
        name = row[col_map['name']]
        if pd.isna(name) or str(name).strip() == "NOM ET PRENOMS": continue
        
        # Check if this row is actually a House Church Header?
        # In this file, it seems to be one big list for "ASSEMBLEE CHEZ LES YONGA" based on filename?
        # Or does it contain multiple?
        # The sample showed "ASSEMBLEE CHEZ LES YONGA" in Col 1 Row 0.
        # Let's assume for now it's all one assembly or we need to find the assembly name.
        # Wait, the sample had "ASSEMBLEE CHEZ LES YONGA" as a value in column "ASSEMBLEE CHEZ LES YONGA".
        # It implies the whole sheet might be that assembly, OR that column changes.
        
        # Let's default to a generic "COGEFAR MAIN" if no HC specified, or look for HC.
        
        data = {
            "full_name": name,
            "center_id": center_id,
            "phone": clean_phone(row.get(col_map.get('phone'))),
            "birth_year": clean_year(row.get(col_map.get('birth'))),
            "conversion_year": clean_year(row.get(col_map.get('conversion'))),
            "is_baptized": clean_bool(row.get(col_map.get('water_baptism'))),
            "notes": str(row.get(col_map.get('address'), ''))
        }
        
        try:
            supabase.table('members').insert(data).execute()
            count += 1
        except:
            pass
            
    print(f"  -> Imported {count} members for COGEFAR")

if __name__ == "__main__":
    import_members_japoma()
    import_members_bonaberi()
    import_members_cogefar()
