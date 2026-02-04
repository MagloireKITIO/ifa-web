import json
import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env vars
load_dotenv(".env.local")

URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("Error: Supabase credentials not found in .env.local")
    exit(1)

supabase: Client = create_client(URL, KEY)

DB_PATH = r"c:\Users\KDave237\Projects\IFA-Dashboard\db.json"

def load_db():
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_db(data):
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def update_ids_in_obj(obj, id_map):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str) and v in id_map:
                obj[k] = id_map[v]
            elif isinstance(v, list): # List of IDs
                new_list = []
                for item in v:
                    if isinstance(item, str) and item in id_map:
                        new_list.append(id_map[item])
                    elif isinstance(item, (dict, list)):
                        new_list.append(update_ids_in_obj(item, id_map))
                    else:
                        new_list.append(item)
                obj[k] = new_list
            else:
                update_ids_in_obj(v, id_map)
        return obj
    elif isinstance(obj, list):
        return [update_ids_in_obj(item, id_map) for item in obj]
    else:
        return obj

def main():
    data = load_db()
    users = data.get("users", [])
    
    id_map = {} # old_id -> new_id
    
    print(f"Found {len(users)} users to process.")
    
    for user in users:
        email = user["email"]
        old_id = user["id"]
        full_name = user["full_name"]
        role = user["role"]
        
        print(f"Processing {email}...")
        
        # Check if user exists
        # Listing users is one way, or just try create and catch error
        # But we need the ID if it exists.
        
        # Note: list_users might not return specific email efficiently without filtering, 
        # but for small batch it's fine.
        # Ideally we try to create, if fail (already exists), we fetch user by email.
        
        new_id = None
        
        try:
            # Try to create user
            # Using admin.create_user
            # Default password
            res = supabase.auth.admin.create_user({
                "email": email,
                "password": "password123",
                "email_confirm": True,
                "user_metadata": {
                    "full_name": full_name,
                    "role": role
                }
            })
            new_id = res.user.id
            print(f"  Created new user: {new_id}")
            
        except Exception as e:
            # Likely already exists or other error
            # Check if it's "User already registered"
            print(f"  Create failed (might exist): {e}")
            
            # Try to find the user ID by email manually (list users and find)
            # This is inefficient for many users but fine for ~20
            # Pagination defaults to 50
            try:
                page = 1
                while True:
                    users_list = supabase.auth.admin.list_users(page=page, per_page=50)
                    found = False
                    for u in users_list:
                        if u.email == email:
                            new_id = u.id
                            found = True
                            break
                    if found or not users_list:
                        break
                    page += 1
                
                if new_id:
                    print(f"  Found existing user ID: {new_id}")
                else:
                    print(f"  Could not find user ID for {email}")
            except Exception as e2:
                print(f"  Lookup failed: {e2}")

        if new_id and new_id != old_id:
            id_map[old_id] = new_id
            user["id"] = new_id # Update user object directly too
    
    if id_map:
        print(f"Updating {len(id_map)} IDs in database...")
        # Deep update of all IDs in the database
        # We exclude the "users" list itself from the first pass to avoid double replacement if keys collide (unlikely with UUIDs)
        # But actually update_ids_in_obj handles the whole structure.
        
        # Careful: we already updated user["id"] in the loop above for the "users" list.
        # Now we need to update REFERENCES (foreign keys) in other tables.
        
        # Re-load clean data to be safe? No, let's just iterate the other tables.
        
        for table_name, table_data in data.items():
            if table_name == "users": 
                continue # Already updated IDs in loop
            
            print(f"  Updating table: {table_name}")
            data[table_name] = update_ids_in_obj(table_data, id_map)
            
        save_db(data)
        print("Database updated and saved.")
    else:
        print("No ID updates needed.")

if __name__ == "__main__":
    main()
