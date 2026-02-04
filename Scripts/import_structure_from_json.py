import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(".env.local")

URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("Error: Supabase credentials not found")
    exit(1)

supabase: Client = create_client(URL, KEY)

DB_PATH = r"c:\Users\KDave237\Projects\IFA-Dashboard\db.json"

def main():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found")
        return

    with open(DB_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Zones
    zones = data.get("zones", [])
    print(f"Importing {len(zones)} zones...")
    for item in zones:
        try:
            supabase.table("zones").upsert(item).execute()
        except Exception as e:
            print(f"Error importing zone {item.get('name')}: {e}")

    # 2. Centers
    centers = data.get("centers", [])
    print(f"Importing {len(centers)} centers...")
    for item in centers:
        try:
            supabase.table("centers").upsert(item).execute()
        except Exception as e:
            print(f"Error importing center {item.get('name')}: {e}")

    # 3. House Churches
    hcs = data.get("house_churches", [])
    print(f"Importing {len(hcs)} house churches...")
    for item in hcs:
        try:
            supabase.table("house_churches").upsert(item).execute()
        except Exception as e:
            print(f"Error importing HC {item.get('name')}: {e}")
            
    print("Structure import complete.")

if __name__ == "__main__":
    main()
