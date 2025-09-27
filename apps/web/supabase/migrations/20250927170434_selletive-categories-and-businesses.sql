/*
 * -------------------------------------------------------
 * Migration: Selletive Categories and Fictional Businesses
 * Populates hierarchical service categories and sample business data
 * -------------------------------------------------------
 */

-- Insert hierarchical categories (level 1: main categories)
INSERT INTO public.categories (id, name, slug, description, parent_id, level, icon, is_active) VALUES
-- Level 1: Main Categories
('11111111-1111-1111-1111-111111111001', 'Advertising & Marketing', 'advertising-marketing', 'Marketing and advertising services', NULL, 1, 'megaphone', true),
('11111111-1111-1111-1111-111111111002', 'Creative & Visual', 'creative-visual', 'Design, photography, and visual services', NULL, 1, 'palette', true),
('11111111-1111-1111-1111-111111111003', 'Development & Product', 'development-product', 'Web development and product services', NULL, 1, 'code', true),
('11111111-1111-1111-1111-111111111004', 'IT Services', 'it-services', 'Information technology and cloud services', NULL, 1, 'server', true),
('11111111-1111-1111-1111-111111111005', 'Financial & Professional Services', 'financial-professional', 'Financial and professional consulting', NULL, 1, 'briefcase', true);

-- Insert Level 2: Sub-categories
INSERT INTO public.categories (id, name, slug, description, parent_id, level, icon, is_active) VALUES
-- Advertising & Marketing subcategories
('22222222-2222-2222-2222-222222222001', 'Advertising', 'advertising-services', 'Advertising services and campaigns', '11111111-1111-1111-1111-111111111001', 2, 'megaphone', true),
('22222222-2222-2222-2222-222222222002', 'Branding', 'branding-services', 'Brand strategy and identity services', '11111111-1111-1111-1111-111111111001', 2, 'star', true),
('22222222-2222-2222-2222-222222222003', 'Marketing', 'marketing-services', 'Marketing strategy and execution', '11111111-1111-1111-1111-111111111001', 2, 'trending-up', true),

-- Creative & Visual subcategories
('22222222-2222-2222-2222-222222222004', 'Design', 'design-services', 'Graphic and visual design services', '11111111-1111-1111-1111-111111111002', 2, 'palette', true),
('22222222-2222-2222-2222-222222222005', 'Photography', 'photography-services', 'Professional photography services', '11111111-1111-1111-1111-111111111002', 2, 'camera', true),
('22222222-2222-2222-2222-222222222006', 'User Experience (UX/UI)', 'user-experience-ux-ui-services', 'User experience and interface design', '11111111-1111-1111-1111-111111111002', 2, 'smartphone', true),

-- Development & Product subcategories
('22222222-2222-2222-2222-222222222007', 'Ecommerce', 'ecommerce-services', 'E-commerce development and consulting', '11111111-1111-1111-1111-111111111003', 2, 'shopping-cart', true),
('22222222-2222-2222-2222-222222222008', 'Web Design', 'web-design-services', 'Website design and frontend development', '11111111-1111-1111-1111-111111111003', 2, 'monitor', true),
('22222222-2222-2222-2222-222222222009', 'Web Development', 'web-development-services', 'Backend and full-stack web development', '11111111-1111-1111-1111-111111111003', 2, 'code', true),

-- IT Services subcategories
('22222222-2222-2222-2222-222222222010', 'Blockchain Development', 'blockchain-development-services', 'Blockchain and Web3 development', '11111111-1111-1111-1111-111111111004', 2, 'link', true),
('22222222-2222-2222-2222-222222222011', 'Cloud Consulting', 'cloud-consulting-services', 'Cloud infrastructure and consulting', '11111111-1111-1111-1111-111111111004', 2, 'cloud', true),
('22222222-2222-2222-2222-222222222012', 'Cyber Security', 'cyber-security-services', 'Cybersecurity and data protection', '11111111-1111-1111-1111-111111111004', 2, 'shield', true);

-- Insert Level 3: Specific services
INSERT INTO public.categories (id, name, slug, description, parent_id, level, icon, is_active) VALUES
-- Advertising services
('33333333-3333-3333-3333-333333333001', '360° Advertising', '360-advertising', 'Comprehensive advertising campaigns', '22222222-2222-2222-2222-222222222001', 3, 'megaphone', true),
('33333333-3333-3333-3333-333333333002', 'Advertising Services', 'advertising-services-specific', 'General advertising services', '22222222-2222-2222-2222-222222222001', 3, 'megaphone', true),
('33333333-3333-3333-3333-333333333003', 'Advertising Campaign', 'advertising-campaign', 'Strategic advertising campaigns', '22222222-2222-2222-2222-222222222001', 3, 'target', true),
('33333333-3333-3333-3333-333333333004', 'Advertising Production', 'advertising-production', 'Advertising content production', '22222222-2222-2222-2222-222222222001', 3, 'video', true),
('33333333-3333-3333-3333-333333333005', 'Creative Advertising', 'creative-advertising', 'Creative advertising solutions', '22222222-2222-2222-2222-222222222001', 3, 'lightbulb', true),
('33333333-3333-3333-3333-333333333006', 'Full-Service Advertising', 'full-service-advertising', 'Complete advertising services', '22222222-2222-2222-2222-222222222001', 3, 'layers', true),

-- Branding services
('33333333-3333-3333-3333-333333333007', 'Brand Activation', 'brand-activation', 'Brand activation strategies', '22222222-2222-2222-2222-222222222002', 3, 'zap', true),
('33333333-3333-3333-3333-333333333008', 'Branding Services', 'branding-services-specific', 'Brand identity and strategy', '22222222-2222-2222-2222-222222222002', 3, 'star', true),
('33333333-3333-3333-3333-333333333009', 'Brand Strategy', 'brand-strategy', 'Strategic brand development', '22222222-2222-2222-2222-222222222002', 3, 'compass', true),
('33333333-3333-3333-3333-333333333010', 'Employer Branding', 'employer-branding', 'Employer brand development', '22222222-2222-2222-2222-222222222002', 3, 'users', true),
('33333333-3333-3333-3333-333333333011', 'Rebranding', 'rebranding', 'Brand transformation services', '22222222-2222-2222-2222-222222222002', 3, 'refresh-cw', true),

-- Marketing services
('33333333-3333-3333-3333-333333333012', 'Affiliate Marketing', 'affiliate-marketing', 'Affiliate marketing strategies', '22222222-2222-2222-2222-222222222003', 3, 'link', true),
('33333333-3333-3333-3333-333333333013', 'B2B Marketing', 'b2b-marketing', 'Business-to-business marketing', '22222222-2222-2222-2222-222222222003', 3, 'building', true),
('33333333-3333-3333-3333-333333333014', 'Blockchain Marketing', 'blockchain-marketing', 'Blockchain and crypto marketing', '22222222-2222-2222-2222-222222222003', 3, 'link', true),
('33333333-3333-3333-3333-333333333015', 'Luxury Marketing', 'luxury-marketing', 'Luxury brand marketing', '22222222-2222-2222-2222-222222222003', 3, 'crown', true),
('33333333-3333-3333-3333-333333333016', 'Marketing Services', 'marketing-services-specific', 'General marketing services', '22222222-2222-2222-2222-222222222003', 3, 'trending-up', true),
('33333333-3333-3333-3333-333333333017', 'Sports Marketing', 'sports-marketing', 'Sports industry marketing', '22222222-2222-2222-2222-222222222003', 3, 'trophy', true),

-- Design services
('33333333-3333-3333-3333-333333333018', 'Brochure Design', 'brochure-design', 'Brochure and print design', '22222222-2222-2222-2222-222222222004', 3, 'file-text', true),
('33333333-3333-3333-3333-333333333019', 'Design Services', 'design-services-specific', 'General design services', '22222222-2222-2222-2222-222222222004', 3, 'palette', true),
('33333333-3333-3333-3333-333333333020', 'Illustration', 'illustration', 'Custom illustrations and artwork', '22222222-2222-2222-2222-222222222004', 3, 'pen-tool', true),
('33333333-3333-3333-3333-333333333021', 'Logo Design', 'logo-design', 'Logo and brand identity design', '22222222-2222-2222-2222-222222222004', 3, 'star', true),
('33333333-3333-3333-3333-333333333022', 'Merchandising', 'merchandising', 'Product merchandising design', '22222222-2222-2222-2222-222222222004', 3, 'shopping-bag', true),
('33333333-3333-3333-3333-333333333023', 'Print Design', 'print-design', 'Print media design services', '22222222-2222-2222-2222-222222222004', 3, 'printer', true),

-- Photography services
('33333333-3333-3333-3333-333333333024', 'Event Photography', 'event-photography', 'Event and occasion photography', '22222222-2222-2222-2222-222222222005', 3, 'camera', true),
('33333333-3333-3333-3333-333333333025', 'Fashion Photography', 'fashion-photography', 'Fashion and style photography', '22222222-2222-2222-2222-222222222005', 3, 'camera', true),
('33333333-3333-3333-3333-333333333026', 'Food Photography', 'food-photography', 'Food and culinary photography', '22222222-2222-2222-2222-222222222005', 3, 'camera', true),
('33333333-3333-3333-3333-333333333027', 'Photo Editing', 'photo-editing', 'Professional photo editing', '22222222-2222-2222-2222-222222222005', 3, 'edit', true),
('33333333-3333-3333-3333-333333333028', 'Photography Services', 'photography-services-specific', 'General photography services', '22222222-2222-2222-2222-222222222005', 3, 'camera', true),
('33333333-3333-3333-3333-333333333029', 'Product Photography', 'product-photography', 'Product and commercial photography', '22222222-2222-2222-2222-222222222005', 3, 'camera', true),

-- UX/UI services
('33333333-3333-3333-3333-333333333030', 'Interface Testing', 'interface-testing', 'User interface testing', '22222222-2222-2222-2222-222222222006', 3, 'test-tube', true),
('33333333-3333-3333-3333-333333333031', 'Usability Testing', 'usability-testing', 'Usability and user testing', '22222222-2222-2222-2222-222222222006', 3, 'test-tube', true),
('33333333-3333-3333-3333-333333333032', 'User Experience (UX/UI)', 'user-experience-ux-ui-specific', 'UX/UI design services', '22222222-2222-2222-2222-222222222006', 3, 'smartphone', true),
('33333333-3333-3333-3333-333333333033', 'User Testing', 'user-testing', 'User research and testing', '22222222-2222-2222-2222-222222222006', 3, 'users', true),
('33333333-3333-3333-3333-333333333034', 'UX Design', 'ux-design', 'User experience design', '22222222-2222-2222-2222-222222222006', 3, 'smartphone', true),
('33333333-3333-3333-3333-333333333035', 'UX optimization', 'ux-optimization', 'UX optimization and improvement', '22222222-2222-2222-2222-222222222006', 3, 'trending-up', true),

-- Ecommerce services
('33333333-3333-3333-3333-333333333036', 'Dropshipping', 'dropshipping', 'Dropshipping business setup', '22222222-2222-2222-2222-222222222007', 3, 'truck', true),
('33333333-3333-3333-3333-333333333037', 'Ecommerce Services', 'ecommerce-services-specific', 'General e-commerce services', '22222222-2222-2222-2222-222222222007', 3, 'shopping-cart', true),
('33333333-3333-3333-3333-333333333038', 'eCommerce Consulting', 'ecommerce-consulting', 'E-commerce strategy consulting', '22222222-2222-2222-2222-222222222007', 3, 'briefcase', true),
('33333333-3333-3333-3333-333333333039', 'eCommerce Development', 'ecommerce-development', 'E-commerce platform development', '22222222-2222-2222-2222-222222222007', 3, 'code', true),
('33333333-3333-3333-3333-333333333040', 'E-Commerce Hosting', 'e-commerce-hosting', 'E-commerce hosting solutions', '22222222-2222-2222-2222-222222222007', 3, 'server', true),
('33333333-3333-3333-3333-333333333041', 'Shopify Development', 'shopify-development', 'Shopify store development', '22222222-2222-2222-2222-222222222007', 3, 'shopping-cart', true),

-- Web Design services
('33333333-3333-3333-3333-333333333042', 'Front End Development', 'front-end-development', 'Frontend web development', '22222222-2222-2222-2222-222222222008', 3, 'monitor', true),
('33333333-3333-3333-3333-333333333043', 'Landing Page Design', 'landing-page-design', 'Landing page design and optimization', '22222222-2222-2222-2222-222222222008', 3, 'monitor', true),
('33333333-3333-3333-3333-333333333044', 'Web Design Services', 'web-design-services-specific', 'Website design services', '22222222-2222-2222-2222-222222222008', 3, 'monitor', true),
('33333333-3333-3333-3333-333333333045', 'Web Hosting Management', 'web-hosting-management', 'Web hosting and server management', '22222222-2222-2222-2222-222222222008', 3, 'server', true),
('33333333-3333-3333-3333-333333333046', 'Website Revamping', 'website-revamping', 'Website redesign and revamping', '22222222-2222-2222-2222-222222222008', 3, 'refresh-cw', true),

-- Web Development services
('33333333-3333-3333-3333-333333333047', 'IoT Development', 'iot-development', 'Internet of Things development', '22222222-2222-2222-2222-222222222009', 3, 'wifi', true),
('33333333-3333-3333-3333-333333333048', 'Programming', 'programming', 'Custom programming services', '22222222-2222-2222-2222-222222222009', 3, 'code', true),
('33333333-3333-3333-3333-333333333049', 'Prototype Development', 'prototype-development', 'Software prototype development', '22222222-2222-2222-2222-222222222009', 3, 'layers', true),
('33333333-3333-3333-3333-333333333050', 'Web Development Services', 'web-development-services-specific', 'General web development', '22222222-2222-2222-2222-222222222009', 3, 'code', true),
('33333333-3333-3333-3333-333333333051', 'Webflow Development', 'webflow-development', 'Webflow website development', '22222222-2222-2222-2222-222222222009', 3, 'monitor', true),
('33333333-3333-3333-3333-333333333052', 'Wordpress Development', 'wordpress-development', 'WordPress development and customization', '22222222-2222-2222-2222-222222222009', 3, 'monitor', true),

-- Blockchain Development services
('33333333-3333-3333-3333-333333333053', 'Blockchain Consulting', 'blockchain-consulting', 'Blockchain strategy consulting', '22222222-2222-2222-2222-222222222010', 3, 'briefcase', true),
('33333333-3333-3333-3333-333333333054', 'Blockchain Development', 'blockchain-development', 'Blockchain application development', '22222222-2222-2222-2222-222222222010', 3, 'link', true),
('33333333-3333-3333-3333-333333333055', 'Ethereum', 'ethereum', 'Ethereum development services', '22222222-2222-2222-2222-222222222010', 3, 'link', true),
('33333333-3333-3333-3333-333333333056', 'Initial Coin Offering Consulting', 'initial-coin-offering-consulting', 'ICO strategy and consulting', '22222222-2222-2222-2222-222222222010', 3, 'briefcase', true),
('33333333-3333-3333-3333-333333333057', 'Smart Contract Development', 'smart-contract-development', 'Smart contract development', '22222222-2222-2222-2222-222222222010', 3, 'code', true),
('33333333-3333-3333-3333-333333333058', 'Web3 Development', 'web3-development', 'Web3 application development', '22222222-2222-2222-2222-222222222010', 3, 'link', true),

-- Cloud Consulting services
('33333333-3333-3333-3333-333333333059', 'AWS Consulting', 'aws-consulting', 'Amazon Web Services consulting', '22222222-2222-2222-2222-222222222011', 3, 'cloud', true),
('33333333-3333-3333-3333-333333333060', 'Azure Consulting', 'azure-consulting', 'Microsoft Azure consulting', '22222222-2222-2222-2222-222222222011', 3, 'cloud', true),
('33333333-3333-3333-3333-333333333061', 'Cloud Consulting Services', 'cloud-consulting-services-specific', 'General cloud consulting', '22222222-2222-2222-2222-222222222011', 3, 'cloud', true),
('33333333-3333-3333-3333-333333333062', 'Cloud Security', 'cloud-security', 'Cloud security solutions', '22222222-2222-2222-2222-222222222011', 3, 'shield', true),
('33333333-3333-3333-3333-333333333063', 'Cloud Storage', 'cloud-storage', 'Cloud storage solutions', '22222222-2222-2222-2222-222222222011', 3, 'database', true),
('33333333-3333-3333-3333-333333333064', 'SaaS Strategy Consulting', 'saas-strategy-consulting', 'SaaS strategy and consulting', '22222222-2222-2222-2222-222222222011', 3, 'briefcase', true),

-- Cyber Security services
('33333333-3333-3333-3333-333333333065', 'Account Takeover Prevention (ATO)', 'account-takeover-prevention-ato', 'ATO prevention solutions', '22222222-2222-2222-2222-222222222012', 3, 'shield', true),
('33333333-3333-3333-3333-333333333066', 'Auth0 IAM Solution', 'auth0-iam-solution', 'Auth0 identity management', '22222222-2222-2222-2222-222222222012', 3, 'key', true),
('33333333-3333-3333-3333-333333333067', 'Cyber Security Services', 'cyber-security-services-specific', 'General cybersecurity services', '22222222-2222-2222-2222-222222222012', 3, 'shield', true),
('33333333-3333-3333-3333-333333333068', 'Data Protection', 'data-protection', 'Data protection and privacy', '22222222-2222-2222-2222-222222222012', 3, 'lock', true),
('33333333-3333-3333-3333-333333333069', 'Digital Forensics', 'digital-forensics', 'Digital forensics and investigation', '22222222-2222-2222-2222-222222222012', 3, 'search', true),
('33333333-3333-3333-3333-333333333070', 'Penetration Testing', 'penetration-testing', 'Security penetration testing', '22222222-2222-2222-2222-222222222012', 3, 'test-tube', true);

-- Insert category aliases for SEO
INSERT INTO public.category_aliases (category_id, alias_slug, alias_name, is_primary) VALUES
-- Azure Consulting aliases
('33333333-3333-3333-3333-333333333060', 'microsoft-azure', 'Microsoft Azure', false),
('33333333-3333-3333-3333-333333333060', 'azure-cloud', 'Azure Cloud', false),
('33333333-3333-3333-3333-333333333060', 'cloud-services', 'Cloud Services', false),

-- WordPress Development aliases
('33333333-3333-3333-3333-333333333052', 'wp-development', 'WP Development', false),
('33333333-3333-3333-3333-333333333052', 'wordpress-customization', 'WordPress Customization', false),

-- UI Design aliases
('33333333-3333-3333-3333-333333333034', 'ui-design', 'UI Design', false),
('33333333-3333-3333-3333-333333333034', 'user-interface-design', 'User Interface Design', false),

-- AWS Consulting aliases
('33333333-3333-3333-3333-333333333059', 'amazon-web-services', 'Amazon Web Services', false),
('33333333-3333-3333-3333-333333333059', 'aws-cloud', 'AWS Cloud', false),

-- Blockchain Development aliases
('33333333-3333-3333-3333-333333333054', 'blockchain-apps', 'Blockchain Apps', false),
('33333333-3333-3333-3333-333333333054', 'dapp-development', 'DApp Development', false);

-- Note: Fictional business data will be added separately after user accounts are created
-- This migration focuses on populating the hierarchical category structure
