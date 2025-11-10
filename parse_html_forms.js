import { readFileSync, writeFileSync } from 'fs';
import { chromium } from 'playwright';

/**
 * Parse HTML file containing form list from Coast site into JSON
 * Uses Playwright's HTML parsing capabilities
 */

async function parseHTMLForms(htmlFilePath, outputJsonPath) {
  console.log(`Reading HTML file: ${htmlFilePath}`);
  const htmlContent = readFileSync(htmlFilePath, 'utf8');
  
  // Launch browser to parse HTML
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  
  const forms = [];
  
  // Pattern 1: Extract form names from divs with specific classes (form name divs)
  // These divs have classes: css-901oao r-1q9qjxj r-1q02xf1 r-ubezar r-13uqrnb r-1kfrs79 r-afbznj r-rjixqe r-5lyqn3
  // They contain the form name and are NOT the "X fields" divs
  const formNameDivs = await page.$$eval('div.css-901oao.r-1q9qjxj.r-1q02xf1.r-ubezar.r-13uqrnb.r-1kfrs79.r-afbznj.r-rjixqe.r-5lyqn3[dir="auto"]', divs =>
    divs.map(div => {
      const text = div.textContent?.trim() || '';
      // Only take divs that look like form names (not field counts or other metadata)
      if (text && text.length > 3 && (
        text.match(/^[\d\.-]+[-A-Z]/) || 
        text.match(/^-[A-Z]/) ||
        text.includes('-Annual') || 
        text.includes('-Semi-Annual') || 
        text.includes('-Quarterly') ||
        text.includes('-Monthly') ||
        text.includes('-Weekly') ||
        text.includes('-Daily') ||
        text.includes('-Bi-Annual') ||
        text.includes('-Bi-Weekly') ||
        text.includes('-Quinquennial') ||
        text.includes('-Triennial')
      ) && !text.match(/\d+\s+fields?$/i) && !text.match(/^\d+\s+field$/i)) {
        return { name: text, source: 'form-name-div' };
      }
      return null;
    }).filter(Boolean)
  );
  forms.push(...formNameDivs);
  
  // Pattern 1b: Also try divs with font-weight: 600 (fallback for older HTML)
  if (forms.length === 0) {
    const formNameDivsOld = await page.$$eval('div[style*="font-weight: 600"], div[style*="font-weight:600"]', divs =>
      divs.map(div => {
        const text = div.textContent?.trim() || '';
        if (text && text.length > 3 && (
          text.match(/^[\d\.-]+[-A-Z]/) || 
          text.match(/^-[A-Z]/) ||
          text.includes('-Annual') || 
          text.includes('-Semi-Annual') || 
          text.includes('-Quarterly') ||
          text.includes('-Monthly') ||
          text.includes('-Weekly') ||
          text.includes('-Daily') ||
          text.includes('-Bi-Annual') ||
          text.includes('-Bi-Weekly') ||
          text.includes('-Quinquennial') ||
          text.includes('-Triennial')
        ) && !text.match(/\d+\s+fields?$/i) && !text.match(/^\d+\s+field$/i)) {
          return { name: text, source: 'form-name-div-old' };
        }
        return null;
      }).filter(Boolean)
    );
    forms.push(...formNameDivsOld);
  }
  
  // Pattern 2: Fallback - try to find divs with specific classes that contain form names
  if (forms.length === 0) {
    const divs = await page.$$eval('div[dir="auto"]', elements =>
      elements.map(el => {
        const text = el.textContent?.trim() || '';
        const style = el.getAttribute('style') || '';
        // Look for form name divs (usually have font-weight: 600)
        if (style.includes('font-weight') && text && text.length > 3 && (
          text.match(/^[\d\.-]+[-A-Z]/) || 
          text.match(/^-[A-Z]/) ||
          text.includes('-Annual') || 
          text.includes('-Semi-Annual') || 
          text.includes('-Quarterly')
        ) && !text.match(/\d+\s+fields?$/i)) {
          return { name: text, source: 'auto-dir-div' };
        }
        return null;
      }).filter(Boolean)
    );
    forms.push(...divs);
  }
  
  // Pattern 3: Table rows (fallback)
  if (forms.length === 0) {
    const tableRows = await page.$$eval('tr', rows => 
      rows.map((row, idx) => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length > 0) {
          const text = cells[0].textContent?.trim() || '';
          return text ? { name: text, source: 'table-row', index: idx } : null;
        }
        return null;
      }).filter(Boolean)
    );
    forms.push(...tableRows);
  }
  
  // Pattern 4: List items (fallback)
  if (forms.length === 0) {
    const listItems = await page.$$eval('li', items =>
      items.map((item, idx) => {
        const text = item.textContent?.trim() || '';
        return text ? { name: text, source: 'list-item', index: idx } : null;
      }).filter(Boolean)
    );
    forms.push(...listItems);
  }
  
  await browser.close();
  
  // Remove duplicates
  const uniqueForms = [];
  const seen = new Set();
  forms.forEach(form => {
    if (!seen.has(form.name)) {
      seen.add(form.name);
      uniqueForms.push(form);
    }
  });
  
  // Create structured output
  const output = {
    metadata: {
      source: htmlFilePath,
      parsedAt: new Date().toISOString(),
      totalForms: uniqueForms.length
    },
    forms: uniqueForms.map(f => f.name).sort(),
    rawData: uniqueForms
  };
  
  console.log(`Found ${uniqueForms.length} unique forms`);
  
  // Write JSON output
  writeFileSync(outputJsonPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`JSON written to: ${outputJsonPath}`);
  
  return output;
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('parse_html_forms.js')) {
  const htmlFile = process.argv[2] || 'forms.html';
  const jsonFile = process.argv[3] || 'forms_from_site.json';
  parseHTMLForms(htmlFile, jsonFile).catch(console.error);
}

export { parseHTMLForms };

