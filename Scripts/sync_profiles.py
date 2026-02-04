import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(".env.local")

URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("Error: Supabase credentials not found in .env.local")
    exit(1)

supabase: Client = create_client(URL, KEY)

DB_PATH = r"c:\Users\KDave237\Projects\IFA-Dashboard\db.json"

def main():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found")
        exit(1)
        
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    users = data.get("users", [])
    print(f"Found {len(users)} users in db.json. Syncing to 'profiles' table...")
    
    success_count = 0
    error_count = 0
    
    for user in users:
        # Prepare profile data
        # Ensure we only include fields that exist in the profiles table schema
        # Based on typical setup and types/index.ts
        profile_data = {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "center_id": user["center_id"],
            "house_church_id": user["house_church_id"],
            "avatar": user.get("avatar"),
            # Let Supabase handle created_at/updated_at unless critical
            # "created_at": user["created_at"],
            # "updated_at": user["updated_at"] 
        }
        
        try:
            # Upsert (insert or update)
            res = supabase.table("profiles").upsert(profile_data).execute()
            print(f"  Synced: {user['email']}")
            success_count += 1
        except Exception as e:
            print(f"  Error syncing {user['email']}: {e}")
            error_count += 1

    print(f"\nSync complete. Success: {success_count}, Errors: {error_count}")

if __name__ == "__main__":
    main()
