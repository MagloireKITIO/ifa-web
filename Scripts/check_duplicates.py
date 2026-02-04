
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

def check_duplicates():
    print("--- House Church Audit ---")
    
    # Get all Centers
    centers = supabase.table('centers').select('id, name').execute().data
    center_map = {c['id']: c['name'] for c in centers}
    
    # Get all HCs
    hcs = supabase.table('house_churches').select('*').execute().data
    
    print(f"Total House Churches: {len(hcs)} (Expected: 37/38)")
    
    # Group by Center
    by_center = {}
    for hc in hcs:
        c_name = center_map.get(hc['center_id'], 'Unknown')
        if c_name not in by_center: by_center[c_name] = []
        by_center[c_name].append(hc)
        
    for c_name, hc_list in by_center.items():
        print(f"\nCenter: {c_name} ({len(hc_list)} HCs)")
        for hc in hc_list:
            print(f"  - {hc['name']}")

if __name__ == "__main__":
    check_duplicates()
