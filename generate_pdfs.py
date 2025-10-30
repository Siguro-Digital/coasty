#!/usr/bin/env python3
"""
Script to generate PDF files from JSON subforms.
PDFs are optimized for AI to read and digest with clear structure.
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
OUTPUT_DIR = 'subforms_pdf'
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
        fontSize=7,
        textColor=colors.black,
        spaceAfter=0,
        spaceBefore=0,
        alignment=TA_LEFT,
        leading=9
    )
    
    # Custom header style - WHITE text for field headers
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['BodyText'],
        fontSize=7,
        textColor=colors.white,  # WHITE text
        spaceAfter=0,
        spaceBefore=0,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        leading=9
    )
    
    # Custom info text style for contractor headers
    info_style = ParagraphStyle(
        'InfoStyle',
        parent=styles['BodyText'],
        fontSize=7,
        textColor=colors.black,
        spaceAfter=0,
        spaceBefore=0,
        alignment=TA_LEFT,
        fontName='Helvetica',
        leading=9
    )
    
    # Calculate content width
    content_width = page_width - 0.3*inch
    
    # Add title box
    title_data = [[Paragraph(f"<b>SUBFORM: {data['name']}</b>", title_style)]]
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
    story.append(Spacer(1, 0.08*inch))
    
    # Add fields as table rows with two-column layout
    # First, check if contractors differ across fields
    contractors = [field.get('jb_contractor_assignment', '').strip() for field in data['fields']]
    contractors_set = set([c for c in contractors if c])  # Get unique non-empty contractors
    has_different_contractors = len(contractors_set) > 1
    
    previous_contractor = None
    
    for idx, field in enumerate(data['fields'], 1):
        contractor = field.get('jb_contractor_assignment', '').strip()
        
        # Add contractor header field ONLY if:
        # 1. Contractors differ across fields in this subform, AND
        # 2. Contractor is different from previous field (or this is the first field with a contractor)
        should_add_header = False
        if has_different_contractors:
            if idx == 1 and contractor:
                # First field - add header if it has a contractor and contractors differ
                should_add_header = True
            elif contractor and contractor != previous_contractor:
                # Contractor changed - add header
                should_add_header = True
        
        if should_add_header:
            # Create contractor info field - styled like a normal field (two-column layout)
            label_width = content_width * 0.30
            value_width = content_width * 0.70
            
            contractor_field_data = [
                [
                    Paragraph(f"<b>Contractor:</b>", body_style),
                    Paragraph(contractor, body_style)
                ],
                [
                    Paragraph(f"<b>Type:</b>", body_style),
                    Paragraph("Info Text", body_style)
                ]
            ]
            
            contractor_table = Table(contractor_field_data, colWidths=[label_width, value_width])
            contractor_table.setStyle(TableStyle([
                # All rows styling - same as normal fields
                ('BACKGROUND', (0, 0), (-1, -1), colors.white),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                # Grid and borders - same as normal fields
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BOX', (0, 0), (-1, -1), 2, colors.black),
                # Alignment - labels on left, values on left
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                # Padding - same as normal fields
                ('LEFTPADDING', (0, 0), (-1, -1), 3),
                ('RIGHTPADDING', (0, 0), (-1, -1), 3),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                # Vertical line between columns (more prominent)
                ('LINEAFTER', (0, 0), (0, -1), 2, colors.black),
            ]))
            
            story.append(contractor_table)
            story.append(Spacer(1, 0.12*inch))  # Same spacing as between normal fields
        
        # Update previous contractor for next iteration
        previous_contractor = contractor
        
        # Create field data as a boxed table with 2 columns
        field_data = []
        
        # Field details - Label on left (30%), Value on right (70%)
        # Keep Contractor in the main field box
        field_data.append([
            Paragraph(f"<b>Contractor:</b>", body_style),
            Paragraph(contractor if contractor else '', body_style)
        ])
        field_data.append([
            Paragraph(f"<b>Description:</b>", body_style),
            Paragraph(field['description'], body_style)
        ])
        
        if 'type' in field:
            field_data.append([
                Paragraph(f"<b>Type:</b>", body_style),
                Paragraph(field['type'], body_style)
            ])
        
        if 'options' in field:
            options_str = ', '.join(field['options'])
            field_data.append([
                Paragraph(f"<b>Options:</b>", body_style),
                Paragraph(options_str, body_style)
            ])
        
        # Create table for this field with two columns (30% / 70% split)
        label_width = content_width * 0.30
        value_width = content_width * 0.70
        field_table = Table(field_data, colWidths=[label_width, value_width])
        field_table.setStyle(TableStyle([
            # All rows styling
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            # Grid and borders
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BOX', (0, 0), (-1, -1), 2, colors.black),
            # Alignment - labels on left, values on left
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            # Padding
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            # Vertical line between columns (more prominent)
            ('LINEAFTER', (0, 0), (0, -1), 2, colors.black),
        ]))
        
        story.append(field_table)
        story.append(Spacer(1, 0.12*inch))  # Increased spacing between fields
    
    # Build PDF
    doc.build(story)
    print(f"Created: {pdf_path}")

if __name__ == '__main__':
    main()

