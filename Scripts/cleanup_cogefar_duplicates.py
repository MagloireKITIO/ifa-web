
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def cleanup_duplicates():
    print("--- Cleaning up Cogefar Duplicates ---")
    
    # 1. Get all members
    # We want to find members with same name.
    # We'll fetch all members for simplicity (dataset is small ~500)
    all_mems = supabase.table('members').select('id, full_name, center_id, house_church_id').execute().data
    
    # Group by name
    by_name = {}
    for m in all_mems:
        name = m['full_name'].strip().upper()
        if name not in by_name: by_name[name] = []
        by_name[name].append(m)
        
    duplicates_removed = 0
    
    for name, mems in by_name.items():
        if len(mems) > 1:
            print(f"Duplicate found: {name} ({len(mems)} records)")
            
            # Logic:
            # - If one has HC and other doesn't, keep HC.
            # - If one is in Japoma (Yonga) and other is Cogefar (Null), keep Japoma.
            # - If duplicates are identical, delete one.
            
            # Sort by "has house_church_id" (descending, so None is last)
            # Actually we want to prioritize:
            # 1. Has HC
            # 2. Created later (maybe?)
            
            # Let's categorize
            with_hc = [m for m in mems if m['house_church_id'] is not None]
            without_hc = [m for m in mems if m['house_church_id'] is None]
            
            keep_id = None
            delete_ids = []
            
            if with_hc:
                keep_id = with_hc[0]['id']
                delete_ids.extend([m['id'] for m in with_hc[1:]]) # If multiple with HC?
                delete_ids.extend([m['id'] for m in without_hc])
            else:
                # All have no HC. Keep one.
                keep_id = without_hc[0]['id']
                delete_ids.extend([m['id'] for m in without_hc[1:]])
            
            if delete_ids:
                print(f"  Keeping ID: {keep_id}")
                print(f"  Deleting IDs: {delete_ids}")
                supabase.table('members').delete().in_('id', delete_ids).execute()
                duplicates_removed += len(delete_ids)

    print(f"Cleanup Complete. Removed {duplicates_removed} duplicates.")

if __name__ == "__main__":
    cleanup_duplicates()
