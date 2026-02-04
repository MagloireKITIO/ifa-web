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
    # Admin ID from db.json (verified to match Supabase Auth)
    target_id = "5c2853fd-bd65-4079-9032-d071c14912a3"
    target_email = "admin@ifa.org"
    new_password = "password123"
    
    print(f"Resetting password for {target_email} (ID: {target_id})...")
    
    try:
        res = supabase.auth.admin.update_user_by_id(
            target_id,
            {"password": new_password}
        )
        print("Password updated successfully.")
        print(f"User email: {res.user.email}")
        
    except Exception as e:
        print(f"Error updating password: {e}")

if __name__ == "__main__":
    main()
