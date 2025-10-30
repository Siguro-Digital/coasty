#!/usr/bin/env python3
"""
Script to generate PDF files from JSON subforms.
PDFs are formatted as explicit instructions for AI to create forms.
Each field is presented as a clear step with field type and content.
"""

import json
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# Configuration
SUBFORMS_DIR = 'subforms'
OUTPUT_DIR = 'subforms_pdf_ai'
TEST_MODE = False  # Set to False to generate all PDFs
TEST_SUBFORM = '4.6-EX. PANEL 432-Quarterly'  # Change this to test different subforms

def get_folder_name(filename):
    """Determine which folder a file should go in based on its prefix"""
    # Remove .json extension
    name = filename.replace('.json', '')
    
    # Files starting with hyphen go in folder "-"
    if name.startswith('-'):
        return '-'
    
    # Files starting with a number like "2.x" go in folder "2"
    if name[0].isdigit():
        # Get the first digit/number before the dot or hyphen
        prefix = name.split('.')[0].split('-')[0]
        return prefix
    
    # Anything else goes in folder "other"
    return 'other'

def main():
    # Create output directory if it doesn't exist
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"Created directory: {OUTPUT_DIR}")
    
    # Get list of JSON files
    json_files = [f for f in os.listdir(SUBFORMS_DIR) if f.endswith('.json')]
    
    if TEST_MODE:
        # Only process the test subform
        test_file = f"{TEST_SUBFORM}.json"
        if test_file in json_files:
            folder = get_folder_name(test_file)
            process_subform(test_file, folder)
            print(f"\nTest mode: Created 1 PDF ({TEST_SUBFORM}) in folder {folder}")
        else:
            print(f"\nTest mode: Subform '{TEST_SUBFORM}' not found")
    else:
        # Process all subforms and organize by folder
        folder_counts = {}
        count = 0
        
        for json_file in json_files:
            folder = get_folder_name(json_file)
            process_subform(json_file, folder)
            folder_counts[folder] = folder_counts.get(folder, 0) + 1
            count += 1
        
        print(f"\nCreated {count} PDFs organized into folders:")
        for folder in sorted(folder_counts.keys()):
            print(f"  Folder '{folder}': {folder_counts[folder]} PDFs")

def process_subform(json_filename, folder='1'):
    """Process a single JSON subform and create a PDF"""
    json_path = os.path.join(SUBFORMS_DIR, json_filename)
    pdf_filename = json_filename.replace('.json', '.pdf')
    
    # Create folder-specific directory
    folder_path = os.path.join(OUTPUT_DIR, folder)
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    
    pdf_path = os.path.join(folder_path, pdf_filename)
    
    # Read JSON data
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Page width - 50% of letter width
    page_width = 4.25*inch
    page_height = 11*inch  # Start with letter height, will be auto-sized by content
    
    # Create PDF with minimal margins and custom page size
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=(page_width, page_height),
        rightMargin=0.15*inch,
        leftMargin=0.15*inch,
        topMargin=0.15*inch,
        bottomMargin=0.15*inch
    )
    
    # Container for PDF elements
    story = []
    
    # Define styles with smaller fonts
    styles = getSampleStyleSheet()
    
    # Custom title style - WHITE text on black background
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=11,
        textColor=colors.white,  # WHITE text
        spaceAfter=0,
        spaceBefore=0,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=13
    )
    
    # Custom body style - compact
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=8,
        textColor=colors.black,
        spaceAfter=6,
        spaceBefore=0,
        alignment=TA_LEFT,
        leading=10
    )
    
    # Custom instruction style - bold, larger for step headers
    instruction_style = ParagraphStyle(
        'InstructionStyle',
        parent=styles['BodyText'],
        fontSize=9,
        textColor=colors.black,
        spaceAfter=4,
        spaceBefore=8,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        leading=11
    )
    
    # Custom content style - for field content
    content_style = ParagraphStyle(
        'ContentStyle',
        parent=styles['BodyText'],
        fontSize=8,
        textColor=colors.black,
        spaceAfter=3,
        spaceBefore=0,
        alignment=TA_LEFT,
        leading=10
    )
    
    # Calculate content width
    content_width = page_width - 0.3*inch
    
    # Add title box
    title_data = [[Paragraph(f"<b>INSTRUCTIONS FOR CREATING SUBFORM: {data['name']}</b>", title_style)]]
    title_table = Table(title_data, colWidths=[content_width])
    title_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.black),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (-1, -1), 2, colors.black),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(title_table)
    story.append(Spacer(1, 0.12*inch))
    
    # Add instructions header
    story.append(Paragraph("Follow these steps to create the form fields:", instruction_style))
    story.append(Spacer(1, 0.08*inch))
    
    # Track step number
    step_number = 0
    
    # Get all task assignments from fields
    task_assignments = [field.get('jb_task_assignment', '').strip() for field in data['fields']]
    task_assignments_set = set([t for t in task_assignments if t])  # Get unique non-empty task assignments
    has_single_task_assignment = len(task_assignments_set) == 1
    has_different_task_assignments = len(task_assignments_set) > 1
    
    # If there's only ONE unique task assignment value, add it ONCE at the top as Step 1
    if has_single_task_assignment:
        single_task_assignment = list(task_assignments_set)[0]
        step_number += 1
        instruction_text = f"<b>STEP {step_number}: Create an Info Text field</b>"
        story.append(Paragraph(instruction_text, instruction_style))
        
        content_text = f"<b>Content:</b> {single_task_assignment}"
        story.append(Paragraph(content_text, content_style))
        
        story.append(Spacer(1, 0.1*inch))
    
    previous_task_assignment = None
    
    for idx, field in enumerate(data['fields'], 1):
        task_assignment = field.get('jb_task_assignment', '').strip()
        
        # Add task assignment header field ONLY if:
        # 1. Task assignments differ across fields in this subform, AND
        # 2. Task assignment is different from previous field (or this is the first field with a task assignment)
        should_add_header = False
        if has_different_task_assignments:
            if idx == 1 and task_assignment:
                # First field - add header if it has a task assignment and task assignments differ
                should_add_header = True
            elif task_assignment and task_assignment != previous_task_assignment:
                # Task assignment changed - add header
                should_add_header = True
        
        if should_add_header:
            step_number += 1
            # Create instruction for Info Text field
            instruction_text = f"<b>STEP {step_number}: Create an Info Text field</b>"
            story.append(Paragraph(instruction_text, instruction_style))
            
            content_text = f"<b>Content:</b> {task_assignment}"
            story.append(Paragraph(content_text, content_style))
            
            story.append(Spacer(1, 0.1*inch))
        
        # Update previous task assignment for next iteration
        previous_task_assignment = task_assignment
        
        # Create instruction for the main field
        step_number += 1
        
        # Determine field type
        field_type = field.get('type', 'Text')
        if 'options' in field and field['options']:
            field_type = 'Single Select'
        
        # Build instruction
        instruction_text = f"<b>STEP {step_number}: Create a {field_type} field</b>"
        story.append(Paragraph(instruction_text, instruction_style))
        
        # Add field properties
        properties = []
        
        # Task Assignment (only add if there are multiple different values - single value already added at top)
        if has_different_task_assignments and task_assignment:
            properties.append(f"<b>Task Assignment:</b> {task_assignment}")
        
        # Description (with inspection task prefix if available)
        description = field.get('description', '')
        inspection_task = field.get('inspection_task', '')
        if inspection_task and description:
            description = f"{inspection_task}: {description}"
        elif inspection_task:
            description = inspection_task
        
        if description:
            properties.append(f"<b>Description:</b> {description}")
        
        # Options (if Single Select)
        if 'options' in field and field['options']:
            options_str = ', '.join(field['options'])
            properties.append(f"<b>Options:</b> {options_str}")
        
        # Add all properties
        for prop in properties:
            story.append(Paragraph(prop, content_style))
        
        story.append(Spacer(1, 0.12*inch))  # Spacing between steps
    
    # Build PDF
    doc.build(story)
    print(f"Created: {pdf_path}")

if __name__ == '__main__':
    main()

