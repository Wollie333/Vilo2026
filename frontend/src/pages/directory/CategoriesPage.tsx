/**
 * CategoriesPage - Browse all property categories
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';

// Category definitions with icons
const categories = [
  {
    id: 'house',
    name: 'Houses',
    description: 'Entire houses perfect for families and groups',
    icon: '🏠',
    color: 'from-blue-500 to-blue-600',
    count: '2,341',
  },
  {
    id: 'apartment',
    name: 'Apartments',
    description: 'Modern apartments in city centers and suburbs',
    icon: '🏢',
    color: 'from-purple-500 to-purple-600',
    count: '3,892',
  },
  {
    id: 'villa',
    name: 'Villas',
    description: 'Luxury villas with private pools and stunning views',
    icon: '🏰',
    color: 'from-pink-500 to-pink-600',
    count: '1,234',
  },
  {
    id: 'cottage',
    name: 'Cottages',
    description: 'Cozy cottages in scenic countryside locations',
    icon: '🏡',
    color: 'from-green-500 to-green-600',
    count: '892',
  },
  {
    id: 'cabin',
    name: 'Cabins',
    description: 'Rustic cabins for nature lovers and adventurers',
    icon: '🛖',
    color: 'from-orange-500 to-orange-600',
    count: '654',
  },
  {
    id: 'condo',
    name: 'Condos',
    description: 'Stylish condominiums with modern amenities',
    icon: '🏘️',
    color: 'from-indigo-500 to-indigo-600',
    count: '1,567',
  },
  {
    id: 'townhouse',
    name: 'Townhouses',
    description: 'Multi-level townhouses with spacious living areas',
    icon: '🏘️',
    color: 'from-teal-500 to-teal-600',
    count: '743',
  },
  {
    id: 'guesthouse',
    name: 'Guesthouses',
    description: 'Charming guesthouses with personal touches',
    icon: '🏨',
    color: 'from-yellow-500 to-yellow-600',
    count: '1,089',
  },
  {
    id: 'hotel',
    name: 'Hotels',
    description: 'Full-service hotels with professional hospitality',
    icon: '🏨',
    color: 'from-red-500 to-red-600',
    count: '432',
  },
  {
    id: 'bnb',
    name: 'Bed & Breakfast',
    description: 'Cozy B&Bs with homemade breakfast included',
    icon: '🛏️',
    color: 'from-cyan-500 to-cyan-600',
    count: '567',
  },
  {
    id: 'resort',
    name: 'Resorts',
    description: 'All-inclusive resorts with premium facilities',
    icon: '🏖️',
    color: 'from-amber-500 to-amber-600',
    count: '189',
  },
  {
    id: 'lodge',
    name: 'Lodges',
    description: 'Wildlife lodges and safari accommodations',
    icon: '🦁',
    color: 'from-lime-500 to-lime-600',
    count: '234',
  },
];

export const CategoriesPage: React.FC = () => {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Browse by Category
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover the perfect accommodation for your next adventure. From cozy cottages to luxury villas.
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/search?property_type=${category.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative p-6">
                  {/* Icon */}
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {category.description}
                  </p>

                  {/* Count Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-500">
                      {category.count} properties
                    </span>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div className={`absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-2xl transition-colors pointer-events-none`} />
              </Link>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-16 text-center">
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Can't find what you're looking for?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Browse all properties or use our advanced search filters to find your perfect stay.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/search"
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md"
                >
                  Browse All Properties
                </Link>
                <Link
                  to="/search?advanced=true"
                  className="px-6 py-3 bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Advanced Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default CategoriesPage;
