/**
 * Accommodation Page Module
 * Handles room filtering and view toggle
 */

export function initAccommodation() {
  const gridView = document.getElementById('rooms-grid');
  const listView = document.getElementById('rooms-list');
  const gridBtn = document.getElementById('view-grid');
  const listBtn = document.getElementById('view-list');

  if (!gridView || !listView || !gridBtn || !listBtn) {
    return;
  }

  // View toggle functionality
  gridBtn.addEventListener('click', () => {
    // Show grid, hide list
    gridView.classList.remove('hidden');
    listView.classList.add('hidden');

    // Update button styles
    gridBtn.classList.remove('bg-gray-200', 'text-gray-600');
    gridBtn.classList.add('bg-primary-500', 'text-white');
    listBtn.classList.remove('bg-primary-500', 'text-white');
    listBtn.classList.add('bg-gray-200', 'text-gray-600');
  });

  listBtn.addEventListener('click', () => {
    // Show list, hide grid
    gridView.classList.add('hidden');
    listView.classList.remove('hidden');

    // Update button styles
    listBtn.classList.remove('bg-gray-200', 'text-gray-600');
    listBtn.classList.add('bg-primary-500', 'text-white');
    gridBtn.classList.remove('bg-primary-500', 'text-white');
    gridBtn.classList.add('bg-gray-200', 'text-gray-600');

    // Always populate list view to ensure it shows
    populateListView();

    // Scroll to top of the rooms section (grid/list parent container)
    setTimeout(() => {
      const roomsSection = gridView.parentElement;
      if (roomsSection) {
        const offset = 100; // Offset for fixed header
        const elementPosition = roomsSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  });

  // Filter button click handlers
  const filterTypeBtn = document.getElementById('filter-type');
  const filterPriceBtn = document.getElementById('filter-price');

  if (filterTypeBtn) {
    filterTypeBtn.addEventListener('click', () => {
      showRoomTypeModal();
    });
  }

  if (filterPriceBtn) {
    filterPriceBtn.addEventListener('click', () => {
      showPriceRangeModal();
    });
  }
}

// Create and show Room Type filter modal
function showRoomTypeModal() {
  const modalHTML = `
    <div id="filter-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden animate-modal-in">
        <!-- Modal Header -->
        <div class="bg-primary-500 text-white px-6 py-4 flex items-center justify-between">
          <h3 class="text-xl font-bold flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            Room Type
          </h3>
          <button onclick="this.closest('#filter-modal').remove()" class="text-white hover:text-gray-200 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p class="text-gray-600 text-sm mb-4">Select room types to filter accommodations</p>

          <label class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
            <input type="checkbox" class="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-2 focus:ring-primary-500" checked>
            <div class="flex-1">
              <div class="font-semibold text-gray-900 group-hover:text-primary-500">Luxury Suite</div>
              <div class="text-sm text-gray-500">Premium accommodations with exclusive amenities</div>
            </div>
            <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">2</span>
          </label>

          <label class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
            <input type="checkbox" class="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-2 focus:ring-primary-500" checked>
            <div class="flex-1">
              <div class="font-semibold text-gray-900 group-hover:text-primary-500">Deluxe Room</div>
              <div class="text-sm text-gray-500">Comfortable rooms with modern facilities</div>
            </div>
            <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">1</span>
          </label>

          <label class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
            <input type="checkbox" class="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-2 focus:ring-primary-500" checked>
            <div class="flex-1">
              <div class="font-semibold text-gray-900 group-hover:text-primary-500">Family Suite</div>
              <div class="text-sm text-gray-500">Spacious accommodations for families</div>
            </div>
            <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">1</span>
          </label>

          <label class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
            <input type="checkbox" class="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-2 focus:ring-primary-500" checked>
            <div class="flex-1">
              <div class="font-semibold text-gray-900 group-hover:text-primary-500">Standard Room</div>
              <div class="text-sm text-gray-500">Cozy and affordable options</div>
            </div>
            <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">1</span>
          </label>

          <label class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
            <input type="checkbox" class="w-5 h-5 text-primary-500 border-gray-300 rounded focus:ring-2 focus:ring-primary-500" checked>
            <div class="flex-1">
              <div class="font-semibold text-gray-900 group-hover:text-primary-500">Premium Villa</div>
              <div class="text-sm text-gray-500">Exclusive villas with private amenities</div>
            </div>
            <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">1</span>
          </label>
        </div>

        <!-- Modal Footer -->
        <div class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <button onclick="this.closest('#filter-modal').querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false)" class="text-gray-600 hover:text-gray-900 font-medium text-sm">
            Clear All
          </button>
          <div class="flex gap-3">
            <button onclick="this.closest('#filter-modal').remove()" class="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
              Cancel
            </button>
            <button onclick="this.closest('#filter-modal').remove()" class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium">
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Close on backdrop click
  document.getElementById('filter-modal').addEventListener('click', (e) => {
    if (e.target.id === 'filter-modal') {
      e.target.remove();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('filter-modal');
      if (modal) modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// Create and show Price Range filter modal
function showPriceRangeModal() {
  const modalHTML = `
    <div id="filter-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-modal-in">
        <!-- Modal Header -->
        <div class="bg-primary-500 text-white px-6 py-4 flex items-center justify-between">
          <h3 class="text-xl font-bold flex items-center gap-2">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Price Range
          </h3>
          <button onclick="this.closest('#filter-modal').remove()" class="text-white hover:text-gray-200 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6">
          <p class="text-gray-600 text-sm">Select your preferred price range per night</p>

          <div class="space-y-4">
            <label class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
              <input type="radio" name="price" class="w-5 h-5 text-primary-500 border-gray-300 focus:ring-2 focus:ring-primary-500" checked>
              <div class="flex-1">
                <div class="font-semibold text-gray-900 group-hover:text-primary-500">All Prices</div>
                <div class="text-sm text-gray-500">Show all available rooms</div>
              </div>
              <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">6 rooms</span>
            </label>

            <label class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
              <input type="radio" name="price" class="w-5 h-5 text-primary-500 border-gray-300 focus:ring-2 focus:ring-primary-500">
              <div class="flex-1">
                <div class="font-semibold text-gray-900 group-hover:text-primary-500">Under $300</div>
                <div class="text-sm text-gray-500">Budget-friendly options</div>
              </div>
              <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">2 rooms</span>
            </label>

            <label class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
              <input type="radio" name="price" class="w-5 h-5 text-primary-500 border-gray-300 focus:ring-2 focus:ring-primary-500">
              <div class="flex-1">
                <div class="font-semibold text-gray-900 group-hover:text-primary-500">$300 - $500</div>
                <div class="text-sm text-gray-500">Mid-range accommodations</div>
              </div>
              <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">3 rooms</span>
            </label>

            <label class="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
              <input type="radio" name="price" class="w-5 h-5 text-primary-500 border-gray-300 focus:ring-2 focus:ring-primary-500">
              <div class="flex-1">
                <div class="font-semibold text-gray-900 group-hover:text-primary-500">Above $500</div>
                <div class="text-sm text-gray-500">Luxury accommodations</div>
              </div>
              <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">1 room</span>
            </label>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
          <button onclick="this.closest('#filter-modal').remove()" class="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
            Cancel
          </button>
          <button onclick="this.closest('#filter-modal').remove()" class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium">
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Close on backdrop click
  document.getElementById('filter-modal').addEventListener('click', (e) => {
    if (e.target.id === 'filter-modal') {
      e.target.remove();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('filter-modal');
      if (modal) modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

function populateListView() {
  const listView = document.getElementById('rooms-list');
  if (!listView) return;

  const rooms = [
    {
      title: 'Serengeti Suite',
      type: 'Luxury Suite',
      price: 450,
      rating: 4.9,
      description: 'Spacious suite with panoramic Serengeti views, king-size bed, private balcony, and luxury bathroom with soaking tub. Experience ultimate comfort and elegance.',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop',
      guests: '2 Guests',
      bed: 'King Bed',
      badge: 'Featured'
    },
    {
      title: 'Savanna Room',
      type: 'Deluxe Room',
      price: 280,
      rating: 4.7,
      description: 'Elegant room with garden views, queen bed, modern amenities, and private terrace perfect for wildlife watching at dawn and dusk.',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
      guests: '2 Guests',
      bed: 'Queen Bed',
      badge: null
    },
    {
      title: 'Acacia Bungalow',
      type: 'Family Suite',
      price: 380,
      rating: 4.8,
      description: 'Private bungalow with two bedrooms, living area, and outdoor deck. Perfect for families seeking adventure and comfort in the wild.',
      image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=600&fit=crop',
      guests: '4 Guests',
      bed: '2 Bedrooms',
      badge: null
    },
    {
      title: 'Bush View Room',
      type: 'Standard Room',
      price: 220,
      rating: 4.6,
      description: 'Cozy room with bush views, comfortable bedding, and essential amenities for a memorable safari experience without compromise.',
      image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=600&fit=crop',
      guests: '2 Guests',
      bed: 'Double Bed',
      badge: null
    },
    {
      title: 'Sunset Villa',
      type: 'Premium Villa',
      price: 650,
      rating: 5.0,
      description: 'Exclusive villa with private pool, butler service, panoramic sunset views, and ultimate luxury amenities for the discerning traveler.',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop',
      guests: '4 Guests',
      bed: 'King Bed',
      badge: 'Popular'
    },
    {
      title: 'Wildlife Tent',
      type: 'Luxury Tent',
      price: 320,
      rating: 4.7,
      description: 'Authentic safari tent with modern comforts, en-suite bathroom, and direct access to nature trails for an immersive experience.',
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop',
      guests: '2 Guests',
      bed: 'Queen Bed',
      badge: null
    }
  ];

  const html = rooms.map(room => `
    <article class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
      <div class="flex flex-col md:flex-row">
        <div class="md:w-1/3 relative">
          <img
            src="${room.image}"
            alt="${room.title}"
            class="w-full h-64 md:h-full object-cover"
          />
          ${room.badge ? `<span class="absolute top-4 right-4 bg-primary-500 text-white px-3 py-1 rounded-md text-xs font-semibold uppercase">${room.badge}</span>` : ''}
        </div>
        <div class="md:w-2/3 p-8 flex flex-col justify-center space-y-4">
          <div>
            <h3 class="text-3xl font-semibold text-gray-900">${room.title}</h3>
            <p class="text-sm text-gray-500">${room.type}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-900">${room.rating}</span>
            <div class="text-yellow-400">★★★★★</div>
          </div>
          <p class="text-gray-600 leading-relaxed">
            ${room.description}
          </p>
          <div class="flex flex-wrap gap-3">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
              </svg>
              <span>${room.guests}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
              <span>${room.bed}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd"/>
              </svg>
              <span>WiFi</span>
            </div>
          </div>
          <div class="flex items-center justify-between gap-4 pt-4">
            <div class="text-gray-600">
              <span class="text-sm">From</span>
              <span class="text-3xl font-bold text-gray-900 mx-1">$${room.price}</span>
              <span class="text-sm">per night</span>
            </div>
            <a href="/room-single.html" class="btn btn-primary flex-shrink-0">View Details</a>
          </div>
        </div>
      </div>
    </article>
  `).join('');

  listView.innerHTML = html;
}
