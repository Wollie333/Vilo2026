-- ============================================================================
-- Migration: 137_update_platform_legal_templates.sql
-- Description: Update platform legal documents with comprehensive templates
-- Date: 2026-01-22
-- ============================================================================

-- ============================================================================
-- UPDATE TERMS OF SERVICE
-- ============================================================================

UPDATE platform_legal_documents
SET
  content = '<h1>Vilo Platform Terms of Service</h1>

<p><em>Last Updated: January 22, 2026</em></p>
<p><em>Effective Date: January 22, 2026</em></p>

<h2>1. Acceptance of Terms</h2>
<p>Welcome to Vilo! By accessing or using the Vilo platform (&quot;Platform&quot;, &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Platform.</p>
<p>Vilo provides a comprehensive vacation rental management platform that enables property owners to manage their properties, bookings, payments, and guest communications. The Platform is provided by Vilo Inc. (&quot;Vilo&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).</p>

<h2>2. Definitions</h2>
<ul>
  <li><strong>Platform</strong>: The Vilo software-as-a-service platform, including all websites, mobile applications, and related services.</li>
  <li><strong>Property Owner</strong>: A user who lists and manages vacation rental properties on the Platform.</li>
  <li><strong>Guest</strong>: A user who books accommodations through properties managed on the Platform.</li>
  <li><strong>Account</strong>: Your registered account on the Platform.</li>
  <li><strong>Content</strong>: Any information, text, images, or other materials uploaded or created using the Platform.</li>
</ul>

<h2>3. User Accounts</h2>
<h3>3.1 Registration</h3>
<p>To use certain features of the Platform, you must register for an account. You agree to:</p>
<ul>
  <li>Provide accurate, current, and complete information during registration</li>
  <li>Maintain and promptly update your account information</li>
  <li>Keep your password secure and confidential</li>
  <li>Notify us immediately of any unauthorized access to your account</li>
  <li>Accept responsibility for all activities that occur under your account</li>
</ul>

<h3>3.2 Account Types</h3>
<p>The Platform offers different account types with varying features and pricing:</p>
<ul>
  <li><strong>Free Account</strong>: Basic property management features</li>
  <li><strong>Paid Subscriptions</strong>: Enhanced features including advanced analytics, multiple properties, team management, and priority support</li>
</ul>

<h3>3.3 Account Termination</h3>
<p>You may terminate your account at any time through your account settings. We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or illegal activities.</p>

<h2>4. Subscription Plans and Payments</h2>
<h3>4.1 Subscription Plans</h3>
<p>Property Owners may subscribe to paid plans to access premium features. Subscription details, including pricing and features, are available on our pricing page and may be updated from time to time.</p>

<h3>4.2 Payment Terms</h3>
<ul>
  <li>Subscription fees are billed in advance on a monthly or annual basis</li>
  <li>All fees are non-refundable unless otherwise stated</li>
  <li>You authorize us to charge your payment method for recurring subscription fees</li>
  <li>If payment fails, we may suspend access to premium features</li>
  <li>Price changes will be notified at least 30 days in advance</li>
</ul>

<h3>4.3 Transaction Fees</h3>
<p>Vilo may charge transaction fees for processing guest bookings and payments. These fees will be clearly disclosed before you complete any transaction.</p>

<h2>5. Property Listings and Bookings</h2>
<h3>5.1 Property Owner Responsibilities</h3>
<p>As a Property Owner, you agree to:</p>
<ul>
  <li>Provide accurate and complete property information</li>
  <li>Keep property availability calendars up to date</li>
  <li>Honor confirmed bookings unless extraordinary circumstances apply</li>
  <li>Comply with all applicable laws, regulations, and local ordinances</li>
  <li>Maintain appropriate insurance coverage for your property</li>
  <li>Respond to guest inquiries and booking requests promptly</li>
</ul>

<h3>5.2 Guest Responsibilities</h3>
<p>As a Guest, you agree to:</p>
<ul>
  <li>Provide accurate booking and payment information</li>
  <li>Comply with property rules and check-in/check-out procedures</li>
  <li>Treat the property with respect and report any damages</li>
  <li>Pay all applicable fees, taxes, and charges</li>
  <li>Communicate with Property Owners in a respectful manner</li>
</ul>

<h3>5.3 Cancellations and Refunds</h3>
<p>Cancellation policies are set by individual Property Owners. Refund eligibility depends on the cancellation policy applicable to your booking. Vilo is not responsible for refunds but facilitates the refund process according to the applicable cancellation policy.</p>

<h2>6. Payment Processing</h2>
<h3>6.1 Payment Methods</h3>
<p>We use third-party payment processors (including Paystack, Stripe, and others) to handle payments securely. By using the Platform, you agree to the terms and privacy policies of these payment processors.</p>

<h3>6.2 Payment Security</h3>
<p>While we implement industry-standard security measures, we do not store your complete payment card details. Payment information is encrypted and processed by our certified payment partners.</p>

<h2>7. Intellectual Property</h2>
<h3>7.1 Platform Ownership</h3>
<p>The Platform, including all software, designs, logos, and trademarks, is owned by Vilo and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission.</p>

<h3>7.2 User Content</h3>
<p>You retain ownership of content you upload to the Platform (property descriptions, photos, etc.). By uploading content, you grant Vilo a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content for the purpose of operating and promoting the Platform.</p>

<h3>7.3 Content Standards</h3>
<p>All content must:</p>
<ul>
  <li>Be accurate and not misleading</li>
  <li>Comply with applicable laws and regulations</li>
  <li>Not infringe on intellectual property rights of others</li>
  <li>Not contain offensive, defamatory, or inappropriate material</li>
  <li>Not include spam, malware, or malicious code</li>
</ul>

<h2>8. Prohibited Activities</h2>
<p>You agree not to:</p>
<ul>
  <li>Use the Platform for any illegal purpose or in violation of any laws</li>
  <li>Impersonate any person or entity or misrepresent your affiliation</li>
  <li>Interfere with or disrupt the Platform or servers</li>
  <li>Attempt to gain unauthorized access to any part of the Platform</li>
  <li>Collect or harvest information about other users without permission</li>
  <li>Use automated systems (bots, scrapers) to access the Platform</li>
  <li>Engage in fraudulent activities or money laundering</li>
  <li>Discriminate against any person based on protected characteristics</li>
  <li>List properties you do not have the right to rent</li>
</ul>

<h2>9. Privacy and Data Protection</h2>
<p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information. By using the Platform, you consent to our data practices as described in the Privacy Policy.</p>

<h2>10. Disclaimers and Limitations of Liability</h2>
<h3>10.1 Platform &quot;As Is&quot;</h3>
<p>THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>

<h3>10.2 Service Availability</h3>
<p>We do not guarantee that the Platform will be available at all times, error-free, or free from viruses or other harmful components. We may suspend or terminate the Platform for maintenance or updates without notice.</p>

<h3>10.3 Third-Party Services</h3>
<p>The Platform may integrate with third-party services (payment processors, calendar integrations, etc.). We are not responsible for the performance, availability, or content of these third-party services.</p>

<h3>10.4 Limitation of Liability</h3>
<p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, VILO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:</p>
<ul>
  <li>Your use or inability to use the Platform</li>
  <li>Any unauthorized access to or use of our servers or personal information</li>
  <li>Any interruption or cessation of the Platform</li>
  <li>Any bugs, viruses, or harmful code transmitted through the Platform</li>
  <li>Any errors or omissions in content or loss of content</li>
  <li>Any disputes between Property Owners and Guests</li>
</ul>
<p>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</p>

<h2>11. Indemnification</h2>
<p>You agree to indemnify, defend, and hold harmless Vilo, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys'' fees) arising from:</p>
<ul>
  <li>Your use of the Platform</li>
  <li>Your violation of these Terms</li>
  <li>Your violation of any rights of another person or entity</li>
  <li>Your property listings or bookings</li>
  <li>Any disputes with other users</li>
</ul>

<h2>12. Dispute Resolution</h2>
<h3>12.1 Disputes Between Users</h3>
<p>Vilo is not a party to disputes between Property Owners and Guests. While we may offer support and mediation, users are responsible for resolving their disputes directly.</p>

<h3>12.2 Governing Law</h3>
<p>These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.</p>

<h3>12.3 Arbitration</h3>
<p>Any dispute arising from these Terms or the Platform shall be resolved through binding arbitration in accordance with the rules of [Arbitration Organization]. The arbitration shall take place in [Location], and judgment on the award may be entered in any court having jurisdiction.</p>

<h2>13. Changes to Terms</h2>
<p>We reserve the right to modify these Terms at any time. We will notify you of material changes by email or through a prominent notice on the Platform. Your continued use of the Platform after changes become effective constitutes acceptance of the modified Terms.</p>

<h2>14. Term and Termination</h2>
<h3>14.1 Term</h3>
<p>These Terms remain in effect while you use the Platform.</p>

<h3>14.2 Termination by You</h3>
<p>You may terminate your account at any time. Upon termination, you will lose access to your account and associated data. Some data may be retained as required by law or for legitimate business purposes.</p>

<h3>14.3 Termination by Us</h3>
<p>We may suspend or terminate your account immediately if:</p>
<ul>
  <li>You violate these Terms</li>
  <li>You engage in fraudulent or illegal activities</li>
  <li>We are required to do so by law</li>
  <li>Continuing to provide services creates legal or security risks</li>
</ul>

<h3>14.4 Effect of Termination</h3>
<p>Upon termination, you must immediately cease using the Platform. Sections that by their nature should survive termination (including payment obligations, disclaimers, and indemnification) will continue to apply.</p>

<h2>15. General Provisions</h2>
<h3>15.1 Entire Agreement</h3>
<p>These Terms, together with our Privacy Policy and any other policies referenced herein, constitute the entire agreement between you and Vilo regarding the Platform.</p>

<h3>15.2 Severability</h3>
<p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.</p>

<h3>15.3 Waiver</h3>
<p>Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision.</p>

<h3>15.4 Assignment</h3>
<p>You may not assign or transfer these Terms without our prior written consent. We may assign or transfer these Terms without restriction.</p>

<h3>15.5 Force Majeure</h3>
<p>Vilo shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including acts of God, natural disasters, war, terrorism, labor disputes, or government actions.</p>

<h2>16. Contact Information</h2>
<p>If you have questions about these Terms, please contact us:</p>
<ul>
  <li><strong>Email:</strong> legal@vilo.com</li>
  <li><strong>Address:</strong> [Your Company Address]</li>
  <li><strong>Support:</strong> support@vilo.com</li>
</ul>

<hr>

<p><em>By using the Vilo Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</em></p>',
  updated_at = NOW()
WHERE document_type = 'terms_of_service' AND version = '1.0';

-- ============================================================================
-- UPDATE PRIVACY POLICY
-- ============================================================================

UPDATE platform_legal_documents
SET
  content = '<h1>Vilo Privacy Policy</h1>

<p><em>Last Updated: January 22, 2026</em></p>
<p><em>Effective Date: January 22, 2026</em></p>

<h2>1. Introduction</h2>
<p>Welcome to Vilo. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how Vilo Inc. (&quot;Vilo&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, discloses, and safeguards your information when you use our vacation rental management platform (&quot;Platform&quot;, &quot;Service&quot;).</p>
<p>This Privacy Policy applies to all users of the Platform, including Property Owners, Guests, and visitors. By using the Platform, you consent to the data practices described in this policy.</p>

<h2>2. Information We Collect</h2>
<h3>2.1 Information You Provide</h3>
<p>We collect information that you voluntarily provide when you:</p>
<ul>
  <li><strong>Create an Account:</strong> Name, email address, password, phone number, business information</li>
  <li><strong>List a Property:</strong> Property details, photos, descriptions, addresses, availability, pricing</li>
  <li><strong>Make a Booking:</strong> Guest details, check-in/check-out dates, number of guests, special requests</li>
  <li><strong>Process Payments:</strong> Billing information, payment card details (processed by third-party payment processors)</li>
  <li><strong>Communicate:</strong> Messages, reviews, support inquiries, feedback</li>
  <li><strong>Verify Identity:</strong> Government-issued ID, proof of ownership documents</li>
</ul>

<h3>2.2 Information Collected Automatically</h3>
<p>When you use the Platform, we automatically collect:</p>
<ul>
  <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
  <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, click patterns, search queries</li>
  <li><strong>Location Data:</strong> Approximate location based on IP address; precise location with your consent</li>
  <li><strong>Cookies and Tracking:</strong> See our Cookie Policy for details</li>
</ul>

<h3>2.3 Information from Third Parties</h3>
<p>We may receive information from:</p>
<ul>
  <li><strong>Payment Processors:</strong> Transaction details, payment status</li>
  <li><strong>Social Media:</strong> Profile information if you connect social accounts</li>
  <li><strong>Calendar Integrations:</strong> Booking data from external calendars</li>
  <li><strong>Analytics Providers:</strong> Aggregated usage statistics</li>
</ul>

<h2>3. How We Use Your Information</h2>
<p>We use your information to:</p>
<ul>
  <li><strong>Provide Services:</strong> Enable property listings, booking management, payment processing, communications</li>
  <li><strong>Process Transactions:</strong> Facilitate bookings, handle payments, issue invoices and receipts</li>
  <li><strong>Communicate:</strong> Send booking confirmations, updates, notifications, customer support responses</li>
  <li><strong>Improve Platform:</strong> Analyze usage patterns, fix bugs, develop new features</li>
  <li><strong>Marketing:</strong> Send promotional materials, newsletters, offers (with your consent)</li>
  <li><strong>Prevent Fraud:</strong> Detect and prevent fraudulent transactions, abuse, security threats</li>
  <li><strong>Comply with Law:</strong> Meet legal obligations, enforce our Terms, protect rights</li>
  <li><strong>Personalize Experience:</strong> Customize content, recommendations, search results</li>
</ul>

<h2>4. Legal Basis for Processing (GDPR)</h2>
<p>For users in the European Economic Area (EEA), we process personal data based on:</p>
<ul>
  <li><strong>Contract Performance:</strong> To provide services you''ve requested</li>
  <li><strong>Legitimate Interests:</strong> To improve services, prevent fraud, ensure security</li>
  <li><strong>Consent:</strong> For marketing communications, cookies, location tracking</li>
  <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
</ul>

<h2>5. Information Sharing and Disclosure</h2>
<h3>5.1 When We Share Your Information</h3>
<p>We share your information with:</p>
<ul>
  <li><strong>Between Users:</strong> Property Owners and Guests share necessary booking information</li>
  <li><strong>Service Providers:</strong> Payment processors, email services, analytics providers, hosting services (under strict data protection agreements)</li>
  <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
  <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
  <li><strong>Protection:</strong> To protect rights, property, safety of Vilo, users, or the public</li>
  <li><strong>With Consent:</strong> When you explicitly consent to sharing</li>
</ul>

<h3>5.2 Third-Party Services</h3>
<p>We use trusted third-party services:</p>
<ul>
  <li><strong>Payment Processing:</strong> Paystack, Stripe (see their privacy policies)</li>
  <li><strong>Email Communications:</strong> Resend, SendGrid</li>
  <li><strong>Analytics:</strong> Google Analytics, Mixpanel</li>
  <li><strong>Cloud Hosting:</strong> Supabase, AWS</li>
</ul>

<h3>5.3 We Do Not Sell Your Data</h3>
<p>Vilo does not sell, rent, or trade your personal information to third parties for their marketing purposes.</p>

<h2>6. Data Retention</h2>
<p>We retain your personal data for as long as necessary to:</p>
<ul>
  <li>Provide services you''ve requested</li>
  <li>Comply with legal, accounting, or reporting requirements</li>
  <li>Resolve disputes and enforce our agreements</li>
  <li>Prevent fraud and abuse</li>
</ul>
<p>Typical retention periods:</p>
<ul>
  <li><strong>Account Data:</strong> Until you delete your account, plus 90 days</li>
  <li><strong>Booking Data:</strong> 7 years for tax and legal compliance</li>
  <li><strong>Payment Data:</strong> Retained by payment processors per their policies</li>
  <li><strong>Marketing Data:</strong> Until you unsubscribe, plus 30 days</li>
  <li><strong>Anonymous Analytics:</strong> Indefinitely</li>
</ul>

<h2>7. Your Rights and Choices</h2>
<h3>7.1 Access and Correction</h3>
<p>You can access and update your personal information through your account settings or by contacting us.</p>

<h3>7.2 Data Portability</h3>
<p>You have the right to receive your personal data in a structured, commonly used format.</p>

<h3>7.3 Deletion</h3>
<p>You can request deletion of your account and personal data. Some information may be retained as required by law or for legitimate business purposes.</p>

<h3>7.4 Objection and Restriction</h3>
<p>You can object to or request restriction of certain data processing activities.</p>

<h3>7.5 Marketing Opt-Out</h3>
<p>You can unsubscribe from marketing emails using the unsubscribe link in emails or through your account settings.</p>

<h3>7.6 Cookie Management</h3>
<p>You can manage cookie preferences through your browser settings or our cookie consent tool.</p>

<h3>7.7 Do Not Track</h3>
<p>We currently do not respond to Do Not Track signals, as there is no industry standard for compliance.</p>

<h2>8. Data Security</h2>
<p>We implement industry-standard security measures to protect your data:</p>
<ul>
  <li><strong>Encryption:</strong> Data in transit (TLS/SSL) and at rest (AES-256)</li>
  <li><strong>Access Controls:</strong> Role-based access, authentication, authorization</li>
  <li><strong>Regular Audits:</strong> Security assessments, penetration testing</li>
  <li><strong>Monitoring:</strong> Intrusion detection, activity logging</li>
  <li><strong>Data Backups:</strong> Regular backups with secure storage</li>
</ul>
<p>However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.</p>

<h2>9. International Data Transfers</h2>
<p>Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place, such as:</p>
<ul>
  <li>Standard Contractual Clauses approved by the European Commission</li>
  <li>Privacy Shield (if applicable)</li>
  <li>Adequacy decisions by relevant authorities</li>
</ul>

<h2>10. Children''s Privacy</h2>
<p>The Platform is not intended for children under 18 (or the age of majority in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.</p>

<h2>11. California Privacy Rights (CCPA)</h2>
<p>If you are a California resident, you have additional rights:</p>
<ul>
  <li><strong>Right to Know:</strong> What personal information we collect, use, disclose</li>
  <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
  <li><strong>Right to Opt-Out:</strong> Opt-out of sale of personal information (we do not sell data)</li>
  <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
</ul>
<p>To exercise these rights, contact us at privacy@vilo.com. We will respond within 45 days.</p>

<h2>12. European Privacy Rights (GDPR)</h2>
<p>If you are in the EEA or UK, you have rights under GDPR:</p>
<ul>
  <li>Right of access, rectification, erasure</li>
  <li>Right to restrict processing, data portability</li>
  <li>Right to object to processing</li>
  <li>Right to withdraw consent</li>
  <li>Right to lodge a complaint with a supervisory authority</li>
</ul>

<h2>13. Changes to This Privacy Policy</h2>
<p>We may update this Privacy Policy from time to time. We will notify you of material changes by:</p>
<ul>
  <li>Posting the updated policy on the Platform</li>
  <li>Sending an email notification</li>
  <li>Displaying a prominent notice</li>
</ul>
<p>Your continued use after changes become effective constitutes acceptance of the updated policy.</p>

<h2>14. Contact Us</h2>
<p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices:</p>
<ul>
  <li><strong>Email:</strong> privacy@vilo.com</li>
  <li><strong>Data Protection Officer:</strong> dpo@vilo.com</li>
  <li><strong>Address:</strong> [Your Company Address]</li>
  <li><strong>Support:</strong> support@vilo.com</li>
</ul>

<h2>15. Supervisory Authority</h2>
<p>If you are in the EEA or UK, you have the right to lodge a complaint with your local data protection authority.</p>

<hr>

<p><em>By using Vilo, you acknowledge that you have read and understood this Privacy Policy and consent to our data practices as described herein.</em></p>',
  updated_at = NOW()
WHERE document_type = 'privacy_policy' AND version = '1.0';

-- ============================================================================
-- UPDATE COOKIE POLICY
-- ============================================================================

UPDATE platform_legal_documents
SET
  content = '<h1>Vilo Cookie Policy</h1>

<p><em>Last Updated: January 22, 2026</em></p>
<p><em>Effective Date: January 22, 2026</em></p>

<h2>1. Introduction</h2>
<p>This Cookie Policy explains how Vilo Inc. (&quot;Vilo&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies and similar tracking technologies on our vacation rental management platform (&quot;Platform&quot;). This policy should be read together with our Privacy Policy.</p>

<h2>2. What Are Cookies?</h2>
<p>Cookies are small text files stored on your device (computer, tablet, smartphone) when you visit a website. Cookies allow the website to recognize your device and remember certain information about your visit.</p>

<h3>Types of Cookies:</h3>
<ul>
  <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
  <li><strong>Persistent Cookies:</strong> Cookies that remain on your device until they expire or you delete them</li>
  <li><strong>First-Party Cookies:</strong> Set by Vilo directly</li>
  <li><strong>Third-Party Cookies:</strong> Set by our service providers and partners</li>
</ul>

<h2>3. Cookies We Use</h2>

<h3>3.1 Strictly Necessary Cookies</h3>
<p><strong>Purpose:</strong> Essential for the Platform to function properly. These cannot be disabled.</p>
<p><strong>Examples:</strong></p>
<ul>
  <li>Authentication cookies to keep you logged in</li>
  <li>Security cookies to prevent fraud and protect your account</li>
  <li>Session cookies to maintain your booking process</li>
  <li>Load balancing cookies for platform stability</li>
</ul>
<p><strong>Duration:</strong> Session or up to 1 year</p>

<h3>3.2 Functional Cookies</h3>
<p><strong>Purpose:</strong> Enable enhanced functionality and personalization.</p>
<p><strong>Examples:</strong></p>
<ul>
  <li>Language and currency preferences</li>
  <li>Display preferences (dark mode, layout)</li>
  <li>Recently viewed properties</li>
  <li>Saved searches and filters</li>
  <li>Accessibility settings</li>
</ul>
<p><strong>Duration:</strong> Up to 2 years</p>

<h3>3.3 Analytics and Performance Cookies</h3>
<p><strong>Purpose:</strong> Help us understand how visitors use the Platform and identify areas for improvement.</p>
<p><strong>Examples:</strong></p>
<ul>
  <li>Google Analytics: Track page views, user behavior, traffic sources</li>
  <li>Mixpanel: Analyze feature usage and user journeys</li>
  <li>Performance monitoring: Measure page load times, error rates</li>
</ul>
<p><strong>Duration:</strong> Up to 2 years</p>
<p><strong>Third Parties:</strong> Google Analytics, Mixpanel</p>

<h3>3.4 Marketing and Advertising Cookies</h3>
<p><strong>Purpose:</strong> Deliver relevant advertisements and measure campaign effectiveness.</p>
<p><strong>Examples:</strong></p>
<ul>
  <li>Retargeting cookies to show relevant ads</li>
  <li>Conversion tracking to measure ad performance</li>
  <li>Social media pixels (Facebook, Instagram, LinkedIn)</li>
  <li>Email campaign tracking</li>
</ul>
<p><strong>Duration:</strong> Up to 1 year</p>
<p><strong>Third Parties:</strong> Google Ads, Facebook Pixel, LinkedIn Insights</p>

<h2>4. Other Tracking Technologies</h2>

<h3>4.1 Web Beacons (Pixels)</h3>
<p>Small transparent images embedded in web pages and emails to track opens, clicks, and conversions.</p>

<h3>4.2 Local Storage</h3>
<p>Browser storage used to save data locally on your device for faster performance and offline functionality.</p>

<h3>4.3 Device Fingerprinting</h3>
<p>Collecting device information (browser type, screen resolution, plugins) to identify and prevent fraud.</p>

<h3>4.4 Log Files</h3>
<p>Server logs that record IP addresses, browser types, referring pages, and timestamps.</p>

<h2>5. Third-Party Cookies</h2>
<p>We work with trusted third-party service providers who may set cookies on your device:</p>

<h3>5.1 Payment Processors</h3>
<ul>
  <li><strong>Paystack:</strong> For secure payment processing</li>
  <li><strong>Stripe:</strong> For payment gateway services</li>
</ul>

<h3>5.2 Analytics Services</h3>
<ul>
  <li><strong>Google Analytics:</strong> Website traffic analysis</li>
  <li><strong>Mixpanel:</strong> User behavior tracking</li>
</ul>

<h3>5.3 Communication Tools</h3>
<ul>
  <li><strong>Resend/SendGrid:</strong> Email delivery tracking</li>
  <li><strong>Intercom/Zendesk:</strong> Customer support chat</li>
</ul>

<h3>5.4 Advertising Networks</h3>
<ul>
  <li><strong>Google Ads:</strong> Display advertising</li>
  <li><strong>Facebook Pixel:</strong> Social media advertising</li>
</ul>

<h2>6. How to Manage Cookies</h2>

<h3>6.1 Cookie Consent Tool</h3>
<p>When you first visit the Platform, you''ll see a cookie banner allowing you to accept or customize your cookie preferences. You can change your preferences at any time by clicking the &quot;Cookie Settings&quot; link in the footer.</p>

<h3>6.2 Browser Settings</h3>
<p>You can control cookies through your browser settings:</p>
<ul>
  <li><strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies</li>
  <li><strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies</li>
  <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Cookies</li>
  <li><strong>Edge:</strong> Settings &gt; Cookies and Site Permissions</li>
</ul>

<h3>6.3 Opt-Out Tools</h3>
<p>You can opt out of specific tracking:</p>
<ul>
  <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" target="_blank">Google Analytics Opt-out Browser Add-on</a></li>
  <li><strong>Interest-Based Ads:</strong> <a href="http://www.aboutads.info/choices" target="_blank">Digital Advertising Alliance Opt-Out</a></li>
  <li><strong>Facebook:</strong> <a href="https://www.facebook.com/settings?tab=ads" target="_blank">Facebook Ad Preferences</a></li>
</ul>

<h3>6.4 Mobile Devices</h3>
<p>On mobile devices:</p>
<ul>
  <li><strong>iOS:</strong> Settings &gt; Privacy &gt; Tracking</li>
  <li><strong>Android:</strong> Settings &gt; Google &gt; Ads</li>
</ul>

<h2>7. Impact of Disabling Cookies</h2>
<p>If you disable cookies, you may experience:</p>
<ul>
  <li>Inability to log in or maintain your session</li>
  <li>Loss of personalized settings and preferences</li>
  <li>Reduced functionality and performance</li>
  <li>Need to re-enter information on each visit</li>
  <li>Less relevant advertising content</li>
</ul>
<p><strong>Strictly necessary cookies</strong> cannot be disabled as they are essential for the Platform to function.</p>

<h2>8. Cookie Lifespan</h2>
<p>Cookie retention periods:</p>
<ul>
  <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
  <li><strong>Authentication Cookies:</strong> 30 days to 1 year</li>
  <li><strong>Preference Cookies:</strong> Up to 2 years</li>
  <li><strong>Analytics Cookies:</strong> 14 days to 2 years</li>
  <li><strong>Marketing Cookies:</strong> 30 days to 1 year</li>
</ul>

<h2>9. Updates to This Cookie Policy</h2>
<p>We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of material changes by updating the &quot;Last Updated&quot; date and posting the revised policy on the Platform.</p>

<h2>10. Contact Us</h2>
<p>If you have questions about this Cookie Policy or our use of cookies:</p>
<ul>
  <li><strong>Email:</strong> privacy@vilo.com</li>
  <li><strong>Support:</strong> support@vilo.com</li>
  <li><strong>Address:</strong> [Your Company Address]</li>
</ul>

<h2>11. More Information</h2>
<p>For more information about cookies and online privacy:</p>
<ul>
  <li><a href="https://www.allaboutcookies.org" target="_blank">All About Cookies</a></li>
  <li><a href="https://www.youronlinechoices.com" target="_blank">Your Online Choices</a></li>
  <li><a href="https://ico.org.uk/for-organisations/guide-to-pecr/cookies-and-similar-technologies/" target="_blank">ICO Guidance on Cookies</a></li>
</ul>

<hr>

<p><em>By continuing to use Vilo, you consent to our use of cookies as described in this Cookie Policy.</em></p>',
  updated_at = NOW()
WHERE document_type = 'cookie_policy' AND version = '1.0';

-- ============================================================================
-- UPDATE ACCEPTABLE USE POLICY
-- ============================================================================

UPDATE platform_legal_documents
SET
  content = '<h1>Vilo Acceptable Use Policy</h1>

<p><em>Last Updated: January 22, 2026</em></p>
<p><em>Effective Date: January 22, 2026</em></p>

<h2>1. Purpose</h2>
<p>This Acceptable Use Policy (&quot;AUP&quot;) defines the rules and guidelines for using the Vilo vacation rental management platform (&quot;Platform&quot;). This policy supplements our Terms of Service and applies to all users, including Property Owners, Guests, and visitors.</p>
<p>By using the Platform, you agree to comply with this AUP. Violations may result in account suspension, termination, and legal action.</p>

<h2>2. General Conduct Requirements</h2>
<p>When using the Platform, you must:</p>
<ul>
  <li>Comply with all applicable local, state, national, and international laws and regulations</li>
  <li>Respect the rights and dignity of others</li>
  <li>Provide accurate and truthful information</li>
  <li>Act in good faith and with integrity</li>
  <li>Use the Platform only for its intended purpose</li>
  <li>Report any violations of this policy that you encounter</li>
</ul>

<h2>3. Prohibited Activities</h2>

<h3>3.1 Illegal Activities</h3>
<p>You may not use the Platform to:</p>
<ul>
  <li>Engage in or promote any illegal activity</li>
  <li>Violate any laws, including but not limited to:
    <ul>
      <li>Tax evasion or money laundering</li>
      <li>Fraud, forgery, or identity theft</li>
      <li>Sale of illegal goods or services</li>
      <li>Violation of intellectual property rights</li>
      <li>Privacy or data protection violations</li>
    </ul>
  </li>
  <li>Facilitate or promote illegal short-term rentals in jurisdictions where they are prohibited</li>
  <li>Evade or circumvent taxes, fees, or legal obligations</li>
</ul>

<h3>3.2 Fraudulent Behavior</h3>
<p>You may not:</p>
<ul>
  <li>Provide false, misleading, or deceptive information</li>
  <li>Impersonate any person or entity</li>
  <li>Create fake accounts or use multiple accounts to manipulate the Platform</li>
  <li>Submit fraudulent bookings or payment information</li>
  <li>Engage in payment fraud, chargeback abuse, or credit card theft</li>
  <li>Manipulate reviews, ratings, or rankings</li>
  <li>Create fake properties or listings</li>
</ul>

<h3>3.3 Harassment and Abuse</h3>
<p>You may not:</p>
<ul>
  <li>Harass, threaten, intimidate, or abuse other users</li>
  <li>Engage in hate speech or discrimination based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics</li>
  <li>Post or share offensive, defamatory, or obscene content</li>
  <li>Stalk or repeatedly contact others against their wishes</li>
  <li>Share private information about others without consent (doxxing)</li>
  <li>Engage in sexual harassment or unwanted advances</li>
</ul>

<h3>3.4 Property and Listing Violations</h3>
<p>Property Owners may not:</p>
<ul>
  <li>List properties they do not own or have authorization to rent</li>
  <li>Misrepresent property features, amenities, or location</li>
  <li>Use photos that do not accurately represent the property</li>
  <li>Discriminate against guests based on protected characteristics</li>
  <li>Fail to disclose material defects, hazards, or restrictions</li>
  <li>List properties that violate local regulations or HOA rules</li>
  <li>Cancel confirmed bookings without valid reason</li>
  <li>Charge guests additional fees not disclosed in the listing</li>
</ul>

<h3>3.5 Booking Violations</h3>
<p>Guests may not:</p>
<ul>
  <li>Make fake or fraudulent bookings</li>
  <li>Use stolen payment methods or financial information</li>
  <li>Exceed stated occupancy limits</li>
  <li>Host unauthorized parties or events (if prohibited by listing)</li>
  <li>Cause intentional damage to property</li>
  <li>Violate property rules or community guidelines</li>
  <li>Submit false or malicious reviews</li>
  <li>Attempt to circumvent platform fees by paying off-platform</li>
</ul>

<h3>3.6 Security Violations</h3>
<p>You may not:</p>
<ul>
  <li>Attempt to gain unauthorized access to the Platform, accounts, or systems</li>
  <li>Use automated tools (bots, scrapers, crawlers) to access or extract data</li>
  <li>Reverse engineer, decompile, or disassemble any part of the Platform</li>
  <li>Introduce viruses, malware, or malicious code</li>
  <li>Interfere with or disrupt the Platform, servers, or networks</li>
  <li>Conduct security testing or vulnerability scanning without permission</li>
  <li>Circumvent security measures or authentication mechanisms</li>
  <li>Share or publish security vulnerabilities publicly</li>
</ul>

<h3>3.7 Spam and Unwanted Communications</h3>
<p>You may not:</p>
<ul>
  <li>Send spam, unsolicited messages, or bulk communications</li>
  <li>Use the Platform for marketing unrelated products or services</li>
  <li>Share contact information to move transactions off-platform</li>
  <li>Collect or harvest user information without consent</li>
  <li>Send phishing messages or social engineering attacks</li>
  <li>Post repetitive or irrelevant content</li>
</ul>

<h3>3.8 Intellectual Property Violations</h3>
<p>You may not:</p>
<ul>
  <li>Upload content that infringes copyrights, trademarks, or other IP rights</li>
  <li>Use others'' photos, descriptions, or content without permission</li>
  <li>Violate software licenses or terms of service</li>
  <li>Remove or obscure copyright notices or watermarks</li>
  <li>Create derivative works based on the Platform without authorization</li>
</ul>

<h3>3.9 Competitive or Commercial Misuse</h3>
<p>You may not:</p>
<ul>
  <li>Use the Platform to gather competitive intelligence</li>
  <li>Copy, reproduce, or aggregate platform data for commercial purposes</li>
  <li>Build competing products or services using our platform</li>
  <li>Resell access to the Platform without authorization</li>
  <li>Frame or mirror the Platform on other websites</li>
</ul>

<h3>3.10 Content Violations</h3>
<p>You may not post or share content that:</p>
<ul>
  <li>Is illegal, harmful, or promotes illegal activity</li>
  <li>Contains adult content, pornography, or sexually explicit material</li>
  <li>Depicts violence, gore, or cruelty</li>
  <li>Promotes self-harm, suicide, or eating disorders</li>
  <li>Contains false or misleading information</li>
  <li>Violates privacy rights or contains personal information of others</li>
  <li>Infringes intellectual property rights</li>
</ul>

<h2>4. Property Owner Specific Requirements</h2>
<p>Property Owners must:</p>
<ul>
  <li>Comply with all local laws, regulations, licenses, and permits for short-term rentals</li>
  <li>Pay all applicable taxes (occupancy tax, sales tax, income tax)</li>
  <li>Maintain adequate insurance coverage for rental activities</li>
  <li>Ensure properties meet health, safety, and habitability standards</li>
  <li>Disclose all material information about properties</li>
  <li>Honor confirmed bookings or provide appropriate compensation</li>
  <li>Respond to guest inquiries and issues promptly</li>
  <li>Maintain properties in the condition represented in listings</li>
</ul>

<h2>5. Guest Specific Requirements</h2>
<p>Guests must:</p>
<ul>
  <li>Provide accurate guest count and booking information</li>
  <li>Follow property rules and check-in/check-out procedures</li>
  <li>Treat properties with care and respect</li>
  <li>Report damages or issues promptly</li>
  <li>Pay all applicable fees and charges</li>
  <li>Comply with cancellation policies</li>
  <li>Respect neighbors and community standards</li>
  <li>Leave properties in clean and orderly condition</li>
</ul>

<h2>6. Reporting Violations</h2>
<p>If you encounter violations of this policy:</p>
<ul>
  <li>Report through the Platform''s reporting feature</li>
  <li>Email: abuse@vilo.com</li>
  <li>Provide as much detail as possible (screenshots, URLs, dates)</li>
  <li>Allow us reasonable time to investigate and respond</li>
</ul>

<h2>7. Enforcement</h2>

<h3>7.1 Investigation</h3>
<p>We reserve the right to investigate suspected violations of this policy. We may:</p>
<ul>
  <li>Review account activity and content</li>
  <li>Contact users for information</li>
  <li>Cooperate with law enforcement</li>
  <li>Preserve evidence for potential legal proceedings</li>
</ul>

<h3>7.2 Consequences of Violations</h3>
<p>Depending on the severity, violations may result in:</p>
<ul>
  <li><strong>Warning:</strong> First-time minor violations may receive a warning</li>
  <li><strong>Content Removal:</strong> Deletion of violating content</li>
  <li><strong>Account Suspension:</strong> Temporary restriction of account access</li>
  <li><strong>Account Termination:</strong> Permanent ban from the Platform</li>
  <li><strong>Legal Action:</strong> Civil or criminal proceedings for serious violations</li>
  <li><strong>Financial Penalties:</strong> Withholding of funds, recovery of damages</li>
</ul>

<h3>7.3 No Refund</h3>
<p>Users whose accounts are suspended or terminated for policy violations are not entitled to refunds of subscription fees or other charges.</p>

<h2>8. Appeals</h2>
<p>If you believe your account was suspended or terminated in error:</p>
<ul>
  <li>Submit an appeal to appeals@vilo.com within 30 days</li>
  <li>Provide detailed explanation and supporting evidence</li>
  <li>We will review and respond within 15 business days</li>
  <li>Our decision on appeals is final</li>
</ul>

<h2>9. Changes to This Policy</h2>
<p>We may update this Acceptable Use Policy from time to time. Material changes will be communicated through:</p>
<ul>
  <li>Email notification to your registered email address</li>
  <li>Prominent notice on the Platform</li>
  <li>Updated &quot;Last Updated&quot; date at the top of this page</li>
</ul>
<p>Your continued use of the Platform after changes become effective constitutes acceptance of the revised policy.</p>

<h2>10. Disclaimer</h2>
<p>This policy does not create any contractual or legal rights for users. We reserve the right to enforce this policy at our sole discretion. Failure to enforce this policy in one instance does not waive our right to enforce it in other instances.</p>

<h2>11. Contact Us</h2>
<p>Questions about this Acceptable Use Policy:</p>
<ul>
  <li><strong>Email:</strong> legal@vilo.com</li>
  <li><strong>Abuse Reports:</strong> abuse@vilo.com</li>
  <li><strong>Appeals:</strong> appeals@vilo.com</li>
  <li><strong>Support:</strong> support@vilo.com</li>
  <li><strong>Address:</strong> [Your Company Address]</li>
</ul>

<hr>

<p><em>By using the Vilo Platform, you agree to comply with this Acceptable Use Policy. Violations may result in account suspension, termination, and legal consequences.</em></p>',
  updated_at = NOW()
WHERE document_type = 'acceptable_use' AND version = '1.0';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Show updated documents
SELECT
  document_type,
  title,
  version,
  is_active,
  LENGTH(content) as content_length,
  updated_at
FROM platform_legal_documents
WHERE version = '1.0'
ORDER BY document_type;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
