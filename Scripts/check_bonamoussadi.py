
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

print("--- House Churches for Bonamoussadi ---")
res = supabase.table('centers').select('id').eq('name', 'BONAMOUSSADI').execute()
if res.data:
    center_id = res.data[0]['id']
    hcs = supabase.table('house_churches').select('id, name').eq('center_id', center_id).execute()
    for hc in hcs.data:
        print(f"HC: {hc['name']} (ID: {hc['id']})")
        
        # Count members
        mems = supabase.table('members').select('id').eq('house_church_id', hc['id']).execute()
        print(f"  -> Members: {len(mems.data)}")
else:
    print("Bonamoussadi center not found.")
