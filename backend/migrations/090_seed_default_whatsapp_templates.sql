-- Migration: 090_seed_default_whatsapp_templates.sql
-- Description: Seed default WhatsApp message templates with system variables
-- Date: 2026-01-15

-- ============================================================================
-- SEED DEFAULT WHATSAPP TEMPLATES
-- ============================================================================

-- These are global templates (property_id = NULL) that serve as starting points
-- Users can edit these templates or create property-specific overrides

-- Delete existing global templates to ensure clean slate (idempotent migration)
DELETE FROM whatsapp_message_templates WHERE property_id IS NULL;

-- ============================================================================
-- 1. BOOKING CONFIRMATION TEMPLATES (English Only by Default)
-- ============================================================================

INSERT INTO whatsapp_message_templates (
  property_id,
  template_type,
  template_name,
  language_code,
  header_text,
  body_template,
  footer_text,
  meta_status,
  is_enabled,
  send_timing_days_before,
  send_timing_hours_before
) VALUES
-- English - Booking Confirmation
(
  NULL,
  'booking_confirmation',
  'booking_confirmation_en',
  'en',
  'Booking Confirmed',
  E'Hi {{guest_name}}! 👋\n\nYour booking has been confirmed!\n\n📋 Booking Reference: {{booking_reference}}\n🏨 Property: {{property_name}}\n📅 Check-in: {{check_in_date}} at {{check_in_time}}\n📅 Check-out: {{check_out_date}} at {{check_out_time}}\n👥 Guests: {{num_guests}}\n🛏️ Rooms: {{room_names}}\n🌙 Nights: {{total_nights}}\n\n💰 Total Amount: {{total_amount}}\n💳 Amount Paid: {{amount_paid}}\n💵 Balance Due: {{balance_due}}\n\n📍 Address: {{property_address}}\n\n🔗 View Booking: {{booking_url}}\n\nWe look forward to hosting you!',
  'Powered by Vilo',
  'draft',
  true,
  NULL,
  NULL
);

-- ============================================================================
-- 2. PAYMENT RECEIVED TEMPLATES (English Only by Default)
-- ============================================================================

INSERT INTO whatsapp_message_templates (
  property_id,
  template_type,
  template_name,
  language_code,
  header_text,
  body_template,
  footer_text,
  meta_status,
  is_enabled,
  send_timing_days_before,
  send_timing_hours_before
) VALUES
-- English - Payment Received
(
  NULL,
  'payment_received',
  'payment_received_en',
  'en',
  'Payment Received',
  E'Hi {{guest_name}}! 💳\n\nWe have received your payment.\n\n📋 Booking: {{booking_reference}}\n🏨 Property: {{property_name}}\n\n💰 Payment Details:\n💵 Amount Received: {{amount_paid}}\n💸 Total Amount: {{total_amount}}\n💵 Balance Remaining: {{balance_due}}\n💳 Payment Method: {{payment_method}}\n\n📅 Check-in: {{check_in_date}}\n📅 Check-out: {{check_out_date}}\n\n🧾 View Invoice: {{invoice_url}}\n🔗 View Booking: {{booking_url}}\n\nThank you for your payment!',
  'Powered by Vilo',
  'draft',
  true,
  NULL,
  NULL
);

-- ============================================================================
-- 3. PAYMENT REMINDER TEMPLATES (English Only by Default)
-- ============================================================================

INSERT INTO whatsapp_message_templates (
  property_id,
  template_type,
  template_name,
  language_code,
  header_text,
  body_template,
  footer_text,
  meta_status,
  is_enabled,
  send_timing_days_before,
  send_timing_hours_before
) VALUES
-- English - Payment Reminder
(
  NULL,
  'payment_reminder',
  'payment_reminder_en',
  'en',
  'Payment Reminder',
  E'Hi {{guest_name}}! 💰\n\nFriendly reminder about your upcoming stay.\n\n📋 Booking: {{booking_reference}}\n🏨 Property: {{property_name}}\n📅 Check-in: {{check_in_date}}\n\n💵 Payment Summary:\n💸 Total Amount: {{total_amount}}\n💳 Amount Paid: {{amount_paid}}\n❗ Balance Due: {{balance_due}}\n\nPlease complete your payment before check-in.\n\n💳 Pay Now: {{payment_url}}\n🔗 View Booking: {{booking_url}}\n\nNeed help? Contact us at {{property_phone}} or {{property_email}}',
  'Powered by Vilo',
  'draft',
  true,
  7,
  NULL
);

-- ============================================================================
-- 4. PRE-ARRIVAL TEMPLATES (English Only by Default)
-- ============================================================================

INSERT INTO whatsapp_message_templates (
  property_id,
  template_type,
  template_name,
  language_code,
  header_text,
  body_template,
  footer_text,
  meta_status,
  is_enabled,
  send_timing_days_before,
  send_timing_hours_before
) VALUES
-- English - Pre-Arrival
(
  NULL,
  'pre_arrival',
  'pre_arrival_en',
  'en',
  'Your Stay is Coming Up!',
  E'Hi {{guest_name}}! 🎉\n\nWe''re excited to welcome you soon!\n\n📋 Booking: {{booking_reference}}\n🏨 Property: {{property_name}}\n📍 Address: {{property_address}}\n\n📅 Check-in Information:\n🕐 Date: {{check_in_date}}\n⏰ Time: {{check_in_time}}\n🛏️ Rooms: {{room_names}}\n👥 Guests: {{num_guests}}\n\n🔑 Check-in Instructions:\n1. Arrive at {{property_address}}\n2. Check-in time starts at {{check_in_time}}\n3. Contact us if you need early check-in\n\n📞 Contact: {{property_phone}}\n📧 Email: {{property_email}}\n🔗 View Booking: {{booking_url}}\n\nSafe travels and see you soon!',
  'Powered by Vilo',
  'draft',
  true,
  2,
  NULL
);

-- ============================================================================
-- REMOVE OLD MULTI-LANGUAGE TEMPLATES BELOW (KEPT FOR REFERENCE)
-- Users can manually add other languages as needed
-- ============================================================================

/*
-- ============================================================================
-- MULTI-LANGUAGE TEMPLATES (COMMENTED OUT - English only by default)
-- ============================================================================

-- German - Booking Confirmation
(
  NULL,
  'booking_confirmation',
  'booking_confirmation_de',
  'de',
  'Buchung Bestätigt',
  E'Hallo {{guest_name}}! 👋\n\nIhre Buchung wurde bestätigt!\n\n📋 Buchungsreferenz: {{booking_reference}}\n🏨 Unterkunft: {{property_name}}\n📅 Check-in: {{check_in_date}} um {{check_in_time}}\n📅 Check-out: {{check_out_date}} um {{check_out_time}}\n👥 Gäste: {{num_guests}}\n🛏️ Zimmer: {{room_names}}\n🌙 Nächte: {{total_nights}}\n\n💰 Gesamtbetrag: {{total_amount}}\n💳 Bezahlt: {{amount_paid}}\n💵 Restbetrag: {{balance_due}}\n\n📍 Adresse: {{property_address}}\n\n🔗 Buchung ansehen: {{booking_url}}\n\nWir freuen uns auf Ihren Besuch!',
  'Powered by Vilo',
  'draft',
  true,
  NULL,
  NULL
),

-- French - Booking Confirmation
(
  NULL,
  'booking_confirmation',
  'booking_confirmation_fr',
  'fr',
  'Réservation Confirmée',
  E'Bonjour {{guest_name}}! 👋\n\nVotre réservation a été confirmée!\n\n📋 Référence: {{booking_reference}}\n🏨 Propriété: {{property_name}}\n📅 Arrivée: {{check_in_date}} à {{check_in_time}}\n📅 Départ: {{check_out_date}} à {{check_out_time}}\n👥 Invités: {{num_guests}}\n🛏️ Chambres: {{room_names}}\n🌙 Nuits: {{total_nights}}\n\n💰 Montant Total: {{total_amount}}\n💳 Montant Payé: {{amount_paid}}\n💵 Solde Dû: {{balance_due}}\n\n📍 Adresse: {{property_address}}\n\n🔗 Voir la Réservation: {{booking_url}}\n\nNous sommes impatients de vous accueillir!',
  'Powered by Vilo',
  'draft',
  true,
  NULL,
  NULL
),

-- German - Payment Received
(
  NULL,
  'payment_received',
  'payment_received_de',
  'de',
  'Zahlung Erhalten',
  E'Hallo {{guest_name}}! 💳\n\nWir haben Ihre Zahlung erhalten.\n\n📋 Buchung: {{booking_reference}}\n🏨 Unterkunft: {{property_name}}\n\n💰 Zahlungsdetails:\n💵 Erhaltener Betrag: {{amount_paid}}\n💸 Gesamtbetrag: {{total_amount}}\n💵 Restbetrag: {{balance_due}}\n💳 Zahlungsmethode: {{payment_method}}\n\n📅 Check-in: {{check_in_date}}\n📅 Check-out: {{check_out_date}}\n\n🧾 Rechnung ansehen: {{invoice_url}}\n🔗 Buchung ansehen: {{booking_url}}\n\nVielen Dank für Ihre Zahlung!',
  'Powered by Vilo',
  'draft',
  true,
  NULL,
  NULL
),

-- French - Payment Received
(
  NULL,
  'payment_received',
  'payment_received_fr',
  'fr',
  'Paiement Reçu',
  E'Bonjour {{guest_name}}! 💳\n\nNous avons reçu votre paiement.\n\n📋 Réservation: {{booking_reference}}\n🏨 Propriété: {{property_name}}\n\n💰 Détails du Paiement:\n💵 Montant Reçu: {{amount_paid}}\n💸 Montant Total: {{total_amount}}\n💵 Solde Restant: {{balance_due}}\n💳 Mode de Paiement: {{payment_method}}\n\n📅 Arrivée: {{check_in_date}}\n📅 Départ: {{check_out_date}}\n\n🧾 Voir la Facture: {{invoice_url}}\n🔗 Voir la Réservation: {{booking_url}}\n\nMerci pour votre paiement!',
  'Powered by Vilo',
  'draft',
  true,
  NULL,
  NULL
),

-- German - Payment Reminder
(
  NULL,
  'payment_reminder',
  'payment_reminder_de',
  'de',
  'Zahlungserinnerung',
  E'Hallo {{guest_name}}! 💰\n\nFreundliche Erinnerung an Ihren bevorstehenden Aufenthalt.\n\n📋 Buchung: {{booking_reference}}\n🏨 Unterkunft: {{property_name}}\n📅 Check-in: {{check_in_date}}\n\n💵 Zahlungsübersicht:\n💸 Gesamtbetrag: {{total_amount}}\n💳 Bezahlt: {{amount_paid}}\n❗ Restbetrag: {{balance_due}}\n\nBitte schließen Sie Ihre Zahlung vor dem Check-in ab.\n\n💳 Jetzt bezahlen: {{payment_url}}\n🔗 Buchung ansehen: {{booking_url}}\n\nBrauchen Sie Hilfe? Kontaktieren Sie uns unter {{property_phone}} oder {{property_email}}',
  'Powered by Vilo',
  'draft',
  true,
  7,
  NULL
),

-- French - Payment Reminder
(
  NULL,
  'payment_reminder',
  'payment_reminder_fr',
  'fr',
  'Rappel de Paiement',
  E'Bonjour {{guest_name}}! 💰\n\nRappel amical concernant votre séjour à venir.\n\n📋 Réservation: {{booking_reference}}\n🏨 Propriété: {{property_name}}\n📅 Arrivée: {{check_in_date}}\n\n💵 Résumé du Paiement:\n💸 Montant Total: {{total_amount}}\n💳 Montant Payé: {{amount_paid}}\n❗ Solde Dû: {{balance_due}}\n\nVeuillez finaliser votre paiement avant l\'arrivée.\n\n💳 Payer Maintenant: {{payment_url}}\n🔗 Voir la Réservation: {{booking_url}}\n\nBesoin d\'aide? Contactez-nous au {{property_phone}} ou {{property_email}}',
  'Powered by Vilo',
  'draft',
  true,
  7,
  NULL
),

-- German - Pre-Arrival
(
  NULL,
  'pre_arrival',
  'pre_arrival_de',
  'de',
  'Ihr Aufenthalt Steht Bevor!',
  E'Hallo {{guest_name}}! 🎉\n\nWir freuen uns, Sie bald willkommen zu heißen!\n\n📋 Buchung: {{booking_reference}}\n🏨 Unterkunft: {{property_name}}\n📍 Adresse: {{property_address}}\n\n📅 Check-in Informationen:\n🕐 Datum: {{check_in_date}}\n⏰ Uhrzeit: {{check_in_time}}\n🛏️ Zimmer: {{room_names}}\n👥 Gäste: {{num_guests}}\n\n🔑 Check-in Anleitung:\n1. Ankunft bei {{property_address}}\n2. Check-in beginnt um {{check_in_time}}\n3. Kontaktieren Sie uns für frühen Check-in\n\n📞 Kontakt: {{property_phone}}\n📧 E-Mail: {{property_email}}\n🔗 Buchung ansehen: {{booking_url}}\n\nGute Reise und bis bald!',
  'Powered by Vilo',
  'draft',
  true,
  2,
  NULL
),

-- French - Pre-Arrival
(
  NULL,
  'pre_arrival',
  'pre_arrival_fr',
  'fr',
  'Votre Séjour Approche!',
  E'Bonjour {{guest_name}}! 🎉\n\nNous sommes ravis de vous accueillir bientôt!\n\n📋 Réservation: {{booking_reference}}\n🏨 Propriété: {{property_name}}\n📍 Adresse: {{property_address}}\n\n📅 Informations d''Arrivée:\n🕐 Date: {{check_in_date}}\n⏰ Heure: {{check_in_time}}\n🛏️ Chambres: {{room_names}}\n👥 Invités: {{num_guests}}\n\n🔑 Instructions d''Arrivée:\n1. Arrivez à {{property_address}}\n2. Enregistrement à partir de {{check_in_time}}\n3. Contactez-nous pour un enregistrement anticipé\n\n📞 Contact: {{property_phone}}\n📧 Email: {{property_email}}\n🔗 Voir la Réservation: {{booking_url}}\n\nBon voyage et à bientôt!',
  'Powered by Vilo',
  'draft',
  true,
  2,
  NULL
);
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify templates were created
SELECT
  template_type,
  language_code,
  template_name,
  is_enabled,
  meta_status
FROM whatsapp_message_templates
WHERE property_id IS NULL
ORDER BY template_type, language_code;
