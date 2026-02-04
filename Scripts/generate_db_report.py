
import os
import json
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Supabase URL or Key not found.")
    exit(1)

supabase: Client = create_client(url, key)

TABLES = [
    'zones', 'centers', 'house_churches', 'profiles', 'members',
    'reporting_periods', 'reports', 
    'stats_financial', 'stats_people', 'stats_family', 'stats_activities',
    'audit_logs'
]

def get_table_stats(table_name):
    try:
        # Get count
        count_res = supabase.table(table_name).select('*', count='exact', head=True).execute()
        count = count_res.count
        
        # Get sample
        sample_res = supabase.table(table_name).select('*').limit(5).execute()
        sample = sample_res.data
        
        return {
            "name": table_name,
            "count": count,
            "seeded": count > 0,
            "sample": sample
        }
    except Exception as e:
        return {
            "name": table_name,
            "error": str(e),
            "seeded": False,
            "count": 0,
            "sample": []
        }

def generate_html(stats):
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IFA Database Status Report</title>
        <style>
            :root {{ --primary: #00695c; --secondary: #4db6ac; --light: #e0f2f1; --dark: #004d40; --danger: #d32f2f; }}
            body {{ font-family: 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }}
            h1 {{ color: var(--primary); border-bottom: 2px solid var(--secondary); padding-bottom: 10px; }}
            .dashboard {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }}
            .card {{ background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-left: 5px solid var(--secondary); }}
            .card.empty {{ border-left-color: var(--danger); }}
            .card h3 {{ margin-top: 0; color: var(--dark); }}
            .stat {{ font-size: 2em; font-weight: bold; }}
            .badge {{ padding: 5px 10px; border-radius: 15px; font-size: 0.8em; color: white; float: right; }}
            .badge-ok {{ background: var(--primary); }}
            .badge-empty {{ background: var(--danger); }}
            
            table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em; }}
            th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
            th {{ background-color: var(--light); color: var(--dark); }}
            tr:hover {{ background-color: #f9f9f9; }}
            
            .section-title {{ margin-top: 40px; color: var(--dark); }}
            .timestamp {{ color: #666; font-style: italic; margin-bottom: 20px; }}
        </style>
    </head>
    <body>
        <h1>IFA Database Status Report</h1>
        <div class="timestamp">Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</div>
        
        <h2 class="section-title">Overview</h2>
        <div class="dashboard">
    """
    
    # Overview Cards
    for stat in stats:
        status_class = "ok" if stat['seeded'] else "empty"
        card_class = "" if stat['seeded'] else "empty"
        html += f"""
        <div class="card {card_class}">
            <span class="badge badge-{status_class}">{ "SEEDED" if stat['seeded'] else "EMPTY" }</span>
            <h3>{stat['name']}</h3>
            <div class="stat">{stat['count']}</div>
            <p>Records</p>
        </div>
        """
    
    html += """</div><h2 class="section-title">Detailed Data Inspection</h2>"""
    
    # Detailed Tables
    for stat in stats:
        if not stat['seeded']: continue
        
        html += f"""
        <div class="card" style="margin-bottom: 20px; border-left: none;">
            <h3>{stat['name']} <small>(Top 5 Records)</small></h3>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
        """
        
        # Table Headers
        if stat['sample']:
            headers = stat['sample'][0].keys()
            for h in headers:
                html += f"<th>{h}</th>"
        
        html += """</tr></thead><tbody>"""
        
        # Table Rows
        for row in stat['sample']:
            html += "<tr>"
            for val in row.values():
                val_str = str(val)
                if len(val_str) > 50: val_str = val_str[:50] + "..."
                html += f"<td>{val_str}</td>"
            html += "</tr>"
            
        html += """</tbody></table></div></div>"""

    html += """
    </body>
    </html>
    """
    return html

def main():
    print("Fetching database stats...")
    all_stats = []
    for table in TABLES:
        print(f"  Scanning {table}...")
        all_stats.append(get_table_stats(table))
        
    print("Generating report...")
    report_html = generate_html(all_stats)
    
    # Define output path: TechDocs&Progress/Reports/DB_Status_Report.html
    base_dir = os.path.dirname(os.path.dirname(__file__))
    target_dir = os.path.join(base_dir, "TechDocs&Progress", "Reports")
    
    # Ensure directory exists
    os.makedirs(target_dir, exist_ok=True)
    
    output_path = os.path.join(target_dir, "DB_Status_Report.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report_html)
        
    print(f"Report saved to: {output_path}")

if __name__ == "__main__":
    main()
