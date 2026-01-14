/**
 * Check for duplicate promotion codes
 */

require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const KING_ROOM_ID = 'a174e7b3-b712-4051-b150-8dcd1ef62246';
const PROMO_ID = 'f67f07c6-eb8a-44d4-870f-a4bdb37c1878';

async function checkPromotion() {
  console.log('🔍 Checking promotion details\n');

  // Get the specific promotion
  const { data: promo, error } = await supabase
    .from('room_promotions')
    .select('*')
    .eq('id', PROMO_ID)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📋 Promotion Details:');
  console.log(JSON.stringify(promo, null, 2));
  console.log('\n');

  // Check if there are multiple promotions with same code
  const { data: allPromos } = await supabase
    .from('room_promotions')
    .select('*')
    .eq('code', promo.code);

  console.log(`\n📊 All promotions with code "${promo.code}":`, allPromos?.length || 0);
  if (allPromos && allPromos.length > 1) {
    console.log('\n⚠️ MULTIPLE PROMOTIONS FOUND:');
    allPromos.forEach((p, i) => {
      console.log(`${i + 1}. ID: ${p.id}`);
      console.log(`   Name: ${p.name}`);
      console.log(`   Discount Value: ${p.discount_value}`);
      console.log(`   Room ID: ${p.room_id}`);
      console.log(`   Property ID: ${p.property_id}`);
      console.log(`   Updated: ${p.updated_at}\n`);
    });
  }
}

checkPromotion()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
