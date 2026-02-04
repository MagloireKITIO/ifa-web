
import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import date

load_dotenv('.env.local')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def import_sanaga():
    print("--- Importing Sanaga Maritime ---")
    
    # 1. Create Zone
    zone_name = "Sanaga Maritime"
    res = supabase.table('zones').select('id').eq('name', zone_name).execute()
    if res.data:
        zone_id = res.data[0]['id']
    else:
        print(f"Creating Zone: {zone_name}")
        res = supabase.table('zones').insert({"name": zone_name, "region": "Littoral"}).execute()
        zone_id = res.data[0]['id']
        
    # 2. Create Reporting Period "Dec 2025"
    period_date = "2025-12-01"
    res = supabase.table('reporting_periods').select('id').eq('start_date', period_date).execute()
    if res.data:
        period_id = res.data[0]['id']
    else:
        print("Creating Reporting Period: Dec 2025")
        res = supabase.table('reporting_periods').insert({
            "name": "December 2025",
            "start_date": period_date,
            "end_date": "2025-12-31",
            "is_locked": False
        }).execute()
        period_id = res.data[0]['id']

    # 3. Read Data
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Effectifs des assemblées EoY2025.xlsx"
    df = pd.read_excel(file_path, sheet_name="SANAGA MARITIME", header=1)
    
    # Filter valid rows
    valid_rows = df[df['EGLISES'].notna()]
    
    for _, row in valid_rows.iterrows():
        center_name = str(row['EGLISES']).strip()
        
        # Skip summary rows
        if "NOMBRE" in center_name.upper() or "EFFECTIF" in center_name.upper(): continue
        
        leader_name = row.get('DIRIGEANTS DES EGLISES')
        if pd.isna(leader_name): leader_name = None
        
        metrics = row.get('EFFECTIFS\nEoY 2023') # Using the column we saw
        if pd.isna(metrics): metrics = 0
        
        print(f"Processing: {center_name} (Leader: {leader_name}, Count: {metrics})")
        
        # 4. Create Center
        c_res = supabase.table('centers').select('id').eq('name', center_name).execute()
        if c_res.data:
            center_id = c_res.data[0]['id']
            # Update zone if needed
            supabase.table('centers').update({'zone_id': zone_id}).eq('id', center_id).execute()
        else:
            print(f"  Creating Center: {center_name}")
            c_res = supabase.table('centers').insert({
                "name": center_name,
                "zone_id": zone_id,
                "status": "active"
            }).execute()
            center_id = c_res.data[0]['id']
            
        # 5. Create "Main" House Church for Leader
        # Since we don't have member lists, we attach the leader here
        hc_name = "CENTRE"
        hc_res = supabase.table('house_churches').select('id').eq('name', hc_name).eq('center_id', center_id).execute()
        if hc_res.data:
            hc_id = hc_res.data[0]['id']
            # Update host
            if leader_name:
                supabase.table('house_churches').update({'host_name': leader_name}).eq('id', hc_id).execute()
        else:
            print(f"  Creating HC '{hc_name}' for Leader")
            hc_res = supabase.table('house_churches').insert({
                "name": hc_name,
                "center_id": center_id,
                "host_name": leader_name
            }).execute()
            hc_id = hc_res.data[0]['id']
            
        # 6. Insert Metrics into stats_people
        # We'll use 'attendance_total' or similar?
        # Let's check stats_people columns via schema (or guess standard ones)
        # Standard columns usually: attendance_men, attendance_women, attendance_children, attendance_total
        # We only have total.
        
        # Check if stats exist
        stats_res = supabase.table('stats_people').select('id').eq('center_id', center_id).eq('period_id', period_id).execute()
        if len(stats_res.data) == 0:
            print(f"  Inserting Metrics: {metrics}")
            supabase.table('stats_people').insert({
                "center_id": center_id,
                "period_id": period_id,
                "attendance_total": metrics, # Assuming this column exists, if not will fail and I'll fix
                "notes": "Imported from EoY 2025 Excel"
            }).execute()
        else:
            print("  Metrics already exist.")

if __name__ == "__main__":
    import_sanaga()
