/**
 * Permissions Guide Tab
 *
 * Comprehensive documentation of all 131 permissions organized by category.
 * Explains what each permission does, when to use it, and provides examples.
 */

import React, { useState } from 'react';
import { Card, Badge, Input } from '@/components/ui';

// Permission documentation structure
interface PermissionDoc {
  action: string;
  description: string;
  details: string;
  examples: string[];
}

interface CategoryDoc {
  id: string;
  name: string;
  description: string;
  color: string;
  resources: {
    resource: string;
    displayName: string;
    overview: string;
    permissions: PermissionDoc[];
  }[];
}

// Comprehensive permissions documentation
const PERMISSIONS_DOCUMENTATION: CategoryDoc[] = [
  {
    id: 'property_management',
    name: 'Property Management',
    description: 'Manage properties, rooms, and add-ons for your vacation rental business',
    color: 'blue',
    resources: [
      {
        resource: 'properties',
        displayName: 'Properties',
        overview: 'Properties are the main listings in your vacation rental platform. Each property represents a unique accommodation (e.g., hotel, guesthouse, apartment complex).',
        permissions: [
          {
            action: 'create',
            description: 'Create new properties',
            details: 'Allows users to add new property listings to the platform. This includes entering property details, location, amenities, and initial configuration.',
            examples: [
              'Property owners adding their first listing',
              'Team members creating properties on behalf of clients',
              'SaaS admins setting up demo properties',
            ],
          },
          {
            action: 'read',
            description: 'View properties',
            details: 'Grants access to view property listings, details, and basic information. Does not allow modifications.',
            examples: [
              'Guest browsing available properties',
              'Team members viewing assigned properties',
              'Reports that need property data',
            ],
          },
          {
            action: 'update',
            description: 'Update property details',
            details: 'Enables editing of property information such as name, description, amenities, photos, and basic settings. Does not include advanced configuration.',
            examples: [
              'Updating property descriptions',
              'Adding new photos to listings',
              'Changing property contact information',
            ],
          },
          {
            action: 'delete',
            description: 'Delete properties',
            details: 'Allows permanent removal of property listings. Should be restricted as this action cannot be undone and affects all associated data (rooms, bookings).',
            examples: [
              'Property owners removing closed locations',
              'Admins cleaning up test properties',
              'Removing duplicate listings',
            ],
          },
          {
            action: 'manage',
            description: 'Full property management including settings and configuration',
            details: 'Grants complete control over all property aspects including advanced settings, payment configuration, cancellation policies, and team management.',
            examples: [
              'Property owners managing their listings',
              'Senior team members with full access',
              'Setting up payment rules and policies',
            ],
          },
        ],
      },
      {
        resource: 'rooms',
        displayName: 'Rooms',
        overview: 'Rooms are individual accommodation units within a property (e.g., Standard Room, Deluxe Suite, Apartment 3B). Each room can have its own pricing, availability, and amenities.',
        permissions: [
          {
            action: 'create',
            description: 'Create new rooms',
            details: 'Allows adding new room types or units to a property. Includes setting up room details, bed configurations, and base pricing.',
            examples: [
              'Adding a new room type to a hotel',
              'Creating individual apartment units',
              'Setting up seasonal accommodation options',
            ],
          },
          {
            action: 'read',
            description: 'View rooms',
            details: 'Grants access to view room listings, availability calendars, and pricing information.',
            examples: [
              'Guests viewing available rooms',
              'Front desk staff checking room status',
              'Reports showing room occupancy',
            ],
          },
          {
            action: 'update',
            description: 'Update room details',
            details: 'Enables editing room information including descriptions, photos, amenities, and standard pricing.',
            examples: [
              'Updating room descriptions and photos',
              'Changing room amenities',
              'Adjusting base room prices',
            ],
          },
          {
            action: 'delete',
            description: 'Delete rooms',
            details: 'Allows removal of room listings. Use with caution as this affects availability and existing bookings.',
            examples: [
              'Removing discontinued room types',
              'Deleting test rooms',
              'Consolidating duplicate rooms',
            ],
          },
          {
            action: 'manage',
            description: 'Full room management including rates and inventory',
            details: 'Complete control over all room aspects including advanced pricing (seasonal rates, dynamic pricing), inventory management, and availability rules.',
            examples: [
              'Setting up complex pricing strategies',
              'Managing room allocation rules',
              'Configuring seasonal rate periods',
            ],
          },
        ],
      },
      {
        resource: 'addons',
        displayName: 'Add-ons',
        overview: 'Add-ons are optional extras that guests can purchase with their booking (e.g., breakfast, airport transfer, spa package, late checkout).',
        permissions: [
          {
            action: 'create',
            description: 'Create add-ons',
            details: 'Allows creating new optional extras and services that can be added to bookings.',
            examples: [
              'Adding breakfast packages',
              'Creating airport transfer services',
              'Setting up spa treatments',
            ],
          },
          {
            action: 'read',
            description: 'View add-ons',
            details: 'Grants access to view available add-ons and their pricing.',
            examples: [
              'Guests browsing available extras',
              'Staff viewing service options',
              'Reports on popular add-ons',
            ],
          },
          {
            action: 'update',
            description: 'Update add-ons',
            details: 'Enables editing add-on details, descriptions, and pricing.',
            examples: [
              'Updating add-on prices',
              'Changing service descriptions',
              'Modifying availability',
            ],
          },
          {
            action: 'delete',
            description: 'Delete add-ons',
            details: 'Allows removal of add-on services.',
            examples: [
              'Removing discontinued services',
              'Deleting seasonal add-ons',
              'Cleaning up test entries',
            ],
          },
          {
            action: 'manage',
            description: 'Full add-on management',
            details: 'Complete control over add-on configuration including pricing strategies, availability rules, and dependencies.',
            examples: [
              'Setting up complex pricing for add-ons',
              'Configuring add-on bundles',
              'Managing seasonal service availability',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'booking_operations',
    name: 'Booking Operations',
    description: 'Manage bookings, checkout processes, and guest information',
    color: 'green',
    resources: [
      {
        resource: 'bookings',
        displayName: 'Bookings',
        overview: 'Bookings represent confirmed reservations made by guests. They include check-in/out dates, room assignments, pricing, payment status, and guest information.',
        permissions: [
          {
            action: 'create',
            description: 'Create bookings',
            details: 'Allows creating new reservations manually. Useful for phone bookings, walk-ins, or internal reservations.',
            examples: [
              'Front desk creating walk-in bookings',
              'Creating reservations from phone calls',
              'Manual group bookings',
            ],
          },
          {
            action: 'read',
            description: 'View bookings',
            details: 'Grants access to view booking details, guest information, and reservation status.',
            examples: [
              'Property owners viewing their bookings',
              'Front desk checking guest reservations',
              'Reports on occupancy and revenue',
            ],
          },
          {
            action: 'update',
            description: 'Modify bookings',
            details: 'Enables editing booking details such as dates, room assignments, and special requests.',
            examples: [
              'Changing check-in/out dates',
              'Upgrading room types',
              'Adding special requests',
            ],
          },
          {
            action: 'delete',
            description: 'Cancel bookings',
            details: 'Allows cancellation of reservations. This typically triggers refund calculations based on cancellation policies.',
            examples: [
              'Guest-initiated cancellations',
              'Property owner cancellations',
              'No-show cancellations',
            ],
          },
          {
            action: 'manage',
            description: 'Full booking management including payments and status updates',
            details: 'Complete control over all booking aspects including payment processing, status changes, and advanced modifications.',
            examples: [
              'Processing payments',
              'Changing booking statuses',
              'Managing complex booking modifications',
            ],
          },
        ],
      },
      {
        resource: 'checkout',
        displayName: 'Checkout',
        overview: 'Checkout represents the booking process where guests select rooms, add extras, and complete payment.',
        permissions: [
          {
            action: 'create',
            description: 'Create checkout sessions',
            details: 'Allows initiating new checkout sessions for guests to complete their bookings.',
            examples: [
              'Starting the booking process',
              'Creating checkout for quotes',
              'Manual checkout sessions',
            ],
          },
          {
            action: 'read',
            description: 'View checkout data',
            details: 'Grants access to view checkout session information and progress.',
            examples: [
              'Monitoring checkout conversions',
              'Viewing abandoned carts',
              'Checkout analytics',
            ],
          },
          {
            action: 'update',
            description: 'Update checkout information',
            details: 'Enables modification of checkout sessions and cart contents.',
            examples: [
              'Updating cart items',
              'Applying discount codes',
              'Modifying guest information',
            ],
          },
          {
            action: 'delete',
            description: 'Delete checkout sessions',
            details: 'Allows removal of abandoned or invalid checkout sessions.',
            examples: [
              'Clearing expired sessions',
              'Removing test checkouts',
              'Canceling incomplete bookings',
            ],
          },
          {
            action: 'manage',
            description: 'Manage checkout settings and payment processing',
            details: 'Complete control over checkout configuration including payment gateways, pricing rules, and checkout flow.',
            examples: [
              'Configuring payment methods',
              'Setting up checkout rules',
              'Managing payment gateway integration',
            ],
          },
        ],
      },
      {
        resource: 'guests',
        displayName: 'Guests',
        overview: 'Guest records contain personal information, booking history, preferences, and communication logs for customers.',
        permissions: [
          {
            action: 'create',
            description: 'Create guest records',
            details: 'Allows adding new guest profiles to the system.',
            examples: [
              'Manual guest registration',
              'Creating profiles for phone bookings',
              'Group member additions',
            ],
          },
          {
            action: 'read',
            description: 'View guest information',
            details: 'Grants access to guest profiles, contact information, and booking history.',
            examples: [
              'Front desk accessing guest details',
              'Viewing guest preferences',
              'Customer service lookups',
            ],
          },
          {
            action: 'update',
            description: 'Update guest details',
            details: 'Enables editing guest information such as contact details, preferences, and notes.',
            examples: [
              'Updating contact information',
              'Adding guest preferences',
              'Recording special requirements',
            ],
          },
          {
            action: 'delete',
            description: 'Delete guest records',
            details: 'Allows removal of guest profiles. Use carefully to maintain booking history integrity.',
            examples: [
              'GDPR data deletion requests',
              'Removing duplicate profiles',
              'Deleting test guest accounts',
            ],
          },
          {
            action: 'manage',
            description: 'Full guest management including history and preferences',
            details: 'Complete control over guest profiles including sensitive data, communication history, and advanced settings.',
            examples: [
              'Managing VIP guest profiles',
              'Handling data privacy requests',
              'Guest relationship management',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'financial_management',
    name: 'Financial Management',
    description: 'Handle invoices, payments, refunds, and financial rules',
    color: 'purple',
    resources: [
      {
        resource: 'invoices',
        displayName: 'Invoices',
        overview: 'Invoices are official billing documents issued to guests for their bookings. They include line items, taxes, and payment information.',
        permissions: [
          {
            action: 'create',
            description: 'Create invoices',
            details: 'Allows generation of invoices for bookings and services.',
            examples: [
              'Generating booking invoices',
              'Creating manual invoices',
              'Issuing invoices for add-on services',
            ],
          },
          {
            action: 'read',
            description: 'View invoices',
            details: 'Grants access to view invoice documents and details.',
            examples: [
              'Guests viewing their invoices',
              'Accounting reviewing invoices',
              'Financial reports',
            ],
          },
          {
            action: 'update',
            description: 'Update invoices',
            details: 'Enables editing invoice details before finalization.',
            examples: [
              'Correcting invoice errors',
              'Adding line items',
              'Adjusting pricing',
            ],
          },
          {
            action: 'delete',
            description: 'Delete invoices',
            details: 'Allows removal of draft or invalid invoices.',
            examples: [
              'Deleting draft invoices',
              'Removing duplicate invoices',
              'Canceling incorrect invoices',
            ],
          },
          {
            action: 'manage',
            description: 'Full invoice management including PDF generation and settings',
            details: 'Complete control over invoice configuration, templates, and generation settings.',
            examples: [
              'Configuring invoice templates',
              'Setting up tax rules',
              'Managing invoice numbering',
            ],
          },
        ],
      },
      {
        resource: 'refunds',
        displayName: 'Refunds',
        overview: 'Refunds handle the return of payments to guests following cancellations or service issues.',
        permissions: [
          {
            action: 'create',
            description: 'Create refund requests',
            details: 'Allows initiating refund requests for bookings.',
            examples: [
              'Guest-initiated cancellation refunds',
              'Service issue refunds',
              'Overbooking compensation',
            ],
          },
          {
            action: 'read',
            description: 'View refunds',
            details: 'Grants access to view refund requests and status.',
            examples: [
              'Property owners viewing refund requests',
              'Guests tracking refund status',
              'Financial reporting on refunds',
            ],
          },
          {
            action: 'update',
            description: 'Update refund status',
            details: 'Enables changing refund statuses and details.',
            examples: [
              'Approving refund requests',
              'Rejecting invalid requests',
              'Processing refund amounts',
            ],
          },
          {
            action: 'delete',
            description: 'Delete refund requests',
            details: 'Allows removal of invalid or duplicate refund requests.',
            examples: [
              'Removing duplicate requests',
              'Deleting test refunds',
              'Canceling withdrawn requests',
            ],
          },
          {
            action: 'manage',
            description: 'Full refund management including approvals and processing',
            details: 'Complete control over refund workflows, approval processes, and payment gateway processing.',
            examples: [
              'Configuring refund policies',
              'Setting up approval workflows',
              'Managing payment gateway refunds',
            ],
          },
        ],
      },
      {
        resource: 'payment_rules',
        displayName: 'Payment Rules',
        overview: 'Payment rules define when and how much guests need to pay (e.g., 30% deposit at booking, balance 14 days before check-in).',
        permissions: [
          {
            action: 'create',
            description: 'Create payment rules',
            details: 'Allows setting up new payment schedules and deposit rules.',
            examples: [
              'Creating deposit requirements',
              'Setting up payment schedules',
              'Defining milestone payments',
            ],
          },
          {
            action: 'read',
            description: 'View payment rules',
            details: 'Grants access to view payment rule configurations.',
            examples: [
              'Viewing active payment rules',
              'Checking deposit requirements',
              'Understanding payment schedules',
            ],
          },
          {
            action: 'update',
            description: 'Update payment rules',
            details: 'Enables editing payment rule configurations.',
            examples: [
              'Changing deposit percentages',
              'Updating payment deadlines',
              'Modifying payment schedules',
            ],
          },
          {
            action: 'delete',
            description: 'Delete payment rules',
            details: 'Allows removal of payment rules.',
            examples: [
              'Removing outdated rules',
              'Deleting test rules',
              'Simplifying payment structure',
            ],
          },
          {
            action: 'manage',
            description: 'Full payment rule management including schedules and milestones',
            details: 'Complete control over payment rule configuration including complex schedules and conditional rules.',
            examples: [
              'Setting up complex payment schedules',
              'Creating seasonal payment rules',
              'Managing payment method restrictions',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'marketing_sales',
    name: 'Marketing & Sales',
    description: 'Manage promotions, reviews, discovery listings, and guest wishlists',
    color: 'pink',
    resources: [
      {
        resource: 'promotions',
        displayName: 'Promotions',
        overview: 'Promotions include discount codes, special offers, and pricing campaigns that can be applied to bookings.',
        permissions: [
          {
            action: 'create',
            description: 'Create promotions and discount codes',
            details: 'Allows creating new promotional campaigns, discount codes, and special offers.',
            examples: [
              'Creating seasonal discount codes',
              'Setting up early bird promotions',
              'Launching last-minute booking deals',
            ],
          },
          {
            action: 'read',
            description: 'View promotions',
            details: 'Grants access to view active and past promotional campaigns.',
            examples: [
              'Viewing active discount codes',
              'Checking promotion performance',
              'Reviewing campaign history',
            ],
          },
          {
            action: 'update',
            description: 'Update promotions',
            details: 'Enables editing promotion details, discount amounts, and validity periods.',
            examples: [
              'Extending promotion deadlines',
              'Adjusting discount percentages',
              'Modifying booking requirements',
            ],
          },
          {
            action: 'delete',
            description: 'Delete promotions',
            details: 'Allows removal of promotional campaigns.',
            examples: [
              'Removing expired promotions',
              'Deleting underperforming campaigns',
              'Cleaning up test promotions',
            ],
          },
          {
            action: 'manage',
            description: 'Full promotion management including usage tracking',
            details: 'Complete control over promotional campaigns including usage analytics, redemption tracking, and advanced settings.',
            examples: [
              'Analyzing promotion performance',
              'Setting usage limits per customer',
              'Configuring promotion stacking rules',
            ],
          },
        ],
      },
      {
        resource: 'reviews',
        displayName: 'Reviews',
        overview: 'Reviews are guest feedback and ratings for properties and experiences after their stay.',
        permissions: [
          {
            action: 'create',
            description: 'Create reviews',
            details: 'Allows guests to submit reviews and ratings after their stay.',
            examples: [
              'Guests writing reviews post-checkout',
              'Property owners requesting reviews',
              'Creating review templates',
            ],
          },
          {
            action: 'read',
            description: 'View reviews',
            details: 'Grants access to view guest reviews and ratings.',
            examples: [
              'Property owners viewing their reviews',
              'Guests browsing property ratings',
              'Analytics on review scores',
            ],
          },
          {
            action: 'update',
            description: 'Update reviews',
            details: 'Enables editing review content within allowed timeframes.',
            examples: [
              'Guests updating their reviews',
              'Property owners responding to reviews',
              'Correcting review typos',
            ],
          },
          {
            action: 'delete',
            description: 'Delete reviews',
            details: 'Allows removal of inappropriate or spam reviews.',
            examples: [
              'Removing spam reviews',
              'Deleting duplicate reviews',
              'Handling review disputes',
            ],
          },
          {
            action: 'manage',
            description: 'Manage reviews including moderation, responses, and withdrawal requests',
            details: 'Complete control over review system including moderation, response management, and handling review withdrawal requests.',
            examples: [
              'Moderating inappropriate reviews',
              'Managing review response templates',
              'Handling review dispute escalations',
            ],
          },
        ],
      },
      {
        resource: 'discovery',
        displayName: 'Discovery',
        overview: 'Discovery controls how properties appear in public search results and listing pages.',
        permissions: [
          {
            action: 'read',
            description: 'Browse property listings',
            details: 'Allows browsing and searching available properties in the discovery section.',
            examples: [
              'Guests searching for properties',
              'Viewing featured listings',
              'Browsing by location and dates',
            ],
          },
          {
            action: 'update',
            description: 'Update discovery settings',
            details: 'Enables configuration of property visibility and search settings.',
            examples: [
              'Setting property visibility',
              'Configuring search keywords',
              'Managing listing photos',
            ],
          },
          {
            action: 'manage',
            description: 'Manage discovery settings and featured listings',
            details: 'Complete control over discovery configuration including featured placements, boost campaigns, and visibility rules.',
            examples: [
              'Setting up featured listings',
              'Configuring boost campaigns',
              'Managing SEO settings',
            ],
          },
        ],
      },
      {
        resource: 'wishlist',
        displayName: 'Wishlist',
        overview: 'Wishlists allow guests to save properties they are interested in for future bookings.',
        permissions: [
          {
            action: 'create',
            description: 'Add to wishlist',
            details: 'Allows guests to save properties to their wishlist.',
            examples: [
              'Guests saving favorite properties',
              'Creating multiple wishlists',
              'Saving properties for future trips',
            ],
          },
          {
            action: 'read',
            description: 'View wishlist',
            details: 'Grants access to view saved properties in wishlists.',
            examples: [
              'Viewing saved properties',
              'Checking wishlist updates',
              'Browsing past favorites',
            ],
          },
          {
            action: 'update',
            description: 'Update wishlist',
            details: 'Enables organizing and modifying wishlists.',
            examples: [
              'Renaming wishlists',
              'Adding notes to saved properties',
              'Organizing by trip type',
            ],
          },
          {
            action: 'delete',
            description: 'Remove from wishlist',
            details: 'Allows removal of properties from wishlists.',
            examples: [
              'Removing booked properties',
              'Clearing old wishlists',
              'Deleting individual items',
            ],
          },
          {
            action: 'manage',
            description: 'Manage wishlist settings',
            details: 'Complete control over wishlist features and sharing settings.',
            examples: [
              'Sharing wishlists with friends',
              'Configuring privacy settings',
              'Managing wishlist notifications',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'user_management',
    name: 'User Management',
    description: 'Manage users, roles, and company accounts',
    color: 'orange',
    resources: [
      {
        resource: 'roles',
        displayName: 'Roles',
        overview: 'Roles define sets of permissions that can be assigned to users for access control.',
        permissions: [
          {
            action: 'create',
            description: 'Create roles',
            details: 'Allows creating new role definitions with custom permission sets.',
            examples: [
              'Creating custom staff roles',
              'Defining property manager roles',
              'Setting up limited access roles',
            ],
          },
          {
            action: 'read',
            description: 'View roles',
            details: 'Grants access to view role definitions and assigned permissions.',
            examples: [
              'Viewing available roles',
              'Checking role permissions',
              'Reviewing access levels',
            ],
          },
          {
            action: 'update',
            description: 'Update roles',
            details: 'Enables modification of role names, descriptions, and permissions.',
            examples: [
              'Adjusting role permissions',
              'Renaming roles',
              'Updating role descriptions',
            ],
          },
          {
            action: 'delete',
            description: 'Delete roles',
            details: 'Allows removal of unused or obsolete roles.',
            examples: [
              'Removing deprecated roles',
              'Deleting test roles',
              'Consolidating similar roles',
            ],
          },
          {
            action: 'manage',
            description: 'Full role management including permission assignment',
            details: 'Complete control over role system including permission assignments, role hierarchies, and access rules.',
            examples: [
              'Designing role hierarchies',
              'Bulk permission updates',
              'Managing role-based workflows',
            ],
          },
        ],
      },
      {
        resource: 'companies',
        displayName: 'Companies',
        overview: 'Companies represent business entities that own and manage properties on the platform.',
        permissions: [
          {
            action: 'create',
            description: 'Create companies',
            details: 'Allows creation of new company accounts.',
            examples: [
              'Property management companies signing up',
              'Hotel chains creating accounts',
              'Individual property owners registering',
            ],
          },
          {
            action: 'read',
            description: 'View companies',
            details: 'Grants access to view company profiles and details.',
            examples: [
              'Viewing company information',
              'Checking company properties',
              'Reviewing company status',
            ],
          },
          {
            action: 'update',
            description: 'Update company details',
            details: 'Enables editing company information, contacts, and settings.',
            examples: [
              'Updating company address',
              'Changing contact information',
              'Modifying company settings',
            ],
          },
          {
            action: 'delete',
            description: 'Delete companies',
            details: 'Allows removal of company accounts. Use with extreme caution.',
            examples: [
              'Removing duplicate accounts',
              'Deleting test companies',
              'Handling account closure requests',
            ],
          },
          {
            action: 'manage',
            description: 'Full company management including settings and configuration',
            details: 'Complete control over company accounts including billing, team management, and advanced configuration.',
            examples: [
              'Managing company billing',
              'Configuring company settings',
              'Setting up team structures',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Manage chat messages, notifications, and webhook integrations',
    color: 'cyan',
    resources: [
      {
        resource: 'chat',
        displayName: 'Chat',
        overview: 'Chat enables real-time messaging between guests, property owners, and support staff.',
        permissions: [
          {
            action: 'create',
            description: 'Send messages',
            details: 'Allows sending chat messages to other users.',
            examples: [
              'Guests messaging property owners',
              'Property owners responding to inquiries',
              'Support staff assisting users',
            ],
          },
          {
            action: 'read',
            description: 'View messages',
            details: 'Grants access to view chat conversations and message history.',
            examples: [
              'Reading guest inquiries',
              'Viewing conversation history',
              'Monitoring chat activity',
            ],
          },
          {
            action: 'update',
            description: 'Edit messages',
            details: 'Enables editing of sent messages within allowed timeframes.',
            examples: [
              'Correcting message typos',
              'Updating sent information',
              'Clarifying previous messages',
            ],
          },
          {
            action: 'delete',
            description: 'Delete messages',
            details: 'Allows deletion of sent messages.',
            examples: [
              'Removing inappropriate messages',
              'Deleting sent by mistake',
              'Cleaning up old conversations',
            ],
          },
          {
            action: 'manage',
            description: 'Manage chat including channels, participants, and settings',
            details: 'Complete control over chat system including channel management, participant moderation, and chat settings.',
            examples: [
              'Managing chat channels',
              'Moderating conversations',
              'Configuring chat notifications',
            ],
          },
        ],
      },
      {
        resource: 'notifications',
        displayName: 'Notifications',
        overview: 'Notifications are system alerts sent to users about bookings, messages, and important events.',
        permissions: [
          {
            action: 'create',
            description: 'Create notifications',
            details: 'Allows sending notifications to users.',
            examples: [
              'System sending booking confirmations',
              'Sending payment reminders',
              'Creating custom alerts',
            ],
          },
          {
            action: 'read',
            description: 'View notifications',
            details: 'Grants access to view received notifications.',
            examples: [
              'Users viewing their notifications',
              'Checking notification history',
              'Reviewing unread alerts',
            ],
          },
          {
            action: 'update',
            description: 'Mark notifications as read',
            details: 'Enables marking notifications as read or unread.',
            examples: [
              'Marking notifications as read',
              'Clearing notification badges',
              'Managing read status',
            ],
          },
          {
            action: 'delete',
            description: 'Delete notifications',
            details: 'Allows removal of notifications.',
            examples: [
              'Clearing old notifications',
              'Deleting irrelevant alerts',
              'Managing notification inbox',
            ],
          },
          {
            action: 'manage',
            description: 'Manage notification preferences and templates',
            details: 'Complete control over notification system including preferences, templates, and delivery channels.',
            examples: [
              'Configuring notification preferences',
              'Customizing email templates',
              'Setting up SMS notifications',
            ],
          },
        ],
      },
      {
        resource: 'webhooks',
        displayName: 'Webhooks',
        overview: 'Webhooks enable real-time integration with external systems by sending HTTP callbacks on specific events.',
        permissions: [
          {
            action: 'create',
            description: 'Create webhooks',
            details: 'Allows setting up new webhook endpoints.',
            examples: [
              'Integrating with external CRM',
              'Setting up payment gateway webhooks',
              'Connecting to accounting software',
            ],
          },
          {
            action: 'read',
            description: 'View webhooks',
            details: 'Grants access to view configured webhooks and delivery logs.',
            examples: [
              'Viewing active webhooks',
              'Checking webhook delivery status',
              'Monitoring webhook performance',
            ],
          },
          {
            action: 'update',
            description: 'Update webhooks',
            details: 'Enables modification of webhook URLs, events, and settings.',
            examples: [
              'Updating webhook endpoints',
              'Changing subscribed events',
              'Modifying retry policies',
            ],
          },
          {
            action: 'delete',
            description: 'Delete webhooks',
            details: 'Allows removal of webhook integrations.',
            examples: [
              'Removing unused webhooks',
              'Deleting broken integrations',
              'Cleaning up test webhooks',
            ],
          },
          {
            action: 'manage',
            description: 'Full webhook management including event configuration',
            details: 'Complete control over webhook system including event configuration, retry policies, and security settings.',
            examples: [
              'Configuring webhook signatures',
              'Setting up event filters',
              'Managing webhook authentication',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'system_administration',
    name: 'System Administration',
    description: 'Manage system settings, analytics, reports, audit logs, and dashboard',
    color: 'gray',
    resources: [
      {
        resource: 'settings',
        displayName: 'Settings',
        overview: 'Settings control system-wide configuration and preferences for the platform.',
        permissions: [
          {
            action: 'manage',
            description: 'Manage all system settings',
            details: 'Complete control over all system settings including platform configuration, defaults, and global preferences.',
            examples: [
              'Configuring platform defaults',
              'Setting up currency and timezone',
              'Managing system-wide features',
            ],
          },
        ],
      },
      {
        resource: 'analytics',
        displayName: 'Analytics',
        overview: 'Analytics provide insights into bookings, revenue, occupancy, and business performance.',
        permissions: [
          {
            action: 'manage',
            description: 'Manage analytics configuration and reports',
            details: 'Complete control over analytics system including dashboard configuration, report generation, and data exports.',
            examples: [
              'Configuring analytics dashboards',
              'Creating custom reports',
              'Exporting analytics data',
            ],
          },
        ],
      },
      {
        resource: 'audit_logs',
        displayName: 'Audit Logs',
        overview: 'Audit logs track all system actions and changes for security and compliance purposes.',
        permissions: [
          {
            action: 'manage',
            description: 'Manage audit log settings and retention',
            details: 'Complete control over audit logging including retention policies, export settings, and compliance configuration.',
            examples: [
              'Configuring log retention',
              'Exporting audit logs',
              'Setting up compliance reports',
            ],
          },
        ],
      },
      {
        resource: 'dashboard',
        displayName: 'Dashboard',
        overview: 'Dashboard displays key metrics, recent activity, and quick access to important features.',
        permissions: [
          {
            action: 'read',
            description: 'View dashboard',
            details: 'Grants access to view the main dashboard with metrics and activity.',
            examples: [
              'Viewing dashboard metrics',
              'Checking recent activity',
              'Monitoring key statistics',
            ],
          },
          {
            action: 'update',
            description: 'Customize dashboard',
            details: 'Enables customization of dashboard widgets and layout.',
            examples: [
              'Rearranging dashboard widgets',
              'Customizing metric displays',
              'Setting dashboard preferences',
            ],
          },
          {
            action: 'manage',
            description: 'Manage dashboard widgets and layout',
            details: 'Complete control over dashboard including widget configuration, layout management, and shared dashboards.',
            examples: [
              'Creating custom dashboards',
              'Sharing dashboard templates',
              'Managing team dashboards',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'content_legal',
    name: 'Content & Legal',
    description: 'Manage legal documents, location data, and onboarding flows',
    color: 'yellow',
    resources: [
      {
        resource: 'legal',
        displayName: 'Legal',
        overview: 'Legal documents include terms of service, privacy policies, and cancellation policies.',
        permissions: [
          {
            action: 'read',
            description: 'View legal documents',
            details: 'Grants access to view legal documents and policies.',
            examples: [
              'Guests reading terms of service',
              'Viewing privacy policy',
              'Checking cancellation policies',
            ],
          },
          {
            action: 'update',
            description: 'Update legal documents',
            details: 'Enables editing of legal documents and policy content.',
            examples: [
              'Updating terms of service',
              'Modifying privacy policy',
              'Revising cancellation policies',
            ],
          },
          {
            action: 'manage',
            description: 'Manage legal documents including policies and terms',
            details: 'Complete control over legal document management including versioning, approval workflows, and compliance tracking.',
            examples: [
              'Managing document versions',
              'Setting up approval workflows',
              'Tracking compliance updates',
            ],
          },
        ],
      },
      {
        resource: 'locations',
        displayName: 'Locations',
        overview: 'Locations include countries, provinces, cities, and postal codes for address management.',
        permissions: [
          {
            action: 'read',
            description: 'View locations',
            details: 'Grants access to view location data and hierarchies.',
            examples: [
              'Browsing available locations',
              'Searching for cities',
              'Viewing location hierarchies',
            ],
          },
          {
            action: 'create',
            description: 'Create locations',
            details: 'Allows adding new locations to the system.',
            examples: [
              'Adding new cities',
              'Creating custom locations',
              'Expanding location coverage',
            ],
          },
          {
            action: 'update',
            description: 'Update locations',
            details: 'Enables editing location names, codes, and hierarchies.',
            examples: [
              'Correcting location names',
              'Updating postal codes',
              'Modifying location data',
            ],
          },
          {
            action: 'delete',
            description: 'Delete locations',
            details: 'Allows removal of locations from the system.',
            examples: [
              'Removing duplicate locations',
              'Deleting incorrect entries',
              'Cleaning up location data',
            ],
          },
          {
            action: 'manage',
            description: 'Manage location data and hierarchies',
            details: 'Complete control over location system including hierarchies, translations, and geocoding.',
            examples: [
              'Managing location hierarchies',
              'Setting up location translations',
              'Configuring geocoding rules',
            ],
          },
        ],
      },
      {
        resource: 'onboarding',
        displayName: 'Onboarding',
        overview: 'Onboarding guides new users through initial setup and configuration steps.',
        permissions: [
          {
            action: 'read',
            description: 'View onboarding status',
            details: 'Grants access to view onboarding progress and status.',
            examples: [
              'Viewing onboarding checklist',
              'Checking setup progress',
              'Monitoring completion status',
            ],
          },
          {
            action: 'update',
            description: 'Update onboarding progress',
            details: 'Enables marking onboarding steps as complete and skipping steps.',
            examples: [
              'Completing onboarding steps',
              'Skipping optional steps',
              'Updating progress status',
            ],
          },
          {
            action: 'manage',
            description: 'Manage onboarding flow and steps',
            details: 'Complete control over onboarding system including flow configuration, step customization, and completion rules.',
            examples: [
              'Customizing onboarding flows',
              'Adding custom steps',
              'Configuring completion criteria',
            ],
          },
        ],
      },
    ],
  },
];

// Color styles for category badges
const colorStyles: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300' },
  green: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-300' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-700 dark:text-pink-300' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-300' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900', text: 'text-cyan-700 dark:text-cyan-300' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-900', text: 'text-gray-700 dark:text-gray-300' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-700 dark:text-yellow-300' },
};

export const PermissionsGuideTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'property_management', // Expand first category by default
  ]);

  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter((id) => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  // Filter documentation based on search
  const filteredDocs = PERMISSIONS_DOCUMENTATION.filter((category) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      category.name.toLowerCase().includes(query) ||
      category.description.toLowerCase().includes(query) ||
      category.resources.some(
        (resource) =>
          resource.displayName.toLowerCase().includes(query) ||
          resource.overview.toLowerCase().includes(query) ||
          resource.permissions.some(
            (p) =>
              p.action.toLowerCase().includes(query) ||
              p.description.toLowerCase().includes(query) ||
              p.details.toLowerCase().includes(query)
          )
      )
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Permissions Guide</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Comprehensive documentation of all permissions available in Vilo. Use this guide to understand what
          each permission does and when to assign it to subscription plans.
        </p>
      </div>

      {/* Search */}
      <Input
        type="search"
        placeholder="Search permissions, categories, or resources..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered">
          <Card.Body className="text-center">
            <div className="text-3xl font-bold text-primary">{PERMISSIONS_DOCUMENTATION.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Permission Categories</div>
          </Card.Body>
        </Card>
        <Card variant="bordered">
          <Card.Body className="text-center">
            <div className="text-3xl font-bold text-primary">
              {PERMISSIONS_DOCUMENTATION.reduce((sum, cat) => sum + cat.resources.length, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Resources</div>
          </Card.Body>
        </Card>
        <Card variant="bordered">
          <Card.Body className="text-center">
            <div className="text-3xl font-bold text-primary">
              {PERMISSIONS_DOCUMENTATION.reduce(
                (sum, cat) => sum + cat.resources.reduce((s, r) => s + r.permissions.length, 0),
                0
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Permissions</div>
          </Card.Body>
        </Card>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {filteredDocs.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          const colors = colorStyles[category.color] || colorStyles.gray;

          return (
            <Card key={category.id} variant="bordered">
              {/* Category Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="custom" className={`${colors.bg} ${colors.text}`}>
                      {category.resources.length} resources
                    </Badge>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Category Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-6 border-t border-gray-200 dark:border-dark-border">
                  {category.resources.map((resource) => (
                    <div key={resource.resource} className="space-y-3">
                      {/* Resource Header */}
                      <div className="pt-4">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          {resource.displayName}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{resource.overview}</p>
                      </div>

                      {/* Permissions */}
                      <div className="space-y-3 pl-4">
                        {resource.permissions.map((permission) => (
                          <div
                            key={permission.action}
                            className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border"
                          >
                            <div className="flex items-start gap-3">
                              <Badge variant="default" size="sm" className="mt-0.5">
                                {permission.action}
                              </Badge>
                              <div className="flex-1 space-y-2">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {permission.description}
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {permission.details}
                                  </p>
                                </div>
                                {permission.examples.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                      Use Cases:
                                    </div>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5 list-disc list-inside">
                                      {permission.examples.map((example, i) => (
                                        <li key={i}>{example}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredDocs.length === 0 && (
        <Card variant="bordered">
          <Card.Body className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No permissions found matching "{searchQuery}"
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Footer Note */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <span className="font-medium">Note:</span> This guide will be expanded as new features and
          permissions are added to the platform. You can use the search function to quickly find specific
          permissions or resources.
        </p>
      </div>
    </div>
  );
};
