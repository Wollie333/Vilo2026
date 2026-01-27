/**
 * Utility to convert plain text legal documents to formatted HTML
 * Automatically detects headings, lists, and paragraphs
 */

export const formatPlainTextToHtml = (plainText: string | null | undefined): string => {
  if (!plainText) {
    return '<p>Content not available.</p>';
  }

  // If content already has HTML tags, return as-is
  if (plainText.includes('<h') || plainText.includes('<p>') || plainText.includes('<div')) {
    return plainText;
  }

  // Split into lines
  const lines = plainText.split('\n').map(line => line.trim());
  const htmlLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      continue;
    }

    // Detect major section headings (e.g., "5. Property Listings and Bookings")
    if (/^\d+\.\s+[A-Z]/.test(line) && !line.includes(':')) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push(`<h2>${line}</h2>`);
      continue;
    }

    // Detect subsection headings (e.g., "5.1 Property Owner Responsibilities")
    if (/^\d+\.\d+\s+[A-Z]/.test(line)) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push(`<h3>${line}</h3>`);
      continue;
    }

    // Detect list items (lines that start with uppercase and are short statements)
    const nextLine = lines[i + 1]?.trim();
    const isListItem = (
      // Line starts with capital letter
      /^[A-Z]/.test(line) &&
      // Line is not too long (likely a list item, not a paragraph)
      line.length < 100 &&
      // Next line also looks like a list item or is empty
      (nextLine && (/^[A-Z]/.test(nextLine) || nextLine === '')) &&
      // Previous line was either a heading or another list item
      (htmlLines.length > 0 && (
        htmlLines[htmlLines.length - 1].includes('<h') ||
        htmlLines[htmlLines.length - 1].includes('<li>') ||
        inList
      ))
    );

    if (isListItem) {
      if (!inList) {
        htmlLines.push('<ul>');
        inList = true;
      }
      htmlLines.push(`<li>${line}</li>`);
      continue;
    }

    // Close list if we're in one and hit a paragraph
    if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }

    // Regular paragraph
    // Bold any text that ends with a colon (e.g., "As a Property Owner, you agree to:")
    let formattedLine = line;
    if (line.endsWith(':')) {
      formattedLine = `<strong>${line}</strong>`;
    }

    htmlLines.push(`<p>${formattedLine}</p>`);
  }

  // Close any open list
  if (inList) {
    htmlLines.push('</ul>');
  }

  return htmlLines.join('\n');
};
