
import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def import_wouri():
    print("--- Importing Wouri EoY Data ---")
    
    # 1. Define Years and Columns
    year_map = {
        2020: 'EFFECTIFS\nEoY 2020',
        2021: 'EFFECTIFS\nEoY 2021',
        2022: 'EFFECTIFS\nEoY 2022',
        2023: 'EFFECTIFS\nEoY 2023',
        2024: 'EFFECTIFS\nEoY 2024',
        2025: 'EFFECTIFS\nEoY 2025'
    }
    
    # 2. Ensure Reporting Periods Exist
    period_ids = {}
    for year in year_map.keys():
        name = f"December {year}"
        res = supabase.table('reporting_periods').select('id').eq('name', name).execute()
        if res.data:
            period_ids[year] = res.data[0]['id']
        else:
            print(f"Creating Period: {name}")
            start_date = f"{year}-12-01"
            end_date = f"{year}-12-31"
            res = supabase.table('reporting_periods').insert({
                "name": name,
                "start_date": start_date,
                "end_date": end_date,
                "is_locked": True # Lock old years? Maybe false for now.
            }).execute()
            period_ids[year] = res.data[0]['id']

    # 3. Read and Aggregate Data
    file_path = r"c:\Users\KDave237\Projects\IFA-Dashboard\Raw_Data\Effectifs des assemblées EoY2025.xlsx"
    df = pd.read_excel(file_path, sheet_name="WOURI", header=1)
    
    # Group by CENTRE
    # Clean center names first?
    if 'CENTRES' not in df.columns:
        print("Column 'CENTRES' not found!")
        return

    # Normalize center names (UPPER, strip)
    df['CENTRES'] = df['CENTRES'].astype(str).str.strip().str.upper()
    
    # Iterate Centers
    centers = df['CENTRES'].unique()
    
    for center_name in centers:
        if center_name == "NAN" or "TOTAL" in center_name: continue
        
        print(f"\nProcessing Center: {center_name}")
        
        # Get Center ID
        c_res = supabase.table('centers').select('id').eq('name', center_name).execute()
        if not c_res.data:
            print(f"  Warning: Center '{center_name}' not found in DB. Skipping.")
            continue
        center_id = c_res.data[0]['id']
        
        # Filter rows for this center
        center_df = df[df['CENTRES'] == center_name]
        
        # Process each Year
        for year, col_name in year_map.items():
            if col_name not in df.columns: continue
            
            # Sum metric
            total = pd.to_numeric(center_df[col_name], errors='coerce').sum()
            
            if total > 0:
                print(f"  Year {year}: {int(total)}")
                
                # Create/Get Report
                period_id = period_ids[year]
                rep_res = supabase.table('reports').select('id').eq('center_id', center_id).eq('period_id', period_id).execute()
                if rep_res.data:
                    report_id = rep_res.data[0]['id']
                else:
                    rep_res = supabase.table('reports').insert({
                        "center_id": center_id,
                        "period_id": period_id,
                        "status": "submitted"
                    }).execute()
                    report_id = rep_res.data[0]['id']
                
                # Insert/Update Stats
                # Check existing
                stats_res = supabase.table('stats_people').select('report_id').eq('report_id', report_id).execute()
                if not stats_res.data:
                    supabase.table('stats_people').insert({
                        "report_id": report_id,
                        "attendance_total": int(total)
                    }).execute()
                else:
                    # Optional: Update if exists?
                    # supabase.table('stats_people').update({"attendance_total": int(total)}).eq('report_id', report_id).execute()
                    pass

if __name__ == "__main__":
    import_wouri()
