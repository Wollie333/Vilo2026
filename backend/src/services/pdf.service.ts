/**
 * PDF Service
 * Generates PDF documents from HTML content using Puppeteer
 */

import puppeteer from 'puppeteer';

/**
 * Generate a PDF from Terms & Conditions HTML
 * @param termsHtml - HTML content of the terms
 * @param propertyName - Name of the property (for the title)
 * @returns PDF as Buffer
 */
export async function generateTermsPDF(
  termsHtml: string,
  propertyName: string
): Promise<Buffer> {
  let browser = null;

  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Construct full HTML document with styling
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Terms & Conditions - ${propertyName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }

          h1 {
            color: #047857;
            font-size: 24pt;
            margin-bottom: 8px;
            border-bottom: 3px solid #047857;
            padding-bottom: 12px;
          }

          h2 {
            color: #047857;
            font-size: 18pt;
            margin-top: 24px;
            margin-bottom: 12px;
          }

          h3 {
            color: #333;
            font-size: 14pt;
            margin-top: 16px;
            margin-bottom: 8px;
          }

          p {
            margin-bottom: 12px;
            text-align: justify;
          }

          ul, ol {
            margin-bottom: 12px;
            margin-left: 24px;
          }

          li {
            margin-bottom: 6px;
          }

          strong {
            font-weight: 600;
            color: #111;
          }

          em {
            font-style: italic;
          }

          hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 24px 0;
          }

          .header {
            text-align: center;
            margin-bottom: 32px;
          }

          .property-name {
            color: #6b7280;
            font-size: 14pt;
            margin-bottom: 16px;
          }

          .footer {
            margin-top: 48px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 9pt;
          }

          .content {
            margin-top: 24px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }

          table th,
          table td {
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            text-align: left;
          }

          table th {
            background-color: #f3f4f6;
            font-weight: 600;
          }

          a {
            color: #047857;
            text-decoration: underline;
          }

          blockquote {
            border-left: 4px solid #047857;
            padding-left: 16px;
            margin: 16px 0;
            color: #6b7280;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Terms & Conditions</h1>
          <div class="property-name">${escapeHtml(propertyName)}</div>
        </div>

        <hr>

        <div class="content">
          ${termsHtml}
        </div>

        <hr>

        <div class="footer">
          <p>Document generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</p>
          <p style="margin-top: 4px;">This is an official document from ${escapeHtml(propertyName)}</p>
        </div>
      </body>
      </html>
    `;

    // Set the HTML content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
      preferCSSPageSize: false,
    });

    await browser.close();

    return Buffer.from(pdf);
  } catch (error) {
    // Ensure browser is closed even if error occurs
    if (browser) {
      await browser.close();
    }

    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a PDF from Cancellation Policy
 * @param policy - Cancellation policy object
 * @param propertyName - Name of the property (optional, for context)
 * @returns PDF as Buffer
 */
export async function generateCancellationPolicyPDF(
  policy: {
    name: string;
    description: string | null;
    tiers: Array<{ days: number; refund: number }>;
  },
  propertyName?: string
): Promise<Buffer> {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Sort tiers by days (descending)
    const sortedTiers = [...policy.tiers].sort((a, b) => b.days - a.days);

    // Build tier rows HTML
    const tierRows = sortedTiers
      .map(
        (tier) => `
        <tr>
          <td><strong>${tier.days > 0 ? `${tier.days}+ days before check-in` : 'Less than 1 day before check-in'}</strong></td>
          <td style="text-align: center;">
            <span style="color: ${tier.refund === 100 ? '#10b981' : tier.refund >= 50 ? '#f59e0b' : '#ef4444'}; font-weight: 600; font-size: 14pt;">
              ${tier.refund}%
            </span>
          </td>
        </tr>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cancellation Policy - ${policy.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }

          h1 {
            color: #047857;
            font-size: 24pt;
            margin-bottom: 8px;
            border-bottom: 3px solid #047857;
            padding-bottom: 12px;
          }

          h2 {
            color: #047857;
            font-size: 18pt;
            margin-top: 24px;
            margin-bottom: 12px;
          }

          p {
            margin-bottom: 12px;
            text-align: justify;
          }

          .header {
            text-align: center;
            margin-bottom: 32px;
          }

          .policy-name {
            font-size: 16pt;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .property-name {
            color: #6b7280;
            font-size: 12pt;
            margin-bottom: 16px;
          }

          .description {
            background-color: #f3f4f6;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            font-style: italic;
            color: #4b5563;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
          }

          table th,
          table td {
            border: 1px solid #e5e7eb;
            padding: 12px 16px;
            text-align: left;
          }

          table th {
            background-color: #047857;
            color: white;
            font-weight: 600;
            font-size: 12pt;
          }

          .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            margin: 24px 0;
          }

          .info-box h3 {
            color: #1e40af;
            font-size: 12pt;
            margin-bottom: 8px;
          }

          .info-box p {
            color: #1e3a8a;
            font-size: 10pt;
            margin-bottom: 4px;
          }

          .footer {
            margin-top: 48px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 9pt;
          }

          hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 24px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Cancellation Policy</h1>
          <div class="policy-name">${escapeHtml(policy.name)}</div>
          ${propertyName ? `<div class="property-name">${escapeHtml(propertyName)}</div>` : ''}
        </div>

        <hr>

        ${
          policy.description
            ? `
          <div class="description">
            ${escapeHtml(policy.description)}
          </div>
        `
            : ''
        }

        <h2>Refund Schedule</h2>
        <p>The refund percentage is based on how many days before your check-in date you cancel your booking:</p>

        <table>
          <thead>
            <tr>
              <th>Cancellation Window</th>
              <th style="text-align: center;">Refund Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tierRows}
          </tbody>
        </table>

        <div class="info-box">
          <h3>Important Information</h3>
          <p><strong>How it works:</strong> If you cancel your reservation, the refund percentage shown above will be applied based on the number of days remaining until your scheduled check-in date.</p>
          <p><strong>Processing time:</strong> Refunds are typically processed within 5-10 business days after cancellation approval.</p>
          <p><strong>Calculation:</strong> The refund amount is calculated based on the total booking cost minus any non-refundable fees.</p>
        </div>

        <hr>

        <div class="footer">
          <p>Document generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</p>
          ${propertyName ? `<p style="margin-top: 4px;">This is an official document from ${escapeHtml(propertyName)}</p>` : ''}
        </div>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
      preferCSSPageSize: false,
    });

    await browser.close();

    return Buffer.from(pdf);
  } catch (error) {
    if (browser) {
      await browser.close();
    }

    console.error('Error generating cancellation policy PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to escape HTML entities
 * Prevents XSS in property name
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
