
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def check_schema():
    print("--- Checking Stats Schema ---")
    try:
        # Insert a dummy row to trigger an error that reveals columns? 
        # Or just select * limit 1
        res = supabase.table('stats_people').select('*').limit(1).execute()
        if res.data:
            print("Columns:", res.data[0].keys())
        else:
            print("Table empty. Trying to describe...")
            # Can't describe via client easily.
            pass
    except Exception as e:
        print(e)

if __name__ == "__main__":
    check_schema()
