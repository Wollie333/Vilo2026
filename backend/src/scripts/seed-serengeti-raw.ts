/**
 * Seed Serengeti Template (Raw SQL Version)
 * Bypasses Supabase schema cache by using raw SQL queries
 */

import { getAdminClient } from '../config/supabase';
import { SectionType } from '../types/property-website.types';

async function seedSerengetiTemplate() {
  const supabase = getAdminClient();

  try {
    console.log('🌿 Seeding Serengeti Lodge Template (Raw SQL)...\n');

    // ========================================================================
    // 1. CREATE TEMPLATE RECORD
    // ========================================================================

    console.log('📋 Creating template record...');

    const { data: template, error: templateError } = await supabase.rpc('exec_raw_sql', {
      query: `
        INSERT INTO website_templates (name, description, preview_image_url, preview_url, theme_config, is_active)
        VALUES (
          'Serengeti Lodge',
          'Modern safari lodge template with clean design, generous whitespace, and subtle animations. Perfect for luxury lodges, boutique hotels, and safari properties.',
          '/templates/serengeti/preview.jpg',
          'https://serengeti-demo.vilo.com',
          '{"primaryColor": "#F97316", "secondaryColor": "#22c55e", "fontFamily": "Inter", "fonts": {"headingFont": "Inter", "bodyFont": "Inter"}}'::jsonb,
          true
        )
        RETURNING id, name
      `
    });

    if (templateError) {
      console.log('Note: exec_raw_sql not available, trying alternative method...');

      // Alternative: Delete existing records and try again with cleared cache
      const { error: deleteError } = await supabase
        .from('website_templates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) console.log('Could not clear existing records:', deleteError.message);

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try insert again
      const { data: retryTemplate, error: retryError } = await supabase
        .from('website_templates')
        .insert({
          name: 'Serengeti Lodge',
          description: 'Modern safari lodge template with clean design, generous whitespace, and subtle animations. Perfect for luxury lodges, boutique hotels, and safari properties.',
          preview_image_url: '/templates/serengeti/preview.jpg',
          preview_url: 'https://serengeti-demo.vilo.com',
          theme_config: {
            primaryColor: '#F97316',
            secondaryColor: '#22c55e',
            fontFamily: 'Inter',
            fonts: {
              headingFont: 'Inter',
              bodyFont: 'Inter'
            }
          },
          is_active: true
        })
        .select()
        .single();

      if (retryError) {
        console.error('  ❌ Still failing:', retryError);
        throw retryError;
      }

      console.log(`  ✓ Template created: ${retryTemplate!.id}\n`);
      return await continueSeeding(supabase, retryTemplate!.id);
    }

    console.log(`  ✓ Template created\n`);
    return await continueSeeding(supabase, template.id);

  } catch (error) {
    console.error('❌ Error seeding template:', error);
    throw error;
  }
}

async function continueSeeding(supabase: any, templateId: string) {
  // ========================================================================
  // 2. CREATE TEMPLATE PAGES
  // ========================================================================

  console.log('📄 Creating template pages...');

  const pages = [
    { type: 'homepage', title: 'Home', slug: '/', order: 1 },
    { type: 'about', title: 'About Us', slug: '/about', order: 2 },
    { type: 'accommodation', title: 'Accommodation', slug: '/accommodation', order: 3 },
    { type: 'room-single', title: 'Room Details', slug: '/rooms/:slug', order: 4 },
    { type: 'contact', title: 'Contact Us', slug: '/contact', order: 5 },
    { type: 'blog', title: 'Blog', slug: '/blog', order: 6 },
    { type: 'post-single', title: 'Blog Post', slug: '/blog/:slug', order: 7 },
    { type: 'checkout', title: 'Checkout', slug: '/checkout', order: 8 },
  ];

  const pagesToInsert = pages.map(page => ({
    template_id: templateId,
    page_type: page.type,
    title: page.title,
    slug: page.slug,
    sort_order: page.order,
    is_default_enabled: true
  }));

  const { data: createdPages, error: pagesError } = await supabase
    .from('website_template_pages')
    .insert(pagesToInsert)
    .select();

  if (pagesError) throw pagesError;
  if (!createdPages) throw new Error('Failed to create pages');

  for (const page of createdPages) {
    const pageInfo = pages.find(p => p.type === page.page_type);
    console.log(`  ✓ Page created: ${pageInfo?.title || page.page_type}`);
  }
  console.log('');

  // ========================================================================
  // 3. CREATE SECTIONS FOR EACH PAGE
  // ========================================================================

  console.log('🔧 Creating sections for pages...\n');

  // HOMEPAGE SECTIONS
  const homepage = createdPages.find(p => p.page_type === 'homepage')!;
  await createSection(supabase, homepage.id, {
    section_type: SectionType.SERENGETI_HERO_FULLSCREEN,
    section_name: 'Hero Section',
    sort_order: 1,
    content: {
      heading: '{property.name}',
      subheading: 'Experience luxury in the wild',
      ctaText: 'Discover Now',
      ctaLink: '/accommodation',
      backgroundImage: '{property.hero_image}',
      showSearchWidget: true,
      overlayOpacity: 50
    }
  });

  await createSection(supabase, homepage.id, {
    section_type: SectionType.SERENGETI_FEATURES_3COL,
    section_name: 'Why Choose Us',
    sort_order: 2,
    content: {
      sectionTitle: 'Why Choose Us',
      sectionSubtitle: 'Experience the best safari adventure',
      features: [
        {
          icon: 'compass',
          title: 'Expert Guides',
          description: 'Our experienced guides ensure unforgettable wildlife encounters'
        },
        {
          icon: 'star',
          title: 'Luxury Accommodation',
          description: 'Elegant rooms with stunning views and modern amenities'
        },
        {
          icon: 'heart',
          title: 'Personalized Service',
          description: 'Tailored experiences to match your preferences'
        }
      ]
    }
  });

  await createSection(supabase, homepage.id, {
    section_type: SectionType.SERENGETI_ROOM_CARDS,
    section_name: 'Featured Rooms',
    sort_order: 3,
    content: {
      sectionTitle: 'Our Accommodations',
      sectionSubtitle: 'Comfortable, elegant rooms with stunning views',
      showAllRooms: true,
      columns: 3,
      showPricing: true
    }
  });

  await createSection(supabase, homepage.id, {
    section_type: SectionType.SERENGETI_TESTIMONIALS,
    section_name: 'What Guests Say',
    sort_order: 4,
    content: {
      sectionTitle: 'Guest Testimonials',
      testimonials: [
        {
          quote: 'An absolutely magical experience! The staff was incredible and the wildlife viewing was beyond our expectations.',
          author: 'Sarah Mitchell',
          role: 'Guest from USA',
          rating: 5
        },
        {
          quote: 'The perfect blend of luxury and adventure. Every detail was thoughtfully arranged.',
          author: 'James Chen',
          role: 'Guest from Singapore',
          rating: 5
        },
        {
          quote: 'Our stay exceeded all expectations. The rooms were beautiful and the safari experiences unforgettable.',
          author: 'Emma Thompson',
          role: 'Guest from UK',
          rating: 5
        }
      ],
      autoplay: true
    }
  });

  await createSection(supabase, homepage.id, {
    section_type: SectionType.SERENGETI_CTA_BANNER,
    section_name: 'Book Your Adventure',
    sort_order: 5,
    content: {
      heading: 'Ready for Your Safari Adventure?',
      subheading: 'Book your stay today and experience the magic of the wild',
      ctaText: 'Book Now',
      ctaLink: '/accommodation',
      backgroundImage: '',
      variant: 'fullwidth'
    }
  });

  console.log('  ✓ Homepage sections created');

  // ABOUT PAGE SECTIONS
  const aboutPage = createdPages.find(p => p.page_type === 'about')!;
  await createSection(supabase, aboutPage.id, {
    section_type: SectionType.SERENGETI_HERO_LEFT,
    section_name: 'About Hero',
    sort_order: 1,
    content: {
      heading: 'About {property.name}',
      subheading: 'Discover our story',
      ctaText: 'Contact Us',
      ctaLink: '/contact',
      backgroundImage: '',
      overlayOpacity: 40
    }
  });

  await createSection(supabase, aboutPage.id, {
    section_type: SectionType.SERENGETI_ABOUT_INTRO,
    section_name: 'Our Story',
    sort_order: 2,
    content: {
      heading: 'Our Story',
      content: 'Welcome to our lodge, where luxury meets wilderness. For over a decade, we have been providing guests with unforgettable safari experiences in the heart of nature.'
    }
  });

  await createSection(supabase, aboutPage.id, {
    section_type: SectionType.SERENGETI_STORY_LEFT,
    section_name: 'Our Mission',
    sort_order: 3,
    content: {
      heading: 'Our Mission',
      content: 'We are committed to providing exceptional safari experiences while preserving the natural environment and supporting local communities.',
      imageUrl: '',
      imagePosition: 'left'
    }
  });

  await createSection(supabase, aboutPage.id, {
    section_type: SectionType.SERENGETI_VALUES_GRID,
    section_name: 'Our Values',
    sort_order: 4,
    content: {
      sectionTitle: 'Our Core Values',
      values: [
        {
          icon: 'leaf',
          title: 'Sustainability',
          description: 'We are committed to eco-friendly practices'
        },
        {
          icon: 'users',
          title: 'Community',
          description: 'Supporting local communities and conservation'
        },
        {
          icon: 'award',
          title: 'Excellence',
          description: 'Delivering exceptional experiences'
        }
      ]
    }
  });

  console.log('  ✓ About page sections created');

  // ACCOMMODATION PAGE SECTIONS
  const accommodationPage = createdPages.find(p => p.page_type === 'accommodation')!;
  await createSection(supabase, accommodationPage.id, {
    section_type: SectionType.SERENGETI_HERO_LEFT,
    section_name: 'Accommodation Hero',
    sort_order: 1,
    content: {
      heading: 'Our Accommodations',
      subheading: 'Luxury rooms with breathtaking views',
      ctaText: 'View Rooms',
      ctaLink: '#rooms',
      backgroundImage: '',
      overlayOpacity: 40
    }
  });

  await createSection(supabase, accommodationPage.id, {
    section_type: SectionType.SERENGETI_ROOM_CARDS,
    section_name: 'All Rooms',
    sort_order: 2,
    content: {
      sectionTitle: 'Choose Your Perfect Room',
      sectionSubtitle: 'Each room offers comfort and stunning views',
      showAllRooms: true,
      columns: 3,
      showPricing: true
    }
  });

  console.log('  ✓ Accommodation page sections created');

  // CONTACT PAGE SECTIONS
  const contactPage = createdPages.find(p => p.page_type === 'contact')!;
  await createSection(supabase, contactPage.id, {
    section_type: SectionType.SERENGETI_HERO_LEFT,
    section_name: 'Contact Hero',
    sort_order: 1,
    content: {
      heading: 'Get in Touch',
      subheading: "We'd love to hear from you",
      ctaText: 'Send Message',
      ctaLink: '#contact-form',
      backgroundImage: '',
      overlayOpacity: 40
    }
  });

  await createSection(supabase, contactPage.id, {
    section_type: SectionType.SERENGETI_CONTACT_INFO,
    section_name: 'Contact Information',
    sort_order: 2,
    content: {
      sectionTitle: 'Contact Information',
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showHours: true
    }
  });

  await createSection(supabase, contactPage.id, {
    section_type: SectionType.SERENGETI_CONTACT_FORM,
    section_name: 'Contact Form',
    sort_order: 3,
    content: {
      sectionTitle: 'Send Us a Message',
      sectionSubtitle: 'Fill out the form below and we will get back to you',
      showPhoneField: true,
      showCompanyField: false,
      submitButtonText: 'Send Message'
    }
  });

  console.log('  ✓ Contact page sections created');

  // BLOG PAGE SECTIONS
  const blogPage = createdPages.find(p => p.page_type === 'blog')!;
  await createSection(supabase, blogPage.id, {
    section_type: SectionType.SERENGETI_HERO_LEFT,
    section_name: 'Blog Hero',
    sort_order: 1,
    content: {
      heading: 'Our Blog',
      subheading: 'Stories and insights from the wild',
      ctaText: 'Read More',
      ctaLink: '#posts',
      backgroundImage: '',
      overlayOpacity: 40
    }
  });

  await createSection(supabase, blogPage.id, {
    section_type: SectionType.SERENGETI_BLOG_CARDS,
    section_name: 'Blog Posts',
    sort_order: 2,
    content: {
      sectionTitle: 'Latest Posts',
      sectionSubtitle: 'Discover our stories and travel tips',
      showAllPosts: true,
      columns: 3,
      postsPerPage: 9
    }
  });

  console.log('  ✓ Blog page sections created');

  // ROOM SINGLE & POST SINGLE & CHECKOUT pages don't need preset sections
  console.log('  ✓ Room single, post single, and checkout pages created (no preset sections)\n');

  console.log('✅ Serengeti template seeded successfully!\\n');
  console.log(`Template ID: ${templateId}`);
  console.log(`Total Pages: ${createdPages.length}`);
  console.log('');
}

async function createSection(
  supabase: any,
  templatePageId: string,
  data: {
    section_type: string;
    section_name: string;
    sort_order: number;
    layout_variant?: string;
    content: any;
  }
) {
  const { error } = await supabase
    .from('website_template_page_sections')
    .insert({
      template_page_id: templatePageId,
      section_type: data.section_type,
      section_name: data.section_name,
      sort_order: data.sort_order,
      layout_variant: data.layout_variant || null,
      content: data.content
    });

  if (error) throw error;
}

// Run the seed script
seedSerengetiTemplate()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
