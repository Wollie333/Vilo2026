/**
 * Seed default cancellation policies if they don't exist
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultPolicies = [
  {
    name: 'Flexible',
    description: 'Full refund up to 24 hours before check-in. No refund for cancellations made within 24 hours of check-in.',
    tiers: [
      { days: 1, refund: 100 },
      { days: 0, refund: 0 }
    ],
    is_default: false,
    is_active: true,
    is_custom: false,
    sort_order: 1
  },
  {
    name: 'Moderate',
    description: 'Full refund for cancellations made at least 5 days before check-in. 50% refund for cancellations made 1-5 days before check-in. No refund for cancellations made within 24 hours of check-in.',
    tiers: [
      { days: 5, refund: 100 },
      { days: 1, refund: 50 },
      { days: 0, refund: 0 }
    ],
    is_default: true, // This is the default
    is_active: true,
    is_custom: false,
    sort_order: 2
  },
  {
    name: 'Strict',
    description: 'Full refund for cancellations made at least 14 days before check-in. 50% refund for cancellations made 7-14 days before check-in. No refund for cancellations made within 7 days of check-in.',
    tiers: [
      { days: 14, refund: 100 },
      { days: 7, refund: 50 },
      { days: 0, refund: 0 }
    ],
    is_default: false,
    is_active: true,
    is_custom: false,
    sort_order: 3
  },
  {
    name: 'Non-refundable',
    description: 'No refunds for cancellations at any time. This rate offers the lowest price but no flexibility.',
    tiers: [
      { days: 365, refund: 0 }
    ],
    is_default: false,
    is_active: true,
    is_custom: false,
    sort_order: 4
  }
];

async function seedDefaultPolicies() {
  try {
    console.log('🌱 Seeding default cancellation policies...\n');

    // Check existing policies
    const { data: existing, error: fetchError } = await supabase
      .from('cancellation_policies')
      .select('name, id');

    if (fetchError) {
      console.error('❌ Error fetching existing policies:', fetchError);
      return;
    }

    const existingNames = new Set((existing || []).map(p => p.name.toLowerCase()));

    console.log(`📊 Found ${existing?.length || 0} existing policies\n`);

    let inserted = 0;
    let skipped = 0;

    for (const policy of defaultPolicies) {
      if (existingNames.has(policy.name.toLowerCase())) {
        console.log(`⏭️  Skipping "${policy.name}" (already exists)`);
        skipped++;
        continue;
      }

      console.log(`✨ Creating "${policy.name}"...`);
      const { data, error } = await supabase
        .from('cancellation_policies')
        .insert(policy)
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Failed:`, error.message);
      } else {
        console.log(`   ✅ Created successfully!`);
        console.log(`   ID: ${data.id}`);
        inserted++;
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Policies created: ${inserted}`);
    console.log(`Policies skipped: ${skipped}`);
    console.log(`Total policies: ${(existing?.length || 0) + inserted}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (inserted > 0) {
      console.log('🎉 Default cancellation policies have been seeded!');
      console.log('📝 Property owners can now choose from these policies when creating/editing properties.\n');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

seedDefaultPolicies();
