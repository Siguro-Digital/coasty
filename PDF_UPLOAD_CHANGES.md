# PDF Upload Automation Changes

## Summary
Updated the Playwright automation script to upload PDFs instead of creating blank subforms.

## What Changed

### File Modified
- `playwright/create-subform-live.js`

### Key Changes

1. **Replaced "Blank Sub Form" with "Upload a PDF"**
   - Step 4 now clicks the "Upload a PDF" option instead of "Blank Sub Form"
   - Uses multiple selector strategies to find the upload button

2. **Form Name Input**
   - Step 5 replaces the "New Sub Form" input with the PDF filename (without .pdf extension)
   - Example: `-ACCU-Semi-Annual.pdf` → `-ACCU-Semi-Annual`

3. **PDF File Upload**
   - Step 6 clicks the second "Upload a PDF" button (inside the form)
   - Intercepts the file chooser dialog
   - Uploads the specified PDF file from `subforms_pdf/` directory

4. **New Batch Processing**
   - Added `batchProcessPDFs()` function
   - Reads all PDFs from the `subforms_pdf/` directory
   - Processes them one by one with 2-second delays

5. **Updated Menu Commands**
   ```
   c - Upload single test PDF (-ACCU-Semi-Annual.pdf)
   p - Batch upload PDFs (first 5)
   P - Batch upload ALL PDFs (1000+!)
   r - Reload Coast app page
   q - Quit
   ```

## How to Use

### Single Test Upload
1. Run the script: `node playwright/create-subform-live.js`
2. Log in if needed (one-time only)
3. Press `c` to upload the test PDF: `-ACCU-Semi-Annual.pdf`

### Batch Upload (Test 5 PDFs)
1. Press `p` to upload first 5 PDFs
2. Watch it process each one

### Batch Upload (ALL PDFs)
1. Press `P` (capital P)
2. Confirm with Enter
3. Will process all 1000+ PDFs from `subforms_pdf/` directory

## Technical Details

### Workflow Steps
1. Navigate to "Work Orders & PMs" channel
2. Click "Sub Forms" option
3. Click "New" button
4. Click "Upload a PDF" (first button in modal)
5. Replace form name input with PDF filename
6. Click "Upload a PDF" (second button - opens file picker)
7. Upload the PDF file
8. Click submit/create button

### File Structure
```
subforms_pdf/
  -ACCU-Semi-Annual.pdf        ← Test file
  -ACR-Semi-Annual.pdf
  -ACU-Semi-Annual.pdf
  ... (1000+ more PDFs)
```

### Error Handling
- Multiple selector fallbacks for each step
- Screenshots saved on errors
- Debug screenshots at key points
- Graceful failures with error messages

## Future Enhancements
- Currently hardcoded to test with `-ACCU-Semi-Annual.pdf`
- Can easily extend to process entire directory (use `p` or `P` command)
- 2-second delay between uploads (adjustable)

