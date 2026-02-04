
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

print("--- Cleaning up Unnamed House Churches ---")

# Get Bonamoussadi Center
res = supabase.table('centers').select('id').eq('name', 'BONAMOUSSADI').execute()
if not res.data:
    print("Center not found")
    exit(1)
center_id = res.data[0]['id']

# Find Unnamed HCs
hcs = supabase.table('house_churches').select('id, name').eq('center_id', center_id).ilike('name', 'Unnamed%').execute()

count_deleted_hcs = 0
count_deleted_members = 0

for hc in hcs.data:
    hc_id = hc['id']
    hc_name = hc['name']
    print(f"Deleting HC: {hc_name}")
    
    # Delete members first (if not cascading)
    # RLS or constraints might block, but service role should be fine.
    # Members might be orphans if we delete HC, or we delete them explicitly.
    mems = supabase.table('members').delete().eq('house_church_id', hc_id).execute()
    count_deleted_members += len(mems.data)
    
    # Delete HC
    supabase.table('house_churches').delete().eq('id', hc_id).execute()
    count_deleted_hcs += 1

print(f"Cleanup Complete:")
print(f"  - Deleted {count_deleted_hcs} House Churches")
print(f"  - Deleted {count_deleted_members} Members (Duplicates)")
