#!/usr/bin/env node

/**
 * Check if promotions_with_room_count view exists and returns correct data
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPromoView() {
  console.log('🔍 Checking promotions view and assignments...\n');

  try {
    // Check if view exists by trying to query it
    console.log('1️⃣ Checking if promotions_with_room_count view exists...');
    const { data: viewData, error: viewError } = await supabase
      .from('promotions_with_room_count')
      .select('*')
      .limit(5);

    if (viewError) {
      console.log('❌ View does not exist or has an error:', viewError.message);
      console.log('\n💡 Need to create the view. Checking base table...\n');

      // Check base table instead
      const { data: promos, error: promoError } = await supabase
        .from('room_promotions')
        .select('*')
        .limit(5);

      if (promoError) {
        console.log('❌ Error querying room_promotions:', promoError.message);
        return;
      }

      console.log(`📋 Found ${promos?.length || 0} promotions in base table`);
      if (promos && promos.length > 0) {
        console.log('\nSample promotion:');
        console.log(JSON.stringify(promos[0], null, 2));
      }
    } else {
      console.log('✅ View exists!');
      console.log(`📋 Found ${viewData?.length || 0} promotions\n`);

      if (viewData && viewData.length > 0) {
        console.log('Sample promotions from view:');
        viewData.forEach(promo => {
          console.log(`  - ${promo.code}: room_count = ${promo.room_count || 0}`);
        });
      }
    }

    // Check assignments table
    console.log('\n2️⃣ Checking room_promotion_assignments table...');
    const { data: assignments, error: assignError } = await supabase
      .from('room_promotion_assignments')
      .select('*')
      .limit(10);

    if (assignError) {
      console.log('❌ Error querying assignments:', assignError.message);
    } else {
      console.log(`📋 Found ${assignments?.length || 0} promotion assignments`);
      if (assignments && assignments.length > 0) {
        console.log('\nSample assignments:');
        assignments.slice(0, 5).forEach(assign => {
          console.log(`  - Promotion ${assign.promotion_id} → Room ${assign.room_id}`);
        });
      }
    }

    // Manual count for comparison
    console.log('\n3️⃣ Manual count per promotion...');
    const { data: promos } = await supabase
      .from('room_promotions')
      .select('id, code')
      .limit(5);

    if (promos && promos.length > 0) {
      for (const promo of promos) {
        const { count } = await supabase
          .from('room_promotion_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('promotion_id', promo.id);

        console.log(`  - ${promo.code}: ${count || 0} rooms`);
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkPromoView();
