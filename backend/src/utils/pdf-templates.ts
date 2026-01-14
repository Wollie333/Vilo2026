/**
 * PDF Template Helpers - Shared Component Library
 *
 * Professional corporate PDF templates for invoices, receipts, and credit notes.
 * Provides reusable functions for consistent styling across all document types.
 *
 * Design: Black, white, gray color scheme
 * Pattern: Sender (FROM) / Receiver (TO) structure
 * Compliance: Accounting best practices (VAT, bank details, terms)
 */

import PDFDocument from 'pdfkit';

// ============================================================================
// Color Constants (Professional Corporate Palette)
// ============================================================================

export const PDF_COLORS = {
  // Primary colors
  BLACK: '#000000',
  WHITE: '#FFFFFF',

  // Gray scale
  GRAY_DARK: '#374151',    // Headers, important text
  GRAY_MEDIUM: '#6b7280',  // Regular text
  GRAY_LIGHT: '#d1d5db',   // Borders, lines
  GRAY_BG: '#f3f4f6',      // Box backgrounds

  // Status colors only
  GREEN: '#22c55e',        // PAID status
  RED: '#ef4444',          // VOID/FAILED status
  ORANGE: '#f59e0b',       // PENDING status
  YELLOW_BG: '#fff9e6',    // Outstanding balance box
  YELLOW_BORDER: '#f59e0b', // Outstanding balance border
} as const;

// ============================================================================
// Layout Constants
// ============================================================================

export const PDF_LAYOUT = {
  PAGE_WIDTH: 595,      // A4 width in points
  PAGE_HEIGHT: 842,     // A4 height in points
  MARGIN: 50,
  CONTENT_WIDTH: 495,   // PAGE_WIDTH - (MARGIN * 2)
  TABLE_LEFT: 50,
  COLUMN_GAP: 20,
} as const;

// ============================================================================
// Typography Constants
// ============================================================================

export const PDF_FONTS = {
  HEADING_LARGE: { size: 24, font: 'Helvetica-Bold' },
  HEADING_MEDIUM: { size: 16, font: 'Helvetica-Bold' },
  HEADING_SMALL: { size: 12, font: 'Helvetica-Bold' },
  BODY: { size: 10, font: 'Helvetica' },
  BODY_BOLD: { size: 10, font: 'Helvetica-Bold' },
  SMALL: { size: 8, font: 'Helvetica' },
} as const;

// ============================================================================
// Spacing Constants
// ============================================================================

export const PDF_SPACING = {
  SECTION: 30,              // Between major sections (increased from 20)
  PARAGRAPH: 12,            // Between paragraphs (increased from 10)
  LINE: 6,                  // Between lines (increased from 5)
  FROM_TO_LINE: 16,         // Spacing between lines in FROM/TO boxes
  TABLE_ROW_HEIGHT: 32,     // Row height for table (accommodates multi-line content)
  TABLE_HEADER_HEIGHT: 20,  // Header row spacing
} as const;

// ============================================================================
// Border Width Constants
// ============================================================================

export const PDF_BORDERS = {
  THIN: 0.5,
  MEDIUM: 1,
  THICK: 2,
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

export interface CompanyInfo {
  companyName: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  vatNumber?: string | null;
  regNumber?: string | null;
  logoUrl?: string | null;
}

export interface EntityInfo {
  title: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  vatNumber?: string | null;
}

export interface FinancialSummary {
  subtotal: number;      // in cents
  tax: number;           // in cents
  taxRate: number;       // percentage
  total: number;         // in cents
  currency: string;
}

export interface BankDetails {
  paymentTerms?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  branchCode?: string | null;
  accountType?: string | null;
  accountHolder?: string | null;
}

// ============================================================================
// PDF Template Helpers Class
// ============================================================================

export class PDFTemplateHelpers {
  /**
   * Draw company header with logo (optional) and company details
   * Returns the new Y position after drawing
   */
  static drawHeader(
    doc: typeof PDFDocument.prototype,
    companyInfo: CompanyInfo,
    yPosition: number
  ): number {
    let yPos = yPosition;
    const maxWidth = 350; // Limit width to avoid overlapping with right side content

    // Company name (large, bold)
    doc
      .fontSize(PDF_FONTS.HEADING_LARGE.size)
      .font(PDF_FONTS.HEADING_LARGE.font)
      .fillColor(PDF_COLORS.BLACK)
      .text(companyInfo.companyName, PDF_LAYOUT.MARGIN, yPos, { width: maxWidth });

    yPos += 30;

    // Company details (small, regular)
    doc
      .fontSize(PDF_FONTS.BODY.size)
      .font(PDF_FONTS.BODY.font)
      .fillColor(PDF_COLORS.GRAY_MEDIUM);

    if (companyInfo.address) {
      doc.text(companyInfo.address, PDF_LAYOUT.MARGIN, yPos, { width: maxWidth });
      yPos += 15; // Increased spacing for potentially multi-line addresses
    }

    if (companyInfo.email || companyInfo.phone) {
      const contactLine = [companyInfo.email, companyInfo.phone]
        .filter(Boolean)
        .join(' | ');
      doc.text(contactLine, PDF_LAYOUT.MARGIN, yPos, { width: maxWidth });
      yPos += 15;
    }

    // Legal info (bold)
    doc.font(PDF_FONTS.BODY_BOLD.font);

    if (companyInfo.vatNumber) {
      doc.text(`VAT: ${companyInfo.vatNumber}`, PDF_LAYOUT.MARGIN, yPos, { width: maxWidth });
      yPos += 15;
    }

    if (companyInfo.regNumber) {
      doc.text(`Reg: ${companyInfo.regNumber}`, PDF_LAYOUT.MARGIN, yPos, { width: maxWidth });
      yPos += 15;
    }

    // Reset to black
    doc.fillColor(PDF_COLORS.BLACK);

    return yPos + PDF_SPACING.SECTION;
  }

  /**
   * Draw FROM/TO section with bordered boxes
   * Returns the new Y position after drawing
   */
  static drawFromToSection(
    doc: typeof PDFDocument.prototype,
    sender: EntityInfo,
    receiver: EntityInfo,
    yPosition: number
  ): number {
    const boxWidth = 220;
    const boxHeight = 110;  // Increased from 100 to accommodate 16px line spacing
    const leftBoxX = PDF_LAYOUT.MARGIN;
    const rightBoxX = PDF_LAYOUT.MARGIN + boxWidth + 55; // 55px gap

    // Draw both boxes
    [
      { x: leftBoxX, data: sender },
      { x: rightBoxX, data: receiver }
    ].forEach(({ x, data }) => {
      // Box border
      doc
        .strokeColor(PDF_COLORS.GRAY_LIGHT)
        .lineWidth(PDF_BORDERS.THIN)
        .rect(x, yPosition, boxWidth, boxHeight)
        .stroke();

      // Title
      doc
        .fontSize(PDF_FONTS.HEADING_SMALL.size)
        .font(PDF_FONTS.HEADING_SMALL.font)
        .fillColor(PDF_COLORS.GRAY_DARK)
        .text(data.title, x + 10, yPosition + 10, { width: boxWidth - 20 });

      let boxYPos = yPosition + 30;

      // Content
      doc
        .fontSize(PDF_FONTS.BODY.size)
        .font(PDF_FONTS.BODY.font)
        .fillColor(PDF_COLORS.BLACK);

      // Name (bold)
      doc
        .font(PDF_FONTS.BODY_BOLD.font)
        .text(data.name, x + 10, boxYPos, { width: boxWidth - 20 });
      boxYPos += PDF_SPACING.FROM_TO_LINE;  // 16px spacing

      doc.font(PDF_FONTS.BODY.font);

      if (data.email) {
        doc.text(data.email, x + 10, boxYPos, { width: boxWidth - 20 });
        boxYPos += PDF_SPACING.FROM_TO_LINE;  // 16px spacing
      }

      if (data.phone) {
        doc.text(data.phone, x + 10, boxYPos, { width: boxWidth - 20 });
        boxYPos += PDF_SPACING.FROM_TO_LINE;  // 16px spacing
      }

      if (data.address) {
        // Allow more height for multi-line addresses
        const addressLines = doc.heightOfString(data.address, { width: boxWidth - 20 });
        doc.text(data.address, x + 10, boxYPos, { width: boxWidth - 20 });
        boxYPos += Math.max(addressLines, PDF_SPACING.FROM_TO_LINE);  // Dynamic height
      }

      if (data.vatNumber) {
        doc
          .font(PDF_FONTS.BODY_BOLD.font)
          .text(`VAT: ${data.vatNumber}`, x + 10, boxYPos, { width: boxWidth - 20 });
      }
    });

    // Reset styles
    doc.fillColor(PDF_COLORS.BLACK).font(PDF_FONTS.BODY.font);

    return yPosition + boxHeight + PDF_SPACING.SECTION;
  }

  /**
   * Draw a table with headers and rows
   * Returns the new Y position after drawing
   */
  static drawTable(
    doc: typeof PDFDocument.prototype,
    headers: string[],
    rows: string[][],
    yPosition: number,
    columnWidths: number[]
  ): number {
    let yPos = yPosition;
    const tableLeft = PDF_LAYOUT.MARGIN;

    // Draw header
    doc
      .fontSize(PDF_FONTS.BODY_BOLD.size)
      .font(PDF_FONTS.BODY_BOLD.font)
      .fillColor(PDF_COLORS.BLACK);

    this.drawTableRow(doc, headers, yPos, tableLeft, columnWidths);
    yPos += PDF_SPACING.TABLE_HEADER_HEIGHT;  // 20px spacing

    // Header line
    this.drawHLine(doc, yPos, tableLeft, tableLeft + PDF_LAYOUT.CONTENT_WIDTH, PDF_COLORS.GRAY_DARK);
    yPos += 12;  // Increased from 10px

    // Draw rows with alternating background
    doc
      .fontSize(PDF_FONTS.BODY.size)
      .font(PDF_FONTS.BODY.font);

    rows.forEach((row, index) => {
      // Draw alternating row background (every other row)
      if (index % 2 === 1) {  // Rows 1, 3, 5... (0-indexed)
        doc
          .save()
          .fillColor(PDF_COLORS.GRAY_BG)  // Light gray background
          .rect(tableLeft, yPos - 4, PDF_LAYOUT.CONTENT_WIDTH, PDF_SPACING.TABLE_ROW_HEIGHT)
          .fill()
          .restore();
      }

      // Draw row text
      doc.fillColor(PDF_COLORS.BLACK);
      this.drawTableRow(doc, row, yPos, tableLeft, columnWidths);
      yPos += PDF_SPACING.TABLE_ROW_HEIGHT;  // 32px spacing
    });

    // Bottom line
    this.drawHLine(doc, yPos, tableLeft, tableLeft + PDF_LAYOUT.CONTENT_WIDTH, PDF_COLORS.GRAY_DARK);
    yPos += PDF_SPACING.SECTION;

    return yPos;
  }

  /**
   * Draw a single table row (helper method)
   */
  private static drawTableRow(
    doc: typeof PDFDocument.prototype,
    cells: string[],
    yPos: number,
    startX: number,
    columnWidths: number[]
  ): void {
    let xPos = startX;

    cells.forEach((cell, index) => {
      const width = columnWidths[index];
      const align = index === cells.length - 1 ? 'right' : 'left';

      doc.text(cell, xPos, yPos, {
        width: width,
        align: align as 'left' | 'right',
      });

      xPos += width;
    });
  }

  /**
   * Draw financial summary (subtotal, tax, total)
   * Returns the new Y position after drawing
   */
  static drawFinancialSummary(
    doc: typeof PDFDocument.prototype,
    financial: FinancialSummary,
    yPosition: number
  ): number {
    let yPos = yPosition;
    const rightAlign = PDF_LAYOUT.MARGIN + PDF_LAYOUT.CONTENT_WIDTH;
    const labelX = rightAlign - 200;
    const valueX = rightAlign - 90;

    doc
      .fontSize(PDF_FONTS.BODY.size)
      .font(PDF_FONTS.BODY.font)
      .fillColor(PDF_COLORS.BLACK);

    // Subtotal
    doc.text('Subtotal:', labelX, yPos);
    doc.text(this.formatCurrency(financial.subtotal, financial.currency), valueX, yPos, {
      width: 90,
      align: 'right',
    });
    yPos += 18;

    // Tax (if applicable)
    if (financial.tax > 0) {
      const taxLabel = `VAT (${financial.taxRate}%):`;
      doc.text(taxLabel, labelX, yPos);
      doc.text(this.formatCurrency(financial.tax, financial.currency), valueX, yPos, {
        width: 90,
        align: 'right',
      });
      yPos += 18;
    }

    // Line above total
    this.drawHLine(doc, yPos, labelX, rightAlign, PDF_COLORS.GRAY_DARK);
    yPos += 8;

    // Total (bold)
    doc
      .fontSize(PDF_FONTS.BODY_BOLD.size)
      .font(PDF_FONTS.BODY_BOLD.font);

    doc.text('Total:', labelX, yPos);
    doc.text(this.formatCurrency(financial.total, financial.currency), valueX, yPos, {
      width: 90,
      align: 'right',
    });
    yPos += PDF_SPACING.SECTION;

    // Reset font
    doc.font(PDF_FONTS.BODY.font);

    return yPos;
  }

  /**
   * Draw bank details section for EFT payments
   * Returns the new Y position after drawing
   */
  static drawBankDetailsSection(
    doc: typeof PDFDocument.prototype,
    bankDetails: BankDetails,
    yPosition: number
  ): number {
    let yPos = yPosition;

    // Only draw if we have bank details
    if (!bankDetails.bankName && !bankDetails.paymentTerms) {
      return yPos;
    }

    // Payment terms (if provided)
    if (bankDetails.paymentTerms) {
      doc
        .fontSize(PDF_FONTS.BODY.size)
        .font(PDF_FONTS.BODY_BOLD.font)
        .fillColor(PDF_COLORS.BLACK)
        .text('Payment Terms:', PDF_LAYOUT.MARGIN, yPos);
      yPos += 15;

      doc
        .font(PDF_FONTS.BODY.font)
        .fillColor(PDF_COLORS.GRAY_MEDIUM)
        .text(bankDetails.paymentTerms, PDF_LAYOUT.MARGIN, yPos, {
          width: PDF_LAYOUT.CONTENT_WIDTH,
        });
      yPos += 25;
    }

    // Bank details section (if provided)
    if (bankDetails.bankName) {
      doc
        .fontSize(PDF_FONTS.BODY.size)
        .font(PDF_FONTS.BODY_BOLD.font)
        .fillColor(PDF_COLORS.BLACK)
        .text('Bank Details for EFT Payments:', PDF_LAYOUT.MARGIN, yPos);
      yPos += 15;

      doc
        .fontSize(PDF_FONTS.BODY.size)
        .font(PDF_FONTS.BODY.font)
        .fillColor(PDF_COLORS.GRAY_DARK);

      if (bankDetails.bankName) {
        doc.text(`Bank: ${bankDetails.bankName}`, PDF_LAYOUT.MARGIN, yPos);
        yPos += 12;
      }

      if (bankDetails.accountHolder) {
        doc.text(`Account Holder: ${bankDetails.accountHolder}`, PDF_LAYOUT.MARGIN, yPos);
        yPos += 12;
      }

      if (bankDetails.accountNumber) {
        doc.text(`Account Number: ${bankDetails.accountNumber}`, PDF_LAYOUT.MARGIN, yPos);
        yPos += 12;
      }

      if (bankDetails.branchCode) {
        doc.text(`Branch Code: ${bankDetails.branchCode}`, PDF_LAYOUT.MARGIN, yPos);
        yPos += 12;
      }

      if (bankDetails.accountType) {
        doc.text(`Account Type: ${bankDetails.accountType}`, PDF_LAYOUT.MARGIN, yPos);
        yPos += 12;
      }

      yPos += PDF_SPACING.SECTION;
    }

    // Reset styles
    doc.fillColor(PDF_COLORS.BLACK);

    return yPos;
  }

  /**
   * Draw footer with branding and authenticity note
   */
  static drawFooter(
    doc: typeof PDFDocument.prototype,
    customText?: string
  ): void {
    const footerY = PDF_LAYOUT.PAGE_HEIGHT - 80;

    doc
      .fontSize(PDF_FONTS.SMALL.size)
      .font(PDF_FONTS.BODY.font)
      .fillColor(PDF_COLORS.GRAY_MEDIUM);

    // Custom text (if provided)
    if (customText) {
      doc.text(customText, PDF_LAYOUT.MARGIN, footerY, {
        width: PDF_LAYOUT.CONTENT_WIDTH,
        align: 'center',
      });
    }

    // Powered by Vilo
    doc.text('Powered by Vilo', PDF_LAYOUT.MARGIN, footerY + 20, {
      width: PDF_LAYOUT.CONTENT_WIDTH,
      align: 'center',
    });

    // Authenticity note
    doc.text(
      'This is a computer-generated document and is valid without signature',
      PDF_LAYOUT.MARGIN,
      footerY + 35,
      {
        width: PDF_LAYOUT.CONTENT_WIDTH,
        align: 'center',
      }
    );

    // Reset color
    doc.fillColor(PDF_COLORS.BLACK);
  }

  /**
   * Draw status badge (e.g., PAID, VOID, PENDING)
   */
  static drawStatusBadge(
    doc: typeof PDFDocument.prototype,
    status: string,
    xPosition: number,
    yPosition: number
  ): void {
    const statusText = status.toUpperCase();
    let color: string = PDF_COLORS.GRAY_MEDIUM;

    // Determine color based on status
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'issued':
        color = PDF_COLORS.GREEN;
        break;
      case 'void':
      case 'failed':
      case 'rejected':
        color = PDF_COLORS.RED;
        break;
      case 'pending':
      case 'draft':
      case 'under_review':
        color = PDF_COLORS.ORANGE;
        break;
    }

    doc
      .fontSize(PDF_FONTS.HEADING_SMALL.size)
      .font(PDF_FONTS.HEADING_SMALL.font)
      .fillColor(color)
      .text(statusText, xPosition, yPosition, { align: 'right' });

    // Reset color
    doc.fillColor(PDF_COLORS.BLACK);
  }

  /**
   * Draw a horizontal line
   */
  static drawHLine(
    doc: typeof PDFDocument.prototype,
    yPos: number,
    x1: number,
    x2: number,
    color: string = PDF_COLORS.GRAY_LIGHT,
    lineWidth: number = PDF_BORDERS.THIN
  ): void {
    doc
      .strokeColor(color)
      .lineWidth(lineWidth)
      .moveTo(x1, yPos)
      .lineTo(x2, yPos)
      .stroke();

    // Reset stroke color
    doc.strokeColor(PDF_COLORS.BLACK);
  }

  /**
   * Draw a bordered box
   */
  static drawBox(
    doc: typeof PDFDocument.prototype,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      fillColor?: string;
      strokeColor?: string;
      lineWidth?: number;
    } = {}
  ): void {
    const {
      fillColor = PDF_COLORS.WHITE,
      strokeColor = PDF_COLORS.GRAY_LIGHT,
      lineWidth = PDF_BORDERS.THIN,
    } = options;

    doc
      .rect(x, y, width, height)
      .fillAndStroke(fillColor, strokeColor);

    // Reset
    doc.fillColor(PDF_COLORS.BLACK).strokeColor(PDF_COLORS.BLACK);
  }

  /**
   * Format currency amount (cents to major units)
   */
  static formatCurrency(amountCents: number, currency: string): string {
    // Convert cents to major units
    const amount = amountCents / 100;

    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format date string
   */
  static formatDate(dateString: string | Date, format: 'short' | 'long' = 'long'): string {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (format === 'short') {
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }

    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
