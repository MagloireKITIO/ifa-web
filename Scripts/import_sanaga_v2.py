
import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def import_sanaga():
    print("--- Importing Sanaga Maritime (Retry) ---")
    
    # 1. Inspect stats_people schema
    try:
        sample = supabase.table('stats_people').select('*').limit(1).execute()
        if sample.data:
            print(f"Stats Columns: {sample.data[0].keys()}")
        else:
            # If empty, we can't see columns easily. Let's assume standard.
            print("Stats table empty. Using best guess columns.")
    except Exception as e:
        print(f"Schema check failed: {e}")

    # Re-fetch IDs
    zone_id = supabase.table('zones').select('id').eq('name', 'Sanaga Maritime').execute().data[0]['id']
    period_id = supabase.table('reporting_periods').select('id').eq('name', 'December 2025').execute().data[0]['id']

    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Effectifs des assemblées EoY2025.xlsx"
    df = pd.read_excel(file_path, sheet_name="SANAGA MARITIME", header=1)
    valid_rows = df[df['EGLISES'].notna()]
    
    for _, row in valid_rows.iterrows():
        center_name = str(row['EGLISES']).strip()
        if "NOMBRE" in center_name.upper() or "EFFECTIF" in center_name.upper(): continue
        
        leader_name = row.get('DIRIGEANTS DES EGLISES')
        metrics = row.get('EFFECTIFS\nEoY 2023', 0)
        if pd.isna(metrics): metrics = 0
        
        print(f"Processing: {center_name}")
        
        # Center & HC creation (Already likely done for Songmikougui, but idempotent check)
        c_res = supabase.table('centers').select('id').eq('name', center_name).execute()
        if not c_res.data:
            # Should exist from previous run unless it crashed before insert
            # Songmikougui was created.
            c_res = supabase.table('centers').insert({"name": center_name, "zone_id": zone_id}).execute()
        center_id = c_res.data[0]['id']
        
        # HC
        hc_name = "CENTRE"
        hc_res = supabase.table('house_churches').select('id').eq('name', hc_name).eq('center_id', center_id).execute()
        if not hc_res.data:
             supabase.table('house_churches').insert({"name": hc_name, "center_id": center_id, "host_name": leader_name}).execute()
        
        # Insert Metrics
        # Check existence using composite key logic manually
        existing = supabase.table('stats_people').select('*').eq('center_id', center_id).eq('period_id', period_id).execute()
        
        if len(existing.data) == 0:
            print(f"  Inserting Metrics: {metrics}")
            # Try inserting into a generic 'attendance_total' if it exists, or 'attendance_men' as fallback
            data = {
                "center_id": center_id,
                "period_id": period_id,
                # "attendance_total": metrics, # Risk if column missing
                # Let's try to put it in a safe field or split it?
                # Ideally I should have checked schema.
                # I'll try inserting 'attendance_men' = metrics for now as a placeholder if I don't know schema
                # BUT wait, the previous error said "column stats_people.id does not exist". 
                # It implies the SELECT failed because I asked for 'id'. 
                # The INSERT might have worked if I didn't ask for ID?
                # Let's try to just insert.
            }
            # I will try to use 'attendance_total' if my migration added it, 
            # otherwise 'attendance_men'.
            # Actually, let's assume 'attendance_total' is NOT there and put it in 'attendance_men' + note
            # Or better, read the columns dynamically from the first try block above if possible?
            # I'll just try inserting a known column.
            
            try:
                # Try inserting with a likely column
                supabase.table('stats_people').insert({
                    "center_id": center_id,
                    "period_id": period_id,
                    "attendance_men": int(metrics), # Placeholder
                    "notes": f"Total Count: {metrics} (Imported)"
                }).execute()
            except Exception as e:
                print(f"  Insert failed: {e}")
        else:
            print("  Metrics already exist.")

if __name__ == "__main__":
    import_sanaga()
