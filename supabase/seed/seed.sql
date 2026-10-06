-- ============================================================
-- VELVET BLOOM CAFÉ — REALISTIC SEED DATA
-- ============================================================

-- 1. CAFE SETTINGS
INSERT INTO cafe_settings (id, cafe_name, tagline, tech_brand, tax_rate, service_charge_rate, currency, is_ordering_paused, busy_message, average_prep_time_minutes)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Velvet Bloom Café',
  'Sip. Savor. Bloom.',
  'Powered by Kage Origin',
  5.00,
  0.00,
  '₹',
  FALSE,
  'The kitchen is currently experiencing high demand. Orders may take slightly longer.',
  15
) ON CONFLICT (id) DO NOTHING;

-- 2. USERS (STAFF & OWNER)
INSERT INTO users (id, full_name, email, role, pin_code, phone, is_active)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Alexander Vance (Owner)', 'owner@velvetbloom.com', 'OWNER', '1111', '+91 98765 43210', TRUE),
  ('b0000000-0000-0000-0000-000000000002', 'Marcus Chen (Head Chef)', 'chef@velvetbloom.com', 'CHEF', '2222', '+91 98765 43211', TRUE),
  ('b0000000-0000-0000-0000-000000000003', 'Elena Rostova (Head Waiter)', 'waiter@velvetbloom.com', 'WAITER', '3333', '+91 98765 43212', TRUE),
  ('b0000000-0000-0000-0000-000000000004', 'David Miller (Cashier)', 'cashier@velvetbloom.com', 'CASHIER', '4444', '+91 98765 43213', TRUE),
  ('b0000000-0000-0000-0000-000000000005', 'Sophia Williams (General Manager)', 'manager@velvetbloom.com', 'MANAGER', '5555', '+91 98765 43214', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. TABLES (12 Luxury Tables)
INSERT INTO tables (id, table_number, qr_code_token, capacity, status)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Table 1', 'vb_tbl_01_tok99a', 2, 'AVAILABLE'),
  ('c0000000-0000-0000-0000-000000000002', 'Table 2', 'vb_tbl_02_tok88b', 2, 'AVAILABLE'),
  ('c0000000-0000-0000-0000-000000000003', 'Table 3', 'vb_tbl_03_tok77c', 4, 'AVAILABLE'),
  ('c0000000-0000-0000-0000-000000000004', 'Table 4', 'vb_tbl_04_tok66d', 4, 'AVAILABLE'),
  ('c0000000-0000-0000-0000-000000000005', 'Table 5', 'vb_tbl_05_tok55e', 4, 'AVAILABLE'),
  ('c0000000-0000-0000-0000-000000000006', 'Table 6', 'vb_tbl_06_tok44f', 6, 'AVAILABLE'),
  ('c0000000-0000-0000-0000-000000000007', 'Table 7', 'vb_tbl_07_tok33g', 6, 'AVAILABLE'),
  ('c0000000-0000-0000-0000-000000000008', 'Table 8', 'vb_tbl_08_tok22h', 4, 'AVAILABLE'),
  ('c0000000-0000-0000-0000-000000000009', 'Table 9 (Terrace)', 'vb_tbl_09_tok11i', 2, 'AVAILABLE'),
  ('c0000000-0000-0000-0000-000000000010', 'Table 10 (Terrace)', 'vb_tbl_10_tok00j', 4, 'AVAILABLE'),
  ('c0000000-0000-0000-0000-000000000011', 'Table 11 (VIP Booth)', 'vb_tbl_11_tok98k', 8, 'AVAILABLE'),
  ('c0000000-0000-0000-0000-000000000012', 'Table 12 (VIP Lounge)', 'vb_tbl_12_tok87l', 8, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- 4. CATEGORIES
INSERT INTO categories (id, name, display_order, icon, is_active)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Artisan Coffee', 1, 'coffee', TRUE),
  ('d0000000-0000-0000-0000-000000000002', 'Gourmet Sandwiches & Burgers', 2, 'utensils', TRUE),
  ('d0000000-0000-0000-0000-000000000003', 'Wood-Fired Artisanal Pizzas', 3, 'pizza', TRUE),
  ('d0000000-0000-0000-0000-000000000004', 'Bloom Pastries & Desserts', 4, 'cake', TRUE),
  ('d0000000-0000-0000-0000-000000000005', 'Botanical Mocktails & Cold Brews', 5, 'glass-water', TRUE),
  ('d0000000-0000-0000-0000-000000000006', 'Rare Teas & Herbal Infusions', 6, 'cup-soda', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. MENU ITEMS
INSERT INTO menu_items (id, category_id, name, description, price, image_url, is_veg, is_available, is_bestseller, is_chef_special, preparation_time_minutes, calories, average_rating, total_reviews)
VALUES
  -- Artisan Coffee
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Rose Gold Velvet Latte', 'Signature espresso infused with organic Damask rose reduction, Madagascar vanilla, and microfoam crowned with edible 24k gold leaf flakes.', 320.00, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, TRUE, TRUE, 8, 180, 4.9, 128),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Smoked Cinnamon Flat White', 'Double shot of single-origin Ethiopian roast with steamed oat milk, smoked lightly over Ceylon cinnamon bark.', 280.00, 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, TRUE, FALSE, 7, 140, 4.8, 94),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'Dark Truffle Mocha', '70% Valrhona dark chocolate melted into rich ristretto shots with silky frothed whole milk and cocoa dust.', 310.00, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, FALSE, FALSE, 8, 260, 4.7, 72),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'Nitro Cold Brew with Vanilla Cream', 'Slow steeped for 24 hours under nitrogen pressure, topped with hand-shaken vanilla bean sweet cream float.', 290.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, TRUE, FALSE, 5, 95, 4.9, 110),

  -- Gourmet Sandwiches & Burgers
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', 'Smoked Rosemary Chicken Brioche Burger', 'Crispy buttermilk free-range chicken, smoked gouda, pickled shallots, charred jalapeño aioli on toasted brioche.', 440.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop', FALSE, TRUE, TRUE, TRUE, 18, 620, 4.9, 156),
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002', 'Truffled Wild Mushroom Croque Monsieur', 'Portobello & oyster mushrooms sautéed in thyme butter, gruyère béchamel, artisan sourdough crust.', 390.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, FALSE, TRUE, 15, 480, 4.8, 88),
  ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000002', 'Avocado Burrata Tartine', 'Crushed Hass avocado, fresh pugliese burrata, heirloom cherry tomatoes, cold-pressed basil oil on grilled seeded rye.', 420.00, 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, TRUE, FALSE, 12, 410, 4.9, 102),

  -- Wood-Fired Pizzas
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', 'San Marzano Truffle Margherita', 'San Marzano DOP tomato passata, fior di latte mozzarella, fresh sweet basil, white truffle oil drizzle.', 520.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, TRUE, FALSE, 20, 750, 4.8, 142),
  ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000003', 'Charred Pepperoni & Hot Honey Pizza', 'Crisp beef pepperoni cups, smoked scamorza, house hot honey glaze, fresh oregano on 48-hr fermented dough.', 590.00, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop', FALSE, TRUE, TRUE, TRUE, 22, 860, 4.9, 210),

  -- Bloom Pastries & Desserts
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000004', 'Velvet Pistachio Raspberry Tart', 'Silky Bronte pistachio ganache, tart raspberry confit encased in a crisp black cocoa sablé shell.', 340.00, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, TRUE, TRUE, 5, 340, 5.0, 96),
  ('e0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000004', 'Warm Basque Burnt Cheesecake', 'Caramelized crust with an ultra-creamy molten center, served with wild blackberry coulis.', 360.00, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, TRUE, FALSE, 5, 410, 4.9, 134),

  -- Botanical Mocktails
  ('e0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000005', 'Sparkling Yuzu Butterfly Blossom', 'Japanese yuzu citrus, butterfly pea flower extract, elderflower tonic, served over crystal ice spheres.', 270.00, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, TRUE, FALSE, 6, 80, 4.8, 67),
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000005', 'Smoked Hibiscus Paloma', 'Mexican hibiscus flower tea, pink grapefruit soda, smoked Himalayan salt rim, fresh lime zest.', 260.00, 'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, FALSE, FALSE, 6, 75, 4.7, 53),

  -- Rare Teas
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000006', 'First Flush Darjeeling Silver Needles', 'Hand-plucked spring buds with delicate floral and peach notes, brewed in a glass infuser.', 290.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800&auto=format&fit=crop', TRUE, TRUE, FALSE, FALSE, 6, 0, 4.9, 44)
ON CONFLICT (id) DO NOTHING;

-- 6. MENU TRANSLATIONS (Telugu 'te', Hindi 'hi')
INSERT INTO menu_translations (menu_item_id, language_code, name, description)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'te', 'రోజ్ గోల్డ్ వెల్వెట్ లాటే', 'ప్రత్యేకమైన గులాబీ సువాసన మరియు 24 క్యారెట్ల బంగారు రేకులతో కూడిన వెల్వెట్ ఎస్ప్రెస్సో.'),
  ('e0000000-0000-0000-0000-000000000001', 'hi', 'रोज़ गोल्ड वेलवेट लट्टे', 'दमिश्क गुलाब और 24 कैरेट सोने की पत्तियों के साथ सुगंधित विशेष एस्प्रेसो।'),
  ('e0000000-0000-0000-0000-000000000005', 'te', 'స్మోక్డ్ రోజ్మేరీ చికెన్ బర్గర్', 'క్రిస్పీ చికెన్, స్మోక్డ్ గౌడా చీజ్ మరియు జలాపెనో సాస్ తో చేసిన బర్గర్.'),
  ('e0000000-0000-0000-0000-000000000005', 'hi', 'स्मोक्ड रोज़मेरी चिकन बर्गर', 'कुरकुरा चिकन, गौडा चीज़ और ज़लापेनो सॉस के साथ लजीज बर्गर।'),
  ('e0000000-0000-0000-0000-000000000008', 'te', 'సన్ మార్జానో ట్రఫుల్ మార్గరీటా పిజ్జా', 'ఇటాలియన్ టమోటాలు, తాజా మోజారెల్లా మరియు వైట్ ట్రఫుల్ ఆయిల్ పిజ్జా.'),
  ('e0000000-0000-0000-0000-000000000008', 'hi', 'सैन मार्जानो ट्रफल मार्गेरीटा पिज्जा', 'प्रामाणिक इतालवी टमाटर, मोज़ेरेला और ट्रफल ऑयल से बना पिज्जा।')
ON CONFLICT (menu_item_id, language_code) DO NOTHING;

-- 7. CUSTOMIZATION GROUPS & OPTIONS
-- For Burger ('e0000000-0000-0000-0000-000000000005')
INSERT INTO customization_groups (id, menu_item_id, name, min_selectable, max_selectable, is_required, display_order)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 'Extra Gourmet Add-ons', 0, 3, FALSE, 1),
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000005', 'Spice Preference', 1, 1, TRUE, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customization_options (id, group_id, name, extra_price, display_order)
VALUES
  ('f0000000-0000-0000-0001-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Extra Smoked Gouda Cheese', 45.00, 1),
  ('f0000000-0000-0000-0001-000000000002', 'f0000000-0000-0000-0000-000000000001', 'Crispy Bacon Strips', 75.00, 2),
  ('f0000000-0000-0000-0001-000000000003', 'f0000000-0000-0000-0000-000000000001', 'Truffle Mayo Dip', 35.00, 3),
  ('f0000000-0000-0000-0001-000000000004', 'f0000000-0000-0000-0000-000000000002', 'Mild / Gentle', 0.00, 1),
  ('f0000000-0000-0000-0001-000000000005', 'f0000000-0000-0000-0000-000000000002', 'Medium Spice', 0.00, 2),
  ('f0000000-0000-0000-0001-000000000006', 'f0000000-0000-0000-0000-000000000002', 'Extra Fiery Kick', 0.00, 3)
ON CONFLICT (id) DO NOTHING;

-- For Coffee ('e0000000-0000-0000-0000-000000000001')
INSERT INTO customization_groups (id, menu_item_id, name, min_selectable, max_selectable, is_required, display_order)
VALUES
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'Choice of Milk', 1, 1, TRUE, 1),
  ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'Sweetness Level', 1, 1, TRUE, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customization_options (id, group_id, name, extra_price, display_order)
VALUES
  ('f0000000-0000-0000-0001-000000000007', 'f0000000-0000-0000-0000-000000000003', 'Organic Whole Milk', 0.00, 1),
  ('f0000000-0000-0000-0001-000000000008', 'f0000000-0000-0000-0000-000000000003', 'Barista Oat Milk', 40.00, 2),
  ('f0000000-0000-0000-0001-000000000009', 'f0000000-0000-0000-0000-000000000003', 'Almond Milk', 40.00, 3),
  ('f0000000-0000-0000-0001-000000000010', 'f0000000-0000-0000-0000-000000000004', 'Standard Sweetness', 0.00, 1),
  ('f0000000-0000-0000-0001-000000000011', 'f0000000-0000-0000-0000-000000000004', 'Less Sweet (50%)', 0.00, 2),
  ('f0000000-0000-0000-0001-000000000012', 'f0000000-0000-0000-0000-000000000004', 'Unsweetened (Zero Sugar)', 0.00, 3)
ON CONFLICT (id) DO NOTHING;

