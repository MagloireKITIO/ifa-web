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

def main():
    email = "admin@ifa.org"
    print(f"Checking status for {email}...")
    
    try:
        # List users to find the specific one
        # admin.get_user_by_id is better if we had ID, but we want to search by email?
        # There isn't a direct get_user_by_email in some SDK versions, let's list.
        # Actually admin.list_users() is fine.
        
        users = supabase.auth.admin.list_users()
        found = False
        for u in users:
            if u.email == email:
                print(f"User found: {u.id}")
                print(f"  Email: {u.email}")
                print(f"  Confirmed at: {u.confirmed_at}")
                print(f"  Last sign in: {u.last_sign_in_at}")
                print(f"  App Metadata: {u.app_metadata}")
                print(f"  User Metadata: {u.user_metadata}")
                found = True
                break
        
        if not found:
            print("User NOT found in Supabase Auth!")

    except Exception as e:
        print(f"Error checking user: {e}")

if __name__ == "__main__":
    main()
