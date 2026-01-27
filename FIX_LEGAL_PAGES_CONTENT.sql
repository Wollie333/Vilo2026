-- Fix legal pages content - replace section JSON with simple HTML
-- Run this in Supabase SQL Editor

-- Update Terms & Conditions page
UPDATE website_pages
SET content = '<div class="prose max-w-none">
  <h2>Terms and Conditions</h2>

  <p>Last updated: January 2026</p>

  <h3>1. Acceptance of Terms</h3>
  <p>By accessing and using our services, you accept and agree to be bound by the terms and provision of this agreement.</p>

  <h3>2. Booking and Reservations</h3>
  <p>All bookings are subject to availability and confirmation. We reserve the right to refuse service to anyone for any reason at any time.</p>

  <h3>3. Payment Terms</h3>
  <p>Payment is required at the time of booking unless otherwise arranged. All prices are subject to change without notice.</p>

  <h3>4. Modifications</h3>
  <p>We reserve the right to modify these terms at any time. Continued use of our services following any changes constitutes acceptance of those changes.</p>

  <p><em>Please customize this content to match your specific terms and conditions.</em></p>
</div>'
WHERE page_type = 'terms';

-- Update Privacy Policy page
UPDATE website_pages
SET content = '<div class="prose max-w-none">
  <h2>Privacy Policy</h2>

  <p>Last updated: January 2026</p>

  <h3>1. Information We Collect</h3>
  <p>We collect information that you provide directly to us when making a booking, including your name, email address, phone number, and payment information.</p>

  <h3>2. How We Use Your Information</h3>
  <p>We use the information we collect to process your bookings, communicate with you, and improve our services.</p>

  <h3>3. Information Sharing</h3>
  <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted partners who assist us in operating our business.</p>

  <h3>4. Data Security</h3>
  <p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.</p>

  <h3>5. Your Rights</h3>
  <p>You have the right to access, correct, or delete your personal information at any time by contacting us.</p>

  <p><em>Please customize this content to match your specific privacy practices and comply with applicable laws.</em></p>
</div>'
WHERE page_type = 'privacy';

-- Update Cancellation Policy page
UPDATE website_pages
SET content = '<div class="prose max-w-none">
  <h2>Cancellation Policy</h2>

  <p>Last updated: January 2026</p>

  <h3>Cancellation Terms</h3>
  <p>We understand that plans change. Our cancellation policy is designed to be fair to both our guests and our business.</p>

  <h3>Full Refund</h3>
  <ul>
    <li>Cancellations made more than 14 days before check-in: 100% refund</li>
  </ul>

  <h3>Partial Refund</h3>
  <ul>
    <li>Cancellations made 7-14 days before check-in: 50% refund</li>
  </ul>

  <h3>No Refund</h3>
  <ul>
    <li>Cancellations made less than 7 days before check-in: No refund</li>
    <li>No-shows: No refund</li>
  </ul>

  <h3>How to Cancel</h3>
  <p>To cancel your reservation, please contact us at least 7 days before your scheduled check-in date. Cancellations must be confirmed in writing via email.</p>

  <h3>Modifications</h3>
  <p>If you need to modify your reservation dates, please contact us as soon as possible. Modifications are subject to availability.</p>

  <p><em>Please customize this content to match your specific cancellation policy.</em></p>
</div>'
WHERE page_type = 'cancellation';

-- Verify the updates
SELECT
  page_type,
  title,
  CASE
    WHEN content LIKE '<div class="prose%' THEN 'HTML Content ✓'
    WHEN content LIKE '{%' THEN 'JSON Content ✗'
    ELSE 'Other'
  END as content_type,
  LENGTH(content) as content_length
FROM website_pages
WHERE page_type IN ('terms', 'privacy', 'cancellation');
