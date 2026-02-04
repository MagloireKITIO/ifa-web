
import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role for admin access

if not url or not key:
    print("Error: Supabase URL or Key not found in .env.local")
    exit(1)

supabase: Client = create_client(url, key)

def import_structure():
    print("--- Phase 1: Importing Structure (Centers & House Churches) ---")
    
    # 1. Import Centers
    centers_file = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Effectifs des assemblées EoY2025.xlsx"
    if not os.path.exists(centers_file):
        print(f"File not found: {centers_file}")
        return

    print(f"Reading {centers_file}...")
    # Based on analyze_data.py, header is likely row 0 (which is what pandas reads by default)
    # Sample data showed: "Unnamed: 0": "DEPARTEMENTS", "Unnamed: 4": "EGLISES"
    # So headers are actually on row 1 (index 0 is row 1 in excel if we skip nothing? No, analyze_data used df.head(3))
    # Let's read with header=1 (row 2 in excel, 0-indexed is 1)
    df_centers = pd.read_excel(centers_file, header=1)
    
    # Rename columns based on our findings
    # The columns are likely: DEPARTEMENTS, LEADER, ARRONDISSEMENTS, LEADERS, EGLISES, COORDONATEURS DES CENTRES...
    # Let's clean up column names
    df_centers.columns = df_centers.columns.str.strip()
    
    # Filter out rows where EGLISES is null
    if 'EGLISES' in df_centers.columns:
        centers_list = df_centers[['EGLISES', 'COORDONATEURS DES CENTRES']].dropna(subset=['EGLISES'])
        
        for index, row in centers_list.iterrows():
            center_name = row['EGLISES']
            # Basic cleanup
            if not isinstance(center_name, str): continue
            center_name = center_name.strip()
            if center_name.upper() == "TOTAL": continue
            
            print(f"Processing Center: {center_name}")
            
            # Check if exists
            res = supabase.table('centers').select('id').eq('name', center_name).execute()
            if len(res.data) == 0:
                # Insert
                data = {
                    "name": center_name,
                    # We could map Zone if we had mapping logic, defaulting to generic zone or creating one?
                    # For now, let's just insert Center. Note: zone_id is foreign key.
                    # We need a default zone.
                }
                
                # Let's get or create a default zone
                zone_res = supabase.table('zones').select('id').eq('name', 'Douala').execute()
                if len(zone_res.data) == 0:
                     zone_res = supabase.table('zones').insert({"name": "Douala"}).execute()
                
                zone_id = zone_res.data[0]['id']
                data['zone_id'] = zone_id
                
                supabase.table('centers').insert(data).execute()
                print(f"  -> Created")
            else:
                print(f"  -> Exists")

    # 2. Import House Churches
    # We will look for House Churches in other files
    # Mapping based on filenames/content
    # Example: ETAT ASSEMBLEES BONAMOUSSADI 2025.xlsx -> Center: BONAMOUSSADI
    
    files_map = {
        "ETAT ASSEMBLEES BONAMOUSSADI 2025.xlsx": "BONAMOUSSADI",
        "Listes Assemblées Bonaberi.xlsx": "BONABERI", 
        # Add others if known mapping
    }
    
    raw_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data"
    
    for filename, center_keyword in files_map.items():
        file_path = os.path.join(raw_path, filename)
        if not os.path.exists(file_path): continue
        
        print(f"Processing House Churches from {filename} for {center_keyword}...")
        
        # Find the center ID
        # We need to fuzzy match center_keyword to DB center names
        # Or create if missing (Bonaberi might not be in Effectifs file?)
        
        # Let's search for center
        res = supabase.table('centers').select('id, name').ilike('name', f"%{center_keyword}%").execute()
        center_id = None
        if len(res.data) > 0:
            center_id = res.data[0]['id']
            print(f"  -> Linked to Center: {res.data[0]['name']}")
        else:
            print(f"  -> Center {center_keyword} not found in DB. Creating...")
            # Create
            zone_res = supabase.table('zones').select('id').eq('name', 'Douala').execute()
            zone_id = zone_res.data[0]['id']
            res = supabase.table('centers').insert({"name": center_keyword, "zone_id": zone_id}).execute()
            center_id = res.data[0]['id']
            
        # Parse file for House Churches
        # Logic specific to file type
        if filename == "ETAT ASSEMBLEES BONAMOUSSADI 2025.xlsx":
            # This file seemed to be a matrix or list. 
            # Sample data: Col 0: "ASSEMBLEES", "MEKOULOU M", "FOUDA"... these look like Leader names or Assembly names?
            # Actually "ASSEMBLEE CHEZ LES YONGA" in another file.
            # In "ETAT ASSEMBLEES BONAMOUSSADI 2025.xlsx", "ETAT ASSEMBLEES BONAMOUSSADI" col has "ASSEMBLEES" then names.
            # Let's assume names in column 0 starting from row X are House Churches or Leaders.
            # Analyze data showed: "FOUDA", "Ancien Ass. AKWA NORD", "DOUMBE"...
            # Let's treat them as House Church names for now.
            df = pd.read_excel(file_path, header=2) # Header seems to be row 2 (index 1) or 3
            # Let's try to just read column 0
            df = pd.read_excel(file_path)
            # Find the column with "ASSEMBLEES" or similar
            target_col = None
            for col in df.columns:
                if "ASSEMBLEE" in str(col).upper() or "NOM" in str(col).upper():
                    target_col = col
                    break
            
            if target_col:
                for val in df[target_col].dropna():
                    val = str(val).strip()
                    if val.upper() in ["ASSEMBLEES", "TOTAL", "NBRE DE MEMBRES TOTAL"]: continue
                    
                    # Check if exists
                    hc_res = supabase.table('house_churches').select('id').eq('name', val).eq('center_id', center_id).execute()
                    if len(hc_res.data) == 0:
                        supabase.table('house_churches').insert({"name": val, "center_id": center_id}).execute()
                        print(f"    -> Created House Church: {val}")

        elif filename == "Listes Assemblées Bonaberi.xlsx":
            # This file had multiple tables.
            # We need to scan for "ASSEMBLEE CHEZ..."
            # Using openpyxl might be better to iterate rows and find headers
            pass # Complex parsing, maybe skip for this quick script or implement simple scan
            
            df = pd.read_excel(file_path, header=None)
            current_hc = None
            for index, row in df.iterrows():
                val = str(row[1]) # Column 1 had "ASSEMBLEE CHEZ LES NZOGUE" in sample
                if "ASSEMBLEE" in val.upper():
                    hc_name = val.strip()
                    # Insert
                    hc_res = supabase.table('house_churches').select('id').eq('name', hc_name).eq('center_id', center_id).execute()
                    if len(hc_res.data) == 0:
                        supabase.table('house_churches').insert({"name": hc_name, "center_id": center_id}).execute()
                        print(f"    -> Created House Church: {hc_name}")

if __name__ == "__main__":
    import_structure()
