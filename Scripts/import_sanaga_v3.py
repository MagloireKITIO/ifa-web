
import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def import_sanaga():
    print("--- Importing Sanaga Maritime (v3) ---")
    
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
        
        # 1. Ensure Center
        c_res = supabase.table('centers').select('id').eq('name', center_name).execute()
        if not c_res.data:
            c_res = supabase.table('centers').insert({"name": center_name, "zone_id": zone_id}).execute()
        center_id = c_res.data[0]['id']
        
        # 2. Ensure HC
        hc_name = "CENTRE"
        hc_res = supabase.table('house_churches').select('id').eq('name', hc_name).eq('center_id', center_id).execute()
        if not hc_res.data:
             supabase.table('house_churches').insert({"name": hc_name, "center_id": center_id, "host_name": leader_name}).execute()
        
        # 3. Create/Get Report
        # Check if report exists
        rep_res = supabase.table('reports').select('id').eq('center_id', center_id).eq('period_id', period_id).execute()
        if rep_res.data:
            report_id = rep_res.data[0]['id']
        else:
            print("  Creating Report...")
            rep_res = supabase.table('reports').insert({
                "center_id": center_id, 
                "period_id": period_id,
                "status": "submitted" # Mark as submitted since we have data
            }).execute()
            report_id = rep_res.data[0]['id']

        # 4. Insert Stats
        # Check if stats exist for this report
        stats_res = supabase.table('stats_people').select('*').eq('report_id', report_id).execute()
        
        if len(stats_res.data) == 0:
            print(f"  Inserting Metrics: {metrics}")
            try:
                supabase.table('stats_people').insert({
                    "report_id": report_id,
                    "attendance_men": int(metrics), # Placeholder
                    "notes": f"Total Count: {metrics} (Imported from Excel)"
                }).execute()
            except Exception as e:
                print(f"  Insert stats failed: {e}")
        else:
            print("  Metrics already exist.")

if __name__ == "__main__":
    import_sanaga()
