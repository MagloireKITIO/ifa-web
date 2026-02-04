
import os
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

# Define the Official Structure
OFFICIAL_STRUCTURE = {
    "BONAMOUSSADI": [
        "MEKOULOU M", "DOUMBE", "ONOMO", "KOLLO DAVID", "ZEBAZE ERIC", "AWAM", "MPILLA"
    ],
    "LOGBESSOU": [
        "TIENTCHEU", "ZEBAZE SAUREL", "FOUDA", "ZENDONG"
    ],
    "AKWA": [
        "NDE E", "FOTSO", "FOMUDE", "NJONJUE", "ELEMBA"
    ],
    "COGEFAR": [
        "CENTRE", "ATINE", "HEPNANG", "SAID", "YOUTA", "ONAMBELE", "FOZING"
    ],
    "BONABERI": [
        "BOYOMO", "AMANG", "ANKOUO", "ENENGUENE", "CENTRE", "NZOGUE", "HELEN", "CLAIRE PENDA", "NADINE"
    ],
    "JAPOMA": [
        "YONGA", "DONTSOP", "EPOH", "AKONG", "LEKO"
    ]
}

def normalize_name(name):
    """Normalize HC name for comparison (remove 'ASSEMBLEE', 'CHEZ', leading numbers, etc.)"""
    if not name: return ""
    name = name.upper()
    name = re.sub(r'^(ASSEMBLEE|ASS\.|CHEZ LES|CHEZ|MAMAN|PST)\s+', '', name)
    name = re.sub(r'\s+(DAVID|ERIC|SAUREL|M)$', '', name) # Remove suffixes for fuzzy match base
    return name.strip()

def restructure_db():
    print("--- Restructuring Database to 6 Official Centers ---")
    
    # 1. Ensure Official Centers Exist
    center_ids = {}
    
    # Get default Zone
    zone_res = supabase.table('zones').select('id').eq('name', 'Douala').execute()
    zone_id = zone_res.data[0]['id'] if zone_res.data else None
    
    for center_name in OFFICIAL_STRUCTURE.keys():
        res = supabase.table('centers').select('id').eq('name', center_name).execute()
        if res.data:
            center_ids[center_name] = res.data[0]['id']
            print(f"Center Exists: {center_name}")
        else:
            print(f"Creating Center: {center_name}")
            res = supabase.table('centers').insert({"name": center_name, "zone_id": zone_id}).execute()
            center_ids[center_name] = res.data[0]['id']

    # 2. Process House Churches & Move Members
    # We need to find existing HCs that match (fuzzy) and move them to correct Center
    # Or rename them.
    
    all_hcs = supabase.table('house_churches').select('id, name, center_id').execute().data
    
    for center_name, hc_list in OFFICIAL_STRUCTURE.items():
        target_center_id = center_ids[center_name]
        
        for official_hc_name in hc_list:
            # Find match in existing DB
            match_found = None
            
            # 1. Exact Match
            for db_hc in all_hcs:
                if db_hc['name'].upper() == official_hc_name:
                    match_found = db_hc
                    break
            
            # 2. Fuzzy/Substring Match if no exact
            if not match_found:
                # Key identifiers
                key_part = normalize_name(official_hc_name)
                for db_hc in all_hcs:
                    db_norm = normalize_name(db_hc['name'])
                    if key_part in db_norm or db_norm in key_part:
                         # Extra check for common names like "CENTRE"
                        if key_part == "CENTRE" and db_hc['name'] != "CENTRE": continue 
                        match_found = db_hc
                        break
            
            if match_found:
                # Update it
                print(f"Updating HC: {match_found['name']} -> {official_hc_name} (Center: {center_name})")
                supabase.table('house_churches').update({
                    "name": official_hc_name,
                    "center_id": target_center_id
                }).eq('id', match_found['id']).execute()
                
                # Update members under it to new center_id (redundant but safe)
                supabase.table('members').update({
                    "center_id": target_center_id
                }).eq('house_church_id', match_found['id']).execute()
                
            else:
                # Create New
                print(f"Creating New HC: {official_hc_name} in {center_name}")
                supabase.table('house_churches').insert({
                    "name": official_hc_name,
                    "center_id": target_center_id
                }).execute()

    # 3. Cleanup Old Centers
    # Identify centers NOT in the official list
    all_centers = supabase.table('centers').select('id, name').execute().data
    for c in all_centers:
        if c['name'] not in OFFICIAL_STRUCTURE:
            print(f"Deleting Deprecated Center: {c['name']}")
            # We must handle orphans. 
            # Ideally, we should check if they have members/HCs left.
            # If our logic above worked, valid HCs are moved.
            # Leftovers are truly deprecated.
            
            # Delete leftover HCs
            supabase.table('house_churches').delete().eq('center_id', c['id']).execute()
            # Delete Center
            supabase.table('centers').delete().eq('id', c['id']).execute()

    print("--- Restructure Complete ---")

if __name__ == "__main__":
    restructure_db()
