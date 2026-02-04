
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def verify_cogefar_no_hc():
    print("--- Verifying Cogefar 'No House Church' Members ---")
    
    # Get Cogefar ID
    res = supabase.table('centers').select('id').eq('name', 'COGEFAR').execute()
    if not res.data:
        print("Cogefar center not found")
        return
    center_id = res.data[0]['id']
    
    # 1. Check if "PAS D'ASSEMBLEES" HC exists
    hc_res = supabase.table('house_churches').select('*').eq('center_id', center_id).ilike('name', "%PAS D'ASSEMBLEES%").execute()
    if hc_res.data:
        print(f"FOUND INVALID HC: {hc_res.data[0]['name']} (ID: {hc_res.data[0]['id']})")
        # If found, we need to fix
        hc_id = hc_res.data[0]['id']
        
        # Move members to NULL
        print("  Unassigning members from this HC...")
        mems = supabase.table('members').update({'house_church_id': None}).eq('house_church_id', hc_id).execute()
        print(f"  Moved {len(mems.data)} members to No House Church.")
        
        # Delete HC
        print("  Deleting invalid HC...")
        supabase.table('house_churches').delete().eq('id', hc_id).execute()
        print("  Done.")
    else:
        print("No House Church named 'PAS D'ASSEMBLEES' found (Good).")

    # 2. Count members with NULL HC in Cogefar
    null_res = supabase.table('members').select('*', count='exact', head=True)\
        .eq('center_id', center_id)\
        .is_('house_church_id', 'null')\
        .execute()
        
    print(f"Members in Cogefar without House Church: {null_res.count}")
    
    # List a few names to confirm
    sample = supabase.table('members').select('full_name')\
        .eq('center_id', center_id)\
        .is_('house_church_id', 'null')\
        .limit(5).execute()
    
    for m in sample.data:
        print(f"  - {m['full_name']}")

if __name__ == "__main__":
    verify_cogefar_no_hc()
