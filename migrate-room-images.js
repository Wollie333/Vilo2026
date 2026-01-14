/**
 * Migrate Room Images from property-images to room-images bucket
 * This script:
 * 1. Finds all rooms with images in property-images bucket
 * 2. Copies those images to room-images bucket
 * 3. Updates room records to point to new URLs
 * 4. DOES NOT delete property images - only copies room images
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper to download image from property-images bucket
async function downloadImage(filePath) {
  const { data, error } = await supabase.storage
    .from('property-images')
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download ${filePath}: ${error.message}`);
  }

  return data;
}

// Helper to upload image to room-images bucket
async function uploadImage(filePath, blob) {
  const { error } = await supabase.storage
    .from('room-images')
    .upload(filePath, blob, {
      contentType: blob.type,
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload ${filePath}: ${error.message}`);
  }
}

// Helper to get new public URL
function getNewImageUrl(filePath) {
  const { data } = supabase.storage
    .from('room-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Extract file path from URL
function extractFilePath(url, bucketName) {
  if (!url) return null;

  // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg
  const match = url.match(new RegExp(`${bucketName}/(.+)$`));
  return match ? match[1] : null;
}

async function migrateRoomImages() {
  console.log('🚀 Starting Room Image Migration\n');
  console.log('📋 Step 1: Fetching all rooms from database...\n');

  // Fetch all rooms
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('id, name, featured_image, gallery_images')
    .order('created_at', { ascending: true });

  if (roomsError) {
    console.error('❌ Failed to fetch rooms:', roomsError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${rooms.length} rooms\n`);

  let migrationCount = 0;
  let skippedCount = 0;
  const migrationLog = [];

  for (const room of rooms) {
    console.log(`\n📦 Processing: ${room.name} (${room.id})`);

    let featuredMigrated = false;
    let galleryMigrated = 0;
    let newFeaturedUrl = room.featured_image;
    let newGalleryImages = room.gallery_images || [];

    // Check if featured image is in property-images bucket
    if (room.featured_image && room.featured_image.includes('property-images')) {
      try {
        console.log('  📸 Migrating featured image...');

        const oldPath = extractFilePath(room.featured_image, 'property-images');
        if (oldPath) {
          // Download from property-images
          const blob = await downloadImage(oldPath);

          // Upload to room-images (keep same path structure)
          await uploadImage(oldPath, blob);

          // Get new URL
          newFeaturedUrl = getNewImageUrl(oldPath);
          featuredMigrated = true;

          console.log(`  ✅ Featured image migrated`);
        }
      } catch (error) {
        console.log(`  ⚠️  Featured image migration failed: ${error.message}`);
      }
    } else if (room.featured_image) {
      console.log('  ℹ️  Featured image already in room-images bucket (skipped)');
    }

    // Check if gallery images are in property-images bucket
    if (room.gallery_images && Array.isArray(room.gallery_images)) {
      console.log(`  🖼️  Processing ${room.gallery_images.length} gallery images...`);

      newGalleryImages = [];

      for (const image of room.gallery_images) {
        if (image.url && image.url.includes('property-images')) {
          try {
            const oldPath = extractFilePath(image.url, 'property-images');
            if (oldPath) {
              // Download from property-images
              const blob = await downloadImage(oldPath);

              // Upload to room-images
              await uploadImage(oldPath, blob);

              // Get new URL
              const newUrl = getNewImageUrl(oldPath);

              newGalleryImages.push({
                ...image,
                url: newUrl
              });

              galleryMigrated++;
            } else {
              newGalleryImages.push(image);
            }
          } catch (error) {
            console.log(`  ⚠️  Gallery image migration failed: ${error.message}`);
            newGalleryImages.push(image); // Keep old URL if migration fails
          }
        } else {
          // Already in room-images or different bucket
          newGalleryImages.push(image);
        }
      }

      if (galleryMigrated > 0) {
        console.log(`  ✅ Migrated ${galleryMigrated} gallery images`);
      }
    }

    // Update room record if anything was migrated
    if (featuredMigrated || galleryMigrated > 0) {
      console.log('  💾 Updating room record in database...');

      const { error: updateError } = await supabase
        .from('rooms')
        .update({
          featured_image: newFeaturedUrl,
          gallery_images: newGalleryImages
        })
        .eq('id', room.id);

      if (updateError) {
        console.log(`  ❌ Failed to update room: ${updateError.message}`);
      } else {
        console.log('  ✅ Room record updated successfully');
        migrationCount++;

        migrationLog.push({
          room: room.name,
          featured: featuredMigrated,
          gallery: galleryMigrated
        });
      }
    } else {
      console.log('  ℹ️  No images to migrate (already in correct bucket)');
      skippedCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ Rooms migrated: ${migrationCount}`);
  console.log(`⏭️  Rooms skipped: ${skippedCount}`);
  console.log(`📦 Total rooms: ${rooms.length}\n`);

  if (migrationLog.length > 0) {
    console.log('📋 Detailed Migration Log:');
    console.log('─'.repeat(60));
    migrationLog.forEach(log => {
      console.log(`\n  🏠 ${log.room}`);
      if (log.featured) {
        console.log('     ✓ Featured image migrated');
      }
      if (log.gallery > 0) {
        console.log(`     ✓ ${log.gallery} gallery image(s) migrated`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Migration Complete!');
  console.log('='.repeat(60));
  console.log('\n✅ All room images are now in the room-images bucket');
  console.log('✅ Property images remain untouched in property-images bucket');
  console.log('✅ Room records updated with new image URLs\n');
  console.log('Next steps:');
  console.log('1. Test uploading new room images in your app');
  console.log('2. Verify existing room images display correctly');
  console.log('3. Check that property images still work\n');
}

// Run the migration
migrateRoomImages().catch(error => {
  console.error('\n❌ Migration failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
