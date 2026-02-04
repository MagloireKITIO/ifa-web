
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

TO_DELETE = [
    # Bonamoussadi Noise
    "OBSERVATION", 
    "Ancien Ass. AKWA NORD", 
    "Logbessou sans Assemblé", 
    "SANS ASSEMBLEES", 
    "Total",
    # Bonaberi Duplicate
    "ASSEMBLEE DU CENTRE" 
]

def cleanup():
    print("--- Cleaning up Duplicates ---")
    
    # 1. Handle Bonaberi Merge specifically
    # Move members from "ASSEMBLEE DU CENTRE" to "CENTRE"
    print("Merging Bonaberi 'ASSEMBLEE DU CENTRE' -> 'CENTRE'...")
    res_bad = supabase.table('house_churches').select('id').eq('name', 'ASSEMBLEE DU CENTRE').execute()
    res_good = supabase.table('house_churches').select('id').eq('name', 'CENTRE').eq('center_id', '391fd1c6-a937-4577-b503-07788a422baa').execute() # Need correct Center ID for Bonaberi
    
    # Let's find Bonaberi ID dynamically to be safe
    bonaberi_res = supabase.table('centers').select('id').eq('name', 'BONABERI').execute()
    if bonaberi_res.data:
        bonaberi_id = bonaberi_res.data[0]['id']
        res_good = supabase.table('house_churches').select('id').eq('name', 'CENTRE').eq('center_id', bonaberi_id).execute()
        
        if res_bad.data and res_good.data:
            bad_id = res_bad.data[0]['id']
            good_id = res_good.data[0]['id']
            
            # Move members
            mems = supabase.table('members').update({'house_church_id': good_id}).eq('house_church_id', bad_id).execute()
            print(f"  Moved {len(mems.data)} members.")
    
    # 2. Delete the list
    for name in TO_DELETE:
        print(f"Deleting HC: {name}")
        # Delete members attached to these (orphans/noise)
        # For 'Logbessou sans Assemblé', these might be real people?
        # Let's check count before delete
        res = supabase.table('house_churches').select('id').eq('name', name).execute()
        if res.data:
            hc_id = res.data[0]['id']
            mems = supabase.table('members').select('id').eq('house_church_id', hc_id).execute()
            if len(mems.data) > 0:
                print(f"  Warning: Deleting {len(mems.data)} members attached to {name} (Assumed duplicates/noise)")
                supabase.table('members').delete().eq('house_church_id', hc_id).execute()
            
            supabase.table('house_churches').delete().eq('id', hc_id).execute()
            print("  Deleted.")
        else:
            print("  Not found.")

if __name__ == "__main__":
    cleanup()
