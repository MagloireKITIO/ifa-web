
import pandas as pd
import os

def create_template():
    # 1. Members Sheet
    members_cols = [
        "Full Name", "Phone", "Birth Year", "Conversion Year", 
        "Joined IFA Year", "Is Baptized (Yes/No)", "Marriage Date (YYYY-MM-DD)",
        "House Church Name", "Status (Active/Visitor/Child)", "Notes"
    ]
    df_members = pd.DataFrame(columns=members_cols)
    
    # 2. Monthly Report Sheet
    # Vertical layout might be better for filling out a form? 
    # Or flat wide row? Let's do flat wide row for easy import.
    report_cols = [
        "Month (Jan 2026)", "Center Name", "House Church Name (Optional)",
        # Finance
        "Tithes", "Offerings (General)", "Offerings (Events)", "Mission Expense", "Rent Expense",
        # People
        "Attendance Men", "Attendance Women", "Attendance Children",
        "New Converts", "First Timers", "Baptisms",
        # Family
        "Marriages", "Engagements", "Births",
        # Activities
        "People Trained", "Social Actions", "Home Visits"
    ]
    df_report = pd.DataFrame(columns=report_cols)
    
    # 3. Instructions
    instructions = [
        {"Topic": "General", "Details": "Do not rename columns. Fill in data starting from Row 2."},
        {"Topic": "Members", "Details": "Use this sheet to add new members or update existing ones. 'House Church Name' must match exactly."},
        {"Topic": "Monthly Report", "Details": "One row per month per Center (or per House Church). Leave House Church blank if reporting for the whole Center."},
        {"Topic": "Dates", "Details": "Use YYYY-MM-DD format for dates (e.g., 2026-01-31)."},
        {"Topic": "Boolean", "Details": "For Yes/No fields, type 'Yes' or 'No'."}
    ]
    df_instructions = pd.DataFrame(instructions)
    
    # Write to Excel
    output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "IFA_Data_Submission_Template.xlsx")
    
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        df_instructions.to_excel(writer, sheet_name='Instructions', index=False)
        df_members.to_excel(writer, sheet_name='Members_Data', index=False)
        df_report.to_excel(writer, sheet_name='Monthly_Report_Data', index=False)
        
        # Adjust column widths (Basic)
        for sheet in writer.sheets.values():
            for col in sheet.columns:
                max_length = 0
                column = col[0].column_letter # Get the column name
                for cell in col:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = (max_length + 2) * 1.2
                sheet.column_dimensions[column].width = adjusted_width

    print(f"Template created at: {output_path}")

if __name__ == "__main__":
    create_template()
