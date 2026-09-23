export const destinationsData = {
  jaipur: {
    name: 'Jaipur',
    tagline: 'The Pink City of India',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=800&auto=format&fit=crop',
    nearby: [
      { name: 'Pushkar', distance: '145 km', type: 'Spiritual / Lake' },
      { name: 'Ajmer', distance: '135 km', type: 'Spiritual / Dargah' },
      { name: 'Ranthambore', distance: '190 km', type: 'Wildlife / Safari' }
    ],
    activities: [
      { name: 'Hot Air Balloon Safari', emoji: '🎈', time: 'Early Morning' },
      { name: 'Elephant Ride at Amer', emoji: '🐘', time: 'Morning' },
      { name: 'Block Printing Workshop', emoji: '🎨', time: 'Afternoon' },
      { name: 'Puppet Show', emoji: '🎭', time: 'Evening' }
    ],
    food: [
      { name: 'Dal Bati Churma', emoji: '🍛', place: 'Chokhi Dhani / Local Thali' },
      { name: 'Pyaz Kachori', emoji: '🥟', place: 'Rawat Mishtan Bhandar' },
      { name: 'Ghewar', emoji: '🥞', place: 'LMB (Laxmi Mishtan Bhandar)' },
      { name: 'Laal Maas', emoji: '🍖', place: 'Handi / Spice Court' }
    ],
    roaming: {
      family: [
        { name: 'City Palace', desc: 'Royal residence with museums and stunning architecture.' },
        { name: 'Amer Fort', desc: 'Majestic hilltop fort with rich history.' },
        { name: 'Chokhi Dhani', desc: 'Ethnic village resort with traditional Rajasthani dining.' }
      ],
      friends: [
        { name: 'Nahargarh Fort', desc: 'Best sunset views of the city.' },
        { name: 'Bapu Bazaar', desc: 'Street shopping for mojris and textiles.' },
        { name: 'Tapri Central', desc: 'Famous rooftop cafe for chai and snacks.' }
      ],
      partner: [
        { name: 'Jal Mahal', desc: 'Romantic evening stroll by the water palace.' },
        { name: 'Smriti Van', desc: 'Peaceful biodiversity park for nature walks.' },
        { name: 'Bar Palladio', desc: 'Beautiful blue-themed lounge for dinner.' }
      ]
    },
    stays: {
      hotels: [
        { name: 'Rambagh Palace', rating: 4.9, price: '₹35,000/night', amenities: 'Luxury, Pool, Spa' },
        { name: 'Hilton Jaipur', rating: 4.5, price: '₹6,500/night', amenities: 'Premium, Rooftop Lounge' },
        { name: 'Umaid Bhawan', rating: 4.4, price: '₹4,000/night', amenities: 'Heritage, Pool' }
      ],
      pgs: [
        { name: 'Sunrise PG (Boys)', rating: 4.1, price: '₹6,000/month', amenities: 'WiFi, Meals, AC' },
        { name: 'SafeHaven PG (Girls)', rating: 4.3, price: '₹7,500/month', amenities: 'Security, Meals, AC' }
      ],
      lodges: [
        { name: 'Pink City Lodge', rating: 3.8, price: '₹800/night', amenities: 'Basic, Near Station' },
        { name: 'Rajasthan Guest House', rating: 4.0, price: '₹1,200/night', amenities: 'Family-friendly, Clean' }
      ],
      dormitories: [
        { name: 'Zostel Jaipur', rating: 4.7, price: '₹600/night', amenities: 'Bunk Beds, AC, Cafe, Lockers' },
        { name: 'Moustache Hostel', rating: 4.6, price: '₹550/night', amenities: 'Rooftop, AC, Events' }
      ]
    }
  },
  goa: {
    name: 'Goa',
    tagline: 'The Party Capital of India',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop',
    nearby: [
      { name: 'Gokarna', distance: '140 km', type: 'Beaches / Spiritual' },
      { name: 'Dudhsagar', distance: '60 km', type: 'Waterfalls / Trekking' }
    ],
    activities: [
      { name: 'Scuba Diving', emoji: '🤿', time: 'Morning' },
      { name: 'Parasailing', emoji: '🪂', time: 'Afternoon' },
      { name: 'Casino Cruise', emoji: '🎰', time: 'Night' }
    ],
    food: [
      { name: 'Fish Curry Rice', emoji: '🍛', place: 'Ritz Classic' },
      { name: 'Pork Vindaloo', emoji: '🍖', place: 'Mum\'s Kitchen' },
      { name: 'Bebinca', emoji: '🍰', place: 'Infantaria' }
    ],
    roaming: {
      family: [
        { name: 'Basilica of Bom Jesus', desc: 'Historic UNESCO heritage church.' },
        { name: 'Dona Paula', desc: 'Scenic viewpoint and quiet beach.' }
      ],
      friends: [
        { name: 'Baga Beach', desc: 'Nightlife, shacks, and water sports.' },
        { name: 'Tito\'s Lane', desc: 'Clubs and bars.' }
      ],
      partner: [
        { name: 'Butterfly Beach', desc: 'Hidden, romantic beach access by boat.' },
        { name: 'Chapora Fort', desc: 'Sunset views over the ocean.' }
      ]
    },
    stays: {
      hotels: [
        { name: 'Taj Fort Aguada', rating: 4.8, price: '₹15,000/night', amenities: 'Luxury, Beachfront' },
        { name: 'W Goa', rating: 4.7, price: '₹12,000/night', amenities: 'Premium, Pool' }
      ],
      pgs: [],
      lodges: [
        { name: 'Sea View Lodge', rating: 3.9, price: '₹1,500/night', amenities: 'AC, Near Beach' }
      ],
      dormitories: [
        { name: 'Zostel Goa', rating: 4.5, price: '₹800/night', amenities: 'Bunk Beds, AC' }
      ]
    }
  }
};
