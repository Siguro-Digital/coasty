#!/usr/bin/env python3
"""
Script to generate JSON subform files from checklists.csv
Each subform is named by the NAMING CONVENTION column
and contains all fields (rows) that share that naming convention.
"""

import csv
import json
import os
from collections import defaultdict

# Configuration
CSV_FILE = 'checklist.csv'
OUTPUT_DIR = 'subforms'
TEST_MODE = False  # Set to False to generate all subforms

def main():
    # Create output directory if it doesn't exist
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")
    
    # Read CSV and group by NAMING CONVENTION
    subforms = defaultdict(list)
    
    with open(CSV_FILE, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            naming_convention = row.get('NAMING CONVENTION', '').strip()
            
            # Skip empty naming conventions
            if not naming_convention:
                continue
            
            # Fix naming conventions that start with a hyphen
            # Extract section number from Inspection Task field
            if naming_convention.startswith('-'):
                inspection_task = row.get('Inspection Task', '').strip()
                if inspection_task:
                    # Extract section number (e.g., "2.16" from "2.16-SA-ACCU-3")
                    parts = inspection_task.split('-')
                    if parts and parts[0]:
                        section_number = parts[0]
                        # Prepend section number to naming convention
                        naming_convention = section_number + naming_convention
            
            # Create field object from row
            measurement_type = row.get('Measurement Type', '').strip()
            response_type = row.get('Response Type', '').strip()
            
            # Clean up description - replace newlines with spaces
            description = row.get('Description', '').strip()
            description = ' '.join(description.split())  # Replace all whitespace (including \n) with single spaces
            
            field = {
                'inspection_task': row.get('Inspection Task', '').strip(),
                'frequency': row.get('Frequency', '').strip(),
                'jb_contractor_assignment': row.get('JB Contractor Assignment', '').strip(),
                'description': description
            }
            
            # Add type field if measurement_type is YesNo
            if measurement_type == 'YesNo':
                field['type'] = 'Single Select'
            
            # Add options array if it's a Specific List with YesNo
            if response_type == 'Specific List' and measurement_type == 'YesNo':
                field['options'] = ['Yes', 'No']
            
            subforms[naming_convention].append(field)
    
    print(f"Found {len(subforms)} unique subforms")
    
    # Generate JSON files
    if TEST_MODE:
        # Only create a specific subform for testing
        test_subform = '2.8-AC-Annual'  # Change this to test different subforms
        if test_subform in subforms:
            create_subform_json(test_subform, subforms[test_subform])
            print(f"\nTest mode: Created 1 subform ({test_subform})")
        else:
            print(f"\nTest mode: Subform '{test_subform}' not found")
    else:
        # Create all subforms
        for naming_convention, fields in subforms.items():
            create_subform_json(naming_convention, fields)
        print(f"\nCreated {len(subforms)} subforms")

def create_subform_json(naming_convention, fields):
    """Create a JSON file for a single subform"""
    # Sanitize filename (replace invalid characters)
    safe_filename = naming_convention.replace('/', '-').replace('\\', '-')
    filepath = os.path.join(OUTPUT_DIR, f"{safe_filename}.json")
    
    # Create subform object
    subform = {
        'name': naming_convention,
        'field_count': len(fields),
        'fields': fields
    }
    
    # Write JSON file
    with open(filepath, 'w', encoding='utf-8') as jsonfile:
        json.dump(subform, jsonfile, indent=2, ensure_ascii=False)
    
    print(f"Created: {filepath} ({len(fields)} fields)")

if __name__ == '__main__':
    main()

