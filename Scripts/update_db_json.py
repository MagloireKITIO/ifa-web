import json
import uuid
import re

DB_PATH = r"c:\Users\KDave237\Projects\IFA-Dashboard\db.json"

def to_snake_case(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def convert_keys(data):
    if isinstance(data, dict):
        new_dict = {}
        for k, v in data.items():
            new_key = to_snake_case(k)
            new_dict[new_key] = convert_keys(v)
        return new_dict
    elif isinstance(data, list):
        return [convert_keys(item) for item in data]
    else:
        return data

# ID Mapping to ensure consistency (old_id -> new_uuid)
id_map = {}

def get_uuid(old_id):
    if old_id is None:
        return None
    if old_id not in id_map:
        id_map[old_id] = str(uuid.uuid4())
    return id_map[old_id]

def convert_ids(data):
    # This is trickier because we need to know which fields are IDs
    # Heuristic: ends with _id or is "id"
    if isinstance(data, dict):
        new_dict = {}
        for k, v in data.items():
            if k == "id" or k.endswith("_id") or k in ["submitted_by", "performed_by", "created_by"]:
                if isinstance(v, str) and not v.startswith("http"): # Skip URLs if any
                    new_dict[k] = get_uuid(v)
                elif isinstance(v, list): # List of IDs like center_ids
                     new_dict[k] = [get_uuid(x) for x in v] if v else []
                else:
                    new_dict[k] = v
            else:
                new_dict[k] = convert_ids(v)
        return new_dict
    elif isinstance(data, list):
        return [convert_ids(item) for item in data]
    else:
        return data

with open(DB_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Convert keys to snake_case
data = convert_keys(data)

# 2. Convert IDs to UUIDs
data = convert_ids(data)

with open(DB_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("db.json updated successfully.")
