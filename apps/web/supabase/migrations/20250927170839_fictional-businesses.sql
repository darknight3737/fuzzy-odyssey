/*
 * -------------------------------------------------------
 * Migration: Fictional Business Data
 * Creates test user accounts and fictional businesses with category connections
 * -------------------------------------------------------
 */

-- Insert test user accounts (these will be used as primary owners for businesses)
INSERT INTO auth.users (
  id, 
  instance_id, 
  aud, 
  role, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  recovery_sent_at, 
  last_sign_in_at, 
  raw_app_meta_data, 
  raw_user_meta_data, 
  created_at, 
  updated_at, 
  confirmation_token, 
  email_change, 
  email_change_token_new, 
  recovery_token
) VALUES
-- TechFlow Solutions owner
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
 'john@techflow-solutions.com', '$2a$10$dummy.hash.for.testing.purposes.only', NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"name": "John Smith", "avatar_url": "https://example.com/john-avatar.png"}', 
 NOW(), NOW(), '', '', '', ''),

-- Creative Design Studio owner
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
 'sarah@creative-design-studio.com', '$2a$10$dummy.hash.for.testing.purposes.only', NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"name": "Sarah Johnson", "avatar_url": "https://example.com/sarah-avatar.png"}', 
 NOW(), NOW(), '', '', '', ''),

-- CloudScale Consulting owner
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
 'mike@cloudscale-consulting.com', '$2a$10$dummy.hash.for.testing.purposes.only', NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"name": "Mike Chen", "avatar_url": "https://example.com/mike-avatar.png"}', 
 NOW(), NOW(), '', '', '', ''),

-- Digital Marketing Pro owner
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
 'lisa@digital-marketing-pro.com', '$2a$10$dummy.hash.for.testing.purposes.only', NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"name": "Lisa Rodriguez", "avatar_url": "https://example.com/lisa-avatar.png"}', 
 NOW(), NOW(), '', '', '', ''),

-- SecureIT Services owner
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
 'david@secureit-services.com', '$2a$10$dummy.hash.for.testing.purposes.only', NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"name": "David Wilson", "avatar_url": "https://example.com/david-avatar.png"}', 
 NOW(), NOW(), '', '', '', ''),

-- WebCraft Studios owner
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
 'emma@webcraft-studios.com', '$2a$10$dummy.hash.for.testing.purposes.only', NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"name": "Emma Thompson", "avatar_url": "https://example.com/emma-avatar.png"}', 
 NOW(), NOW(), '', '', '', ''),

-- Blockchain Innovations owner
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
 'alex@blockchain-innovations.com', '$2a$10$dummy.hash.for.testing.purposes.only', NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"name": "Alex Kumar", "avatar_url": "https://example.com/alex-avatar.png"}', 
 NOW(), NOW(), '', '', '', ''),

-- UX Design Lab owner
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
 'jessica@ux-design-lab.com', '$2a$10$dummy.hash.for.testing.purposes.only', NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"name": "Jessica Lee", "avatar_url": "https://example.com/jessica-avatar.png"}', 
 NOW(), NOW(), '', '', '', ''),

-- Ecommerce Experts owner
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
 'robert@ecommerce-experts.com', '$2a$10$dummy.hash.for.testing.purposes.only', NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"name": "Robert Brown", "avatar_url": "https://example.com/robert-avatar.png"}', 
 NOW(), NOW(), '', '', '', ''),

-- PhotoVision Studio owner
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
 'maria@photovision-studio.com', '$2a$10$dummy.hash.for.testing.purposes.only', NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"name": "Maria Garcia", "avatar_url": "https://example.com/maria-avatar.png"}', 
 NOW(), NOW(), '', '', '', '');

-- Insert team accounts for businesses
INSERT INTO public.accounts (id, primary_owner_user_id, name, slug, email, is_personal_account, picture_url, created_at, updated_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001', 'TechFlow Solutions', 'techflow-solutions', 'contact@techflow-solutions.com', false, 'https://example.com/techflow-logo.png', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002', 'Creative Design Studio', 'creative-design-studio', 'hello@creative-design-studio.com', false, 'https://example.com/creative-logo.png', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003', 'CloudScale Consulting', 'cloudscale-consulting', 'info@cloudscale-consulting.com', false, 'https://example.com/cloudscale-logo.png', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0004', 'Digital Marketing Pro', 'digital-marketing-pro', 'team@digital-marketing-pro.com', false, 'https://example.com/marketing-logo.png', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0005', 'SecureIT Services', 'secureit-services', 'security@secureit-services.com', false, 'https://example.com/secureit-logo.png', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0006', 'WebCraft Studios', 'webcraft-studios', 'hello@webcraft-studios.com', false, 'https://example.com/webcraft-logo.png', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0007', 'Blockchain Innovations', 'blockchain-innovations', 'contact@blockchain-innovations.com', false, 'https://example.com/blockchain-logo.png', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0008', 'UX Design Lab', 'ux-design-lab', 'research@ux-design-lab.com', false, 'https://example.com/ux-logo.png', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0009', 'Ecommerce Experts', 'ecommerce-experts', 'sales@ecommerce-experts.com', false, 'https://example.com/ecommerce-logo.png', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0010', 'PhotoVision Studio', 'photovision-studio', 'bookings@photovision-studio.com', false, 'https://example.com/photovision-logo.png', NOW(), NOW());

-- Insert fictional businesses
INSERT INTO public.businesses (
  id, account_id, name, slug, description, website, phone, email, 
  address, logo_url, cover_image_url, employee_count, works_remotely, 
  founded_year, business_languages, contact_enabled, tier, 
  verification_status, domain_rating, created_at, updated_at
) VALUES
-- TechFlow Solutions - Azure Consulting (Primary), WordPress Development (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0001', 'TechFlow Solutions', 'techflow-solutions', 
 'Leading cloud consulting firm specializing in Microsoft Azure solutions and modern web development.', 
 'https://techflow-solutions.com', '+1-555-0101', 'contact@techflow-solutions.com',
 '{"street": "123 Tech Street", "city": "San Francisco", "state": "CA", "zip": "94105", "country": "US"}',
 'https://example.com/techflow-logo.png', 'https://example.com/techflow-cover.jpg', 25, true, 2018, 
 '{"en", "es"}', true, 'verified', 'verified', 85, NOW(), NOW()),

-- Creative Design Studio - UI Design (Primary), Logo Design (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0002', 'Creative Design Studio', 'creative-design-studio',
 'Award-winning design studio focused on user experience and brand identity design.',
 'https://creative-design-studio.com', '+1-555-0102', 'hello@creative-design-studio.com',
 '{"street": "456 Design Ave", "city": "New York", "state": "NY", "zip": "10001", "country": "US"}',
 'https://example.com/creative-logo.png', 'https://example.com/creative-cover.jpg', 12, false, 2020,
 '{"en"}', true, 'highlight', 'verified', 92, NOW(), NOW()),

-- CloudScale Consulting - AWS Consulting (Primary), Cloud Security (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0003', 'CloudScale Consulting', 'cloudscale-consulting',
 'Expert AWS cloud consulting and security solutions for enterprise clients.',
 'https://cloudscale-consulting.com', '+1-555-0103', 'info@cloudscale-consulting.com',
 '{"street": "789 Cloud Blvd", "city": "Seattle", "state": "WA", "zip": "98101", "country": "US"}',
 'https://example.com/cloudscale-logo.png', 'https://example.com/cloudscale-cover.jpg', 18, true, 2019,
 '{"en", "fr"}', true, 'spotlight', 'verified', 88, NOW(), NOW()),

-- Digital Marketing Pro - Marketing (Primary), B2B Marketing (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0004', 'Digital Marketing Pro', 'digital-marketing-pro',
 'Full-service digital marketing agency specializing in B2B growth strategies.',
 'https://digital-marketing-pro.com', '+1-555-0104', 'team@digital-marketing-pro.com',
 '{"street": "321 Marketing St", "city": "Austin", "state": "TX", "zip": "73301", "country": "US"}',
 'https://example.com/marketing-logo.png', 'https://example.com/marketing-cover.jpg', 15, true, 2017,
 '{"en", "es", "pt"}', true, 'verified', 'verified', 90, NOW(), NOW()),

-- SecureIT Services - Cyber Security (Primary), Penetration Testing (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0005', 'SecureIT Services', 'secureit-services',
 'Cybersecurity experts providing comprehensive security solutions and penetration testing.',
 'https://secureit-services.com', '+1-555-0105', 'security@secureit-services.com',
 '{"street": "654 Security Way", "city": "Boston", "state": "MA", "zip": "02101", "country": "US"}',
 'https://example.com/secureit-logo.png', 'https://example.com/secureit-cover.jpg', 22, true, 2016,
 '{"en"}', true, 'verified', 'verified', 87, NOW(), NOW()),

-- WebCraft Studios - Web Development (Primary), Front End Development (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0006', 'WebCraft Studios', 'webcraft-studios',
 'Modern web development studio creating responsive and scalable web applications.',
 'https://webcraft-studios.com', '+1-555-0106', 'hello@webcraft-studios.com',
 '{"street": "987 Web Street", "city": "Portland", "state": "OR", "zip": "97201", "country": "US"}',
 'https://example.com/webcraft-logo.png', 'https://example.com/webcraft-cover.jpg', 8, true, 2021,
 '{"en", "de"}', false, 'claimed', 'pending', 75, NOW(), NOW()),

-- Blockchain Innovations - Blockchain Development (Primary), Smart Contract Development (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0007', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0007', 'Blockchain Innovations', 'blockchain-innovations',
 'Cutting-edge blockchain development company specializing in DeFi and smart contracts.',
 'https://blockchain-innovations.com', '+1-555-0107', 'contact@blockchain-innovations.com',
 '{"street": "147 Blockchain Ave", "city": "Miami", "state": "FL", "zip": "33101", "country": "US"}',
 'https://example.com/blockchain-logo.png', 'https://example.com/blockchain-cover.jpg', 14, true, 2020,
 '{"en", "es"}', true, 'highlight', 'verified', 89, NOW(), NOW()),

-- UX Design Lab - UX Design (Primary), Usability Testing (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0008', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0008', 'UX Design Lab', 'ux-design-lab',
 'User experience research and design laboratory focused on usability and user testing.',
 'https://ux-design-lab.com', '+1-555-0108', 'research@ux-design-lab.com',
 '{"street": "258 UX Boulevard", "city": "Chicago", "state": "IL", "zip": "60601", "country": "US"}',
 'https://example.com/ux-logo.png', 'https://example.com/ux-cover.jpg', 10, true, 2019,
 '{"en", "fr", "de"}', true, 'verified', 'verified', 91, NOW(), NOW()),

-- Ecommerce Experts - Shopify Development (Primary), Ecommerce Consulting (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0009', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0009', 'Ecommerce Experts', 'ecommerce-experts',
 'E-commerce specialists providing Shopify development and online store optimization.',
 'https://ecommerce-experts.com', '+1-555-0109', 'sales@ecommerce-experts.com',
 '{"street": "369 Commerce St", "city": "Denver", "state": "CO", "zip": "80201", "country": "US"}',
 'https://example.com/ecommerce-logo.png', 'https://example.com/ecommerce-cover.jpg', 16, false, 2018,
 '{"en", "es"}', true, 'verified', 'verified', 86, NOW(), NOW()),

-- PhotoVision Studio - Photography (Primary), Product Photography (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0010', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0010', 'PhotoVision Studio', 'photovision-studio',
 'Professional photography studio specializing in product and commercial photography.',
 'https://photovision-studio.com', '+1-555-0110', 'bookings@photovision-studio.com',
 '{"street": "741 Photo Lane", "city": "Los Angeles", "state": "CA", "zip": "90001", "country": "US"}',
 'https://example.com/photovision-logo.png', 'https://example.com/photovision-cover.jpg', 6, false, 2022,
 '{"en"}', false, 'claimed', 'pending', 78, NOW(), NOW());

-- Connect businesses to categories (business_categories)
INSERT INTO public.business_categories (business_id, category_id, is_primary, display_order) VALUES
-- TechFlow Solutions: Azure Consulting (Primary), WordPress Development (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0001', '33333333-3333-3333-3333-333333333060', true, 1),  -- Azure Consulting
('cccccccc-cccc-cccc-cccc-cccccccc0001', '33333333-3333-3333-3333-333333333052', false, 2), -- WordPress Development

-- Creative Design Studio: UI Design (Primary), Logo Design (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0002', '33333333-3333-3333-3333-333333333034', true, 1),  -- UX Design
('cccccccc-cccc-cccc-cccc-cccccccc0002', '33333333-3333-3333-3333-333333333021', false, 2), -- Logo Design

-- CloudScale Consulting: AWS Consulting (Primary), Cloud Security (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0003', '33333333-3333-3333-3333-333333333059', true, 1),  -- AWS Consulting
('cccccccc-cccc-cccc-cccc-cccccccc0003', '33333333-3333-3333-3333-333333333062', false, 2), -- Cloud Security

-- Digital Marketing Pro: Marketing (Primary), B2B Marketing (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0004', '33333333-3333-3333-3333-333333333016', true, 1),  -- Marketing
('cccccccc-cccc-cccc-cccc-cccccccc0004', '33333333-3333-3333-3333-333333333013', false, 2), -- B2B Marketing

-- SecureIT Services: Cyber Security (Primary), Penetration Testing (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0005', '33333333-3333-3333-3333-333333333067', true, 1),  -- Cyber Security
('cccccccc-cccc-cccc-cccc-cccccccc0005', '33333333-3333-3333-3333-333333333070', false, 2), -- Penetration Testing

-- WebCraft Studios: Web Development (Primary), Front End Development (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0006', '33333333-3333-3333-3333-333333333050', true, 1),  -- Web Development
('cccccccc-cccc-cccc-cccc-cccccccc0006', '33333333-3333-3333-3333-333333333042', false, 2), -- Front End Development

-- Blockchain Innovations: Blockchain Development (Primary), Smart Contract Development (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0007', '33333333-3333-3333-3333-333333333054', true, 1),  -- Blockchain Development
('cccccccc-cccc-cccc-cccc-cccccccc0007', '33333333-3333-3333-3333-333333333057', false, 2), -- Smart Contract Development

-- UX Design Lab: UX Design (Primary), Usability Testing (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0008', '33333333-3333-3333-3333-333333333034', true, 1),  -- UX Design
('cccccccc-cccc-cccc-cccc-cccccccc0008', '33333333-3333-3333-3333-333333333031', false, 2), -- Usability Testing

-- Ecommerce Experts: Shopify Development (Primary), Ecommerce Consulting (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0009', '33333333-3333-3333-3333-333333333041', true, 1),  -- Shopify Development
('cccccccc-cccc-cccc-cccc-cccccccc0009', '33333333-3333-3333-3333-333333333038', false, 2), -- eCommerce Consulting

-- PhotoVision Studio: Photography (Primary), Product Photography (Secondary)
('cccccccc-cccc-cccc-cccc-cccccccc0010', '33333333-3333-3333-3333-333333333028', true, 1),  -- Photography
('cccccccc-cccc-cccc-cccc-cccccccc0010', '33333333-3333-3333-3333-333333333029', false, 2); -- Product Photography



