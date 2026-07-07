-- =========================================================
-- YatraGo Holiday Packages Table & Seed Script
-- Creates the holiday_packages table and populates 8 curated packages
-- =========================================================

CREATE TABLE IF NOT EXISTS public.holiday_packages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  duration_nights INTEGER NOT NULL,
  destinations TEXT[] NOT NULL,
  base_price INTEGER NOT NULL,
  image_url TEXT,
  itinerary JSONB,
  inclusions TEXT[],
  exclusions TEXT[],
);

-- Ensure all required columns exist even if the table was previously created with an older schema
ALTER TABLE public.holiday_packages ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.holiday_packages ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Adventure';
ALTER TABLE public.holiday_packages ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 1;
ALTER TABLE public.holiday_packages ADD COLUMN IF NOT EXISTS duration_nights INTEGER DEFAULT 0;
ALTER TABLE public.holiday_packages ADD COLUMN IF NOT EXISTS destinations TEXT[] DEFAULT '{}';
ALTER TABLE public.holiday_packages ADD COLUMN IF NOT EXISTS base_price INTEGER DEFAULT 1000;
ALTER TABLE public.holiday_packages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.holiday_packages ADD COLUMN IF NOT EXISTS itinerary JSONB;
ALTER TABLE public.holiday_packages ADD COLUMN IF NOT EXISTS inclusions TEXT[] DEFAULT '{}';
ALTER TABLE public.holiday_packages ADD COLUMN IF NOT EXISTS exclusions TEXT[] DEFAULT '{}';
ALTER TABLE public.holiday_packages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.holiday_packages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'holiday_packages' AND policyname = 'Anyone can view holiday packages'
  ) THEN
    CREATE POLICY "Anyone can view holiday packages"
      ON public.holiday_packages FOR SELECT
      USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'holiday_packages' AND policyname = 'Admin can modify holiday packages'
  ) THEN
    CREATE POLICY "Admin can modify holiday packages"
      ON public.holiday_packages FOR ALL
      USING (true);
  END IF;
END $$;

INSERT INTO public.holiday_packages (id, title, category, duration_days, duration_nights, destinations, base_price, image_url, itinerary, inclusions, exclusions)
VALUES
  (
    'pkg-1',
    'Royal Rajasthan Heritage Tour',
    'Heritage',
    6,
    5,
    ARRAY['Jaipur', 'Jodhpur', 'Udaipur'],
    24999,
    'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
    '[
      {"day": 1, "title": "Arrival in Jaipur", "description": "Welcome to the Pink City. Check-in and visit Chokhi Dhani for traditional dinner."},
      {"day": 2, "title": "Jaipur Forts & Palaces", "description": "Explore Amber Fort, Hawa Mahal, and City Palace."},
      {"day": 3, "title": "Drive to Jodhpur", "description": "Travel to the Blue City. Visit Mehrangarh Fort and Jaswant Thada."},
      {"day": 4, "title": "Jodhpur to Udaipur via Ranakpur", "description": "Drive through scenic Aravalli hills and visit Jain temples."},
      {"day": 5, "title": "Udaipur City Tour", "description": "Boat ride on Lake Pichola, visit City Palace and Jagdish Temple."},
      {"day": 6, "title": "Departure", "description": "Transfer to Udaipur airport/station with wonderful memories."}
    ]'::jsonb,
    ARRAY['AC Sedan/SUV Transport', '5 Nights Breakfast & Dinner', 'Expert Guide Services', 'All Tolls & Parking'],
    ARRAY['Monument Entry Fees', 'Personal Expenses', 'Flight/Train Tickets']
  ),
  (
    'pkg-2',
    'Magical Manali & Rohtang Escape',
    'Hill Station',
    5,
    4,
    ARRAY['Manali', 'Solang Valley', 'Atal Tunnel'],
    16500,
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    '[
      {"day": 1, "title": "Arrival in Manali", "description": "Check-in at luxury resort. Evening walk at Mall Road and Old Manali."},
      {"day": 2, "title": "Solang Valley & Atal Tunnel", "description": "Enjoy snow adventures, paragliding, and visit Sissu via Atal Tunnel."},
      {"day": 3, "title": "Hadimba Temple & Local Sightseeing", "description": "Visit ancient Hadimba Temple, Vashisht Hot Springs, and Tibetan Monastery."},
      {"day": 4, "title": "Kullu & Naggar Castle", "description": "Excursion to Naggar Castle and river rafting in Kullu valley."},
      {"day": 5, "title": "Departure", "description": "Board evening AC Volvo bus or taxi back to Chandigarh/Delhi."}
    ]'::jsonb,
    ARRAY['Luxury Mountain View Room', 'Daily Breakfast & Dinner', 'Dedicated Cab for Sightseeing', 'Pickup from Bus Stand/Airport'],
    ARRAY['Adventure Sports Charges', 'Rohtang Pass Permit Fee', 'Lunches']
  ),
  (
    'pkg-3',
    'Goa Tropical Paradise',
    'Beach',
    4,
    3,
    ARRAY['North Goa', 'South Goa'],
    14999,
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    '[
      {"day": 1, "title": "Welcome to Goa", "description": "Transfer to beach resort in Baga/Calangute. Evening relaxation by the beach."},
      {"day": 2, "title": "North Goa Beach Hopping", "description": "Visit Anjuna, Vagator, Aguada Fort, and experience vibrant beach shacks."},
      {"day": 3, "title": "South Goa Heritage & Churches", "description": "Explore Basilica of Bom Jesus, Mangueshi Temple, and Miramar Beach cruise."},
      {"day": 4, "title": "Departure", "description": "Shopping at Panjim market and drop at Dabolim/Mopa Airport."}
    ]'::jsonb,
    ARRAY['3 Nights Beach Resort Stay', 'Airport Transfers in AC Cab', 'Daily Breakfast', 'Mandovi River Cruise Ticket'],
    ARRAY['Water Sports', 'Meals other than Breakfast', 'Personal Bar/Laundry']
  ),
  (
    'pkg-4',
    'Divine Kashi & Ayodhya Pilgrimage',
    'Spiritual',
    5,
    4,
    ARRAY['Varanasi', 'Ayodhya', 'Prayagraj'],
    18000,
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
    '[
      {"day": 1, "title": "Arrival in Varanasi", "description": "Check-in and attend the world-famous evening Ganga Aarti at Dashashwamedh Ghat."},
      {"day": 2, "title": "Kashi Vishwanath & Sarnath", "description": "Early morning boat ride on Ganges, Kashi Vishwanath darshan, and Sarnath tour."},
      {"day": 3, "title": "Drive to Prayagraj & Ayodhya", "description": "Holy dip at Triveni Sangam in Prayagraj, proceed to Ayodhya."},
      {"day": 4, "title": "Shri Ram Janmabhoomi Darshan", "description": "Visit the grand Ram Mandir, Hanuman Garhi, and Kanak Bhawan in Ayodhya."},
      {"day": 5, "title": "Departure", "description": "Transfer to Lucknow or Varanasi airport/railway station."}
    ]'::jsonb,
    ARRAY['Comfortable Hotel Accommodation', 'AC Vehicle for Entire Tour', 'Special Darshan Assistance', 'All Breakfasts & Vegetarian Dinners'],
    ARRAY['VIP Darshan Tickets (if any)', 'Boat Ride fee', 'Donations/Offerings']
  ),
  (
    'pkg-5',
    'Jim Corbett Safari & Adventure',
    'Wildlife/Adventure',
    4,
    3,
    ARRAY['Corbett National Park', 'Nainital'],
    15500,
    'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80',
    '[
      {"day": 1, "title": "Arrival in Corbett", "description": "Welcome drink at jungle resort. Evening wildlife movie show and bonfire."},
      {"day": 2, "title": "Jungle Safari & River Walk", "description": "Early morning jeep safari in tiger reserve zone. Afternoon visit to Garjiya Temple."},
      {"day": 3, "title": "Excursion to Nainital", "description": "Day trip to Lake City Nainital. Boat ride on Naini Lake and ropeway visit."},
      {"day": 4, "title": "Departure", "description": "Morning nature walk and transfer back to Delhi/Ramnagar station."}
    ]'::jsonb,
    ARRAY['1 Jeep Safari per person', 'Jungle Resort with Swimming Pool', 'All 3 Meals (Breakfast, Lunch, Dinner)', 'Nainital Excursion Cab'],
    ARRAY['Video Camera Fees', 'Personal Tips', 'Any additional safari']
  ),
  (
    'pkg-6',
    'Romantic Kerala Backwaters & Tea Gardens',
    'Honeymoon',
    6,
    5,
    ARRAY['Munnar', 'Alleppey', 'Cochin'],
    28500,
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    '[
      {"day": 1, "title": "Arrival in Cochin to Munnar", "description": "Scenic drive past Cheeyappara waterfalls to tea garden town of Munnar."},
      {"day": 2, "title": "Munnar Tea Estates & Eravikulam", "description": "Visit Tata Tea Museum, Mattupetty Dam, and Echo Point."},
      {"day": 3, "title": "Munnar to Alleppey Houseboat", "description": "Drive to Alleppey. Board traditional luxury houseboat for overnight cruise."},
      {"day": 4, "title": "Alleppey to Cochin Heritage", "description": "Disembark houseboat and drive to Fort Kochi. Visit Chinese Fishing Nets."},
      {"day": 5, "title": "Sunset Harbor Cruise", "description": "Romantic sunset cruise in Cochin harbor and Kathakali cultural show."},
      {"day": 6, "title": "Departure", "description": "Drop at Cochin International Airport."}
    ]'::jsonb,
    ARRAY['1 Night Deluxe Houseboat with All Meals', '4 Nights 4-Star Resort Stay', 'Flower Decoration & Honeymoon Cake', 'Private Sedan Cab throughout'],
    ARRAY['Entry fees at national parks', 'Ayurvedic massages', 'Airfare']
  ),
  (
    'pkg-7',
    'Golden Triangle Family Getaway',
    'Family',
    5,
    4,
    ARRAY['Delhi', 'Agra', 'Jaipur'],
    21000,
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80',
    '[
      {"day": 1, "title": "Delhi Sightseeing", "description": "Visit India Gate, Qutub Minar, Lotus Temple, and drive past Rashtrapati Bhavan."},
      {"day": 2, "title": "Delhi to Agra & Taj Mahal", "description": "Drive via Yamuna Expressway. Visit the breathtaking Taj Mahal and Agra Fort."},
      {"day": 3, "title": "Agra to Jaipur via Fatehpur Sikri", "description": "En-route visit the abandoned Mughal capital. Evening arrival in Jaipur."},
      {"day": 4, "title": "Jaipur Royal Experience", "description": "Elephant ride at Amber Fort, shopping at Bapu Bazaar, and cultural dinner."},
      {"day": 5, "title": "Return to Delhi", "description": "Smooth drive back to Delhi airport or railway station."}
    ]'::jsonb,
    ARRAY['Spacious Family Rooms', 'Daily Breakfast & Dinner', 'AC Innova/Ertiga SUV for family', 'English/Hindi speaking Tour Guide'],
    ARRAY['Monument entrance tickets', 'Camera fees', 'Personal shopping']
  ),
  (
    'pkg-8',
    'Meghalaya Clouds & Waterfalls',
    'Hill Station',
    6,
    5,
    ARRAY['Shillong', 'Cherrapunji', 'Dawki'],
    26000,
    'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80',
    '[
      {"day": 1, "title": "Guwahati to Shillong", "description": "Pickup from Guwahati airport, visit Umiam Lake en route to Scotland of the East."},
      {"day": 2, "title": "Shillong to Cherrapunji", "description": "Visit Elephant Falls, Nohkalikai Falls, and Mawsmai Cave."},
      {"day": 3, "title": "Living Root Bridges", "description": "Trek to the amazing Double Decker Living Root Bridge or relax by Seven Sisters falls."},
      {"day": 4, "title": "Crystal Clear Dawki & Mawlynnong", "description": "Boat ride on transparent Umngot River in Dawki, visit cleanest village Mawlynnong."},
      {"day": 5, "title": "Return to Shillong", "description": "Visit Shillong Peak, Don Bosco Museum, and Ward Lake."},
      {"day": 6, "title": "Departure from Guwahati", "description": "Drive down to Guwahati airport with unforgettable memories."}
    ]'::jsonb,
    ARRAY['Boutique Hill Resort Accommodations', 'Private AC Cab from Guwahati', 'Daily Breakfast & Dinner', 'Local Guides in Cherrapunji/Dawki'],
    ARRAY['Boating fees in Dawki', 'Entry tickets to waterfalls/caves', 'Lunches']
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  duration_days = EXCLUDED.duration_days,
  duration_nights = EXCLUDED.duration_nights,
  destinations = EXCLUDED.destinations,
  base_price = EXCLUDED.base_price,
  image_url = EXCLUDED.image_url,
  itinerary = EXCLUDED.itinerary,
  inclusions = EXCLUDED.inclusions,
  exclusions = EXCLUDED.exclusions;
