import json
import re
import os
from datetime import datetime

# Paths
DB_JSON_PATH = r"c:\Users\KDave237\Projects\IFA-Dashboard\db.json"
SCHEMA_SQL_PATH = r"c:\Users\KDave237\Projects\IFA-Dashboard\Migrations\schema.sql"
REPORT_OUTPUT_DIR = r"c:\Users\KDave237\Projects\IFA-Dashboard\TechDocs&Progress\Reports"
REPORT_OUTPUT_PATH = os.path.join(REPORT_OUTPUT_DIR, "Schema_Compatibility_Report.html")

def camel_to_snake(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def load_json_schema(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    schema = {}
    for table, rows in data.items():
        if isinstance(rows, list) and len(rows) > 0:
            # Analyze the first few rows to get all possible keys and infer types
            keys = {}
            for row in rows[:5]:
                for k, v in row.items():
                    val_type = "string"
                    if isinstance(v, bool):
                        val_type = "boolean"
                    elif isinstance(v, int):
                        val_type = "integer"
                    elif isinstance(v, float):
                        val_type = "float"
                    elif v is None:
                        val_type = "nullable"
                    
                    # specific check for UUID-like or ID-like strings
                    if val_type == "string" and re.match(r'^[a-z]+-\d+$', str(v)):
                         val_type = "string (custom-id)"
                    
                    keys[k] = val_type
            schema[table] = keys
    return schema

def parse_sql_schema(path):
    with open(path, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    schema = {}
    
    # Regex to find CREATE TABLE statements
    # Matches: CREATE TABLE public.tablename ( content )
    table_matches = re.finditer(r'CREATE TABLE public\.(\w+)\s*\((.*?)\);', sql, re.DOTALL)
    
    for match in table_matches:
        table_name = match.group(1)
        content = match.group(2)
        
        columns = {}
        # Parse lines
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if not line or line.startswith('--') or line.startswith('CONSTRAINT') or line.startswith('PRIMARY KEY') or line.startswith('FOREIGN KEY'):
                continue
            
            # Simple column extraction: name type ...
            # e.g. "id uuid PRIMARY KEY DEFAULT gen_random_uuid(),"
            parts = line.split()
            if len(parts) >= 2:
                col_name = parts[0].replace('"', '') # remove quotes if any
                col_type = parts[1].replace(',', '')
                columns[col_name] = col_type
                
        schema[table_name] = columns
        
    return schema

def generate_report(json_schema, sql_schema):
    # Mapping JSON tables to SQL tables
    table_mapping = {
        "users": "profiles",
        "zones": "zones",
        "centers": "centers",
        "houseChurches": "house_churches",
        "reports": "reports",
        "reportingPeriods": "reporting_periods",
        # Heuristic for other stats tables if present in json
    }
    
    # Reverse mapping for stats if they exist in json as camelCase
    # Assuming statsFamily -> stats_family
    for json_table in json_schema.keys():
        if json_table not in table_mapping:
            snake_table = camel_to_snake(json_table)
            if snake_table in sql_schema:
                table_mapping[json_table] = snake_table

    # Field Mappings (Manual Overrides)
    field_mapping = {
        "members": {
            "joinedDate": "joined_ifa_year"
        }
    }

    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Data Schema Compatibility Analysis</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
            h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
            h2 { color: #2980b9; margin-top: 30px; }
            h3 { color: #16a085; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 3px rgba(0,0,0,0.1); }
            th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: 600; color: #555; }
            tr:hover { background-color: #f5f5f5; }
            .status-ok { color: #27ae60; font-weight: bold; }
            .status-warning { color: #f39c12; font-weight: bold; }
            .status-error { color: #c0392b; font-weight: bold; }
            .badge { display: inline-block; padding: 3px 7px; border-radius: 4px; font-size: 0.8em; color: white; }
            .bg-green { background-color: #27ae60; }
            .bg-red { background-color: #c0392b; }
            .bg-orange { background-color: #f39c12; }
            .summary-box { background-color: #e8f6f3; padding: 15px; border-radius: 5px; border-left: 5px solid #1abc9c; margin-bottom: 20px; }
            .recommendation { background-color: #fef9e7; padding: 10px; border-left: 4px solid #f1c40f; margin: 10px 0; }
            .checklist { list-style-type: none; padding: 0; }
            .checklist li { margin-bottom: 10px; padding-left: 25px; position: relative; }
            .checklist li:before { content: '☐'; position: absolute; left: 0; color: #7f8c8d; }
        </style>
    </head>
    <body>
        <h1>Comprehensive Data Schema Compatibility Analysis</h1>
        <p><strong>Date:</strong> """ + datetime.now().strftime("%Y-%m-%d") + """</p>
        <p><strong>Source 1 (Frontend Mock):</strong> db.json</p>
        <p><strong>Source 2 (Backend API):</strong> schema.sql (Supabase)</p>

        <div class="summary-box">
            <h2>Executive Summary</h2>
            <p>This report analyzes the compatibility between the frontend mock data structures and the backend database schema. 
            The analysis identifies critical discrepancies in naming conventions (CamelCase vs SnakeCase), data types (String IDs vs UUIDs), 
            and missing fields that require immediate attention before integration.</p>
        </div>

        <h2>1. Entity Gap Analysis</h2>
        <table>
            <thead>
                <tr>
                    <th>Frontend Entity (Mock)</th>
                    <th>Backend Table (SQL)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    """
    
    overall_issues = []
    
    for json_table, json_cols in json_schema.items():
        sql_table = table_mapping.get(json_table, "MISSING")
        status_class = "status-ok"
        status_text = "Matched"
        
        if sql_table == "MISSING":
            status_class = "status-error"
            status_text = "Missing in Backend"
            overall_issues.append(f"Entity '{json_table}' exists in frontend but not found in backend schema.")
        elif sql_table not in sql_schema:
             # mapped but not found in sql parsing (maybe name mismatch or actually missing)
            status_class = "status-error"
            status_text = f"Table '{sql_table}' not found in SQL"
            overall_issues.append(f"Mapped table '{sql_table}' for '{json_table}' not found in SQL schema.")
        
        html += f"""
                <tr>
                    <td>{json_table}</td>
                    <td>{sql_table}</td>
                    <td class="{status_class}">{status_text}</td>
                </tr>
        """
    html += """
            </tbody>
        </table>
    """

    # Detailed Field Analysis
    html += "<h2>2. Detailed Field & Type Compatibility</h2>"
    
    for json_table, json_cols in json_schema.items():
        sql_table_name = table_mapping.get(json_table)
        if not sql_table_name or sql_table_name not in sql_schema:
            continue
            
        sql_cols = sql_schema[sql_table_name]
        
        html += f"<h3>Entity: {json_table} ↔ Table: {sql_table_name}</h3>"
        html += """
        <table>
            <thead>
                <tr>
                    <th>Frontend Field</th>
                    <th>Backend Column</th>
                    <th>Type Check</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
        """
        
        for json_col, json_type in json_cols.items():
            # Try direct match
            sql_col = json_col
            match_type = "Direct"
            
            # Check manual mapping first
            if json_table in field_mapping and json_col in field_mapping[json_table]:
                sql_col = field_mapping[json_table][json_col]
                match_type = "Mapped"
            elif sql_col not in sql_cols:
                # Try snake_case
                sql_col = camel_to_snake(json_col)
                match_type = "SnakeCase"
            
            if sql_col in sql_cols:
                sql_type = sql_cols[sql_col]
                status = "OK"
                css = "status-ok"
                note = ""
                
                # Type Comparison Heuristics
                if "id" in json_col.lower() and "uuid" in sql_type:
                    if "string" in json_type:
                        note = "Frontend uses string IDs (e.g. 'user-01'), Backend expects UUID"
                        status = "Type Mismatch"
                        css = "status-warning"
                elif "date" in json_col.lower() or "at" in json_col.lower()[-2:]:
                    if "timestamp" not in sql_type and "date" not in sql_type:
                         # Special check for Year fields
                         if "year" in sql_col and ("int" in sql_type or "integer" in sql_type):
                             note = f"Frontend Date ({json_type}) maps to Backend Year ({sql_type})"
                             status = "Logic Mismatch"
                             css = "status-warning"
                         else:
                             note = f"Frontend date string vs Backend {sql_type}"
                             status = "Check"
                             css = "status-warning"
                
                html += f"""
                <tr>
                    <td>{json_col} <span class="badge bg-green">{json_type}</span></td>
                    <td>{sql_col} <span class="badge bg-green">{sql_type}</span></td>
                    <td>{note if note else "Compatible"} <span class="badge bg-orange" style="display: {'inline-block' if match_type == 'Mapped' else 'none'}">Mapped</span></td>
                    <td class="{css}">{status}</td>
                </tr>
                """
            else:
                html += f"""
                <tr>
                    <td>{json_col}</td>
                    <td><span class="badge bg-red">MISSING</span></td>
                    <td>Field missing in backend</td>
                    <td class="status-error">Missing</td>
                </tr>
                """
        
        # Check for backend columns missing in frontend (extra data is fine usually, but good to know)
        # (Optional, skipping for brevity of report focus on gaps)
        
        html += "</tbody></table>"

    html += """
    <h2>3. Critical Findings & Recommendations</h2>
    <div class="recommendation">
        <h3>Naming Convention Strategy</h3>
        <p>The frontend uses <strong>camelCase</strong> (e.g., <code>fullName</code>) while the backend uses <strong>snake_case</strong> (e.g., <code>full_name</code>).
        <strong>Recommendation:</strong> Configure the Supabase JS client to automatically convert cases, or update frontend interfaces to match backend. 
        Supabase client usually handles snake_case responses.</p>
    </div>
    
    <div class="recommendation">
        <h3>ID Format Migration</h3>
        <p>Frontend uses custom string IDs (e.g., <code>"user-001"</code>) while backend enforces <strong>UUIDs</strong>.
        <strong>Action Required:</strong> The import scripts must generate valid UUIDs or the backend schema must be temporarily relaxed (not recommended). 
        Update frontend mock data to use UUIDs to match production behavior.</p>
    </div>
    
    <div class="recommendation">
        <h3>Missing Fields</h3>
        <p>Several fields exist in the frontend but are missing in the backend:</p>
        <ul>
            <li><strong>users.avatar:</strong> Needs to be added to <code>profiles</code> table or handled via Supabase Storage.</li>
            <li><strong>centers.latitude/longitude:</strong> Critical for mapping features. Add to <code>centers</code> table.</li>
        </ul>
    </div>

    <h2>4. Migration Checklist</h2>
    <ul class="checklist">
        <li>[Frontend] Update TypeScript interfaces to allow snake_case properties OR configure Supabase client response modifiers.</li>
        <li>[Frontend] Replace mock IDs (user-001) with valid UUIDs in local state/mock data.</li>
        <li>[Backend] Add missing columns: <code>avatar</code> to profiles, <code>latitude/longitude</code> to centers.</li>
        <li>[Backend] Verify <code>stats_*</code> table mapping logic matches frontend expectations.</li>
    </ul>
    
    </body>
    </html>
    """
    
    with open(REPORT_OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"Report generated at: {REPORT_OUTPUT_PATH}")

if __name__ == "__main__":
    print("Loading schemas...")
    json_schema = load_json_schema(DB_JSON_PATH)
    sql_schema = parse_sql_schema(SCHEMA_SQL_PATH)
    
    print("Generating report...")
    generate_report(json_schema, sql_schema)
    print("Done.")
