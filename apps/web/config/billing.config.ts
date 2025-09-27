/**
 * Selletive Billing Configuration
 * Highlight ($19/mo) and Spotlight ($129/mo) tiers for business promotion
 */
import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

// The billing provider to use. This should be set in the environment variables
// and should match the provider in the database. We also add it here so we can validate
// your configuration against the selected provider at build time.
const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER,
);

export default createBillingSchema({
  // also update config.billing_provider in the DB to match the selected
  provider,
  // products configuration for Selletive promotion tiers
  products: [
    {
      id: 'highlight',
      name: 'Highlight',
      description: 'Boost your business visibility with enhanced listing features',
      currency: 'USD',
      badge: `Popular`,
      highlighted: true,
      plans: [
        {
          name: 'Highlight Monthly',
          id: 'highlight-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_highlight_monthly',
              name: 'Highlight Tier',
              cost: 19.99,
              type: 'flat' as const,
            },
          ],
        },
        {
          name: 'Highlight Yearly',
          id: 'highlight-yearly',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_highlight_yearly',
              name: 'Highlight Tier',
              cost: 199.99,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: [
        'Enhanced listing visibility',
        'Priority placement in search results',
        'Advanced analytics dashboard',
        'Review management tools',
        'Direct contact optimization',
        'SEO-optimized profile page',
      ],
    },
    {
      id: 'spotlight',
      name: 'Spotlight',
      description: 'Maximum visibility with premium placement and exclusive features',
      currency: 'USD',
      badge: `Premium`,
      plans: [
        {
          name: 'Spotlight Monthly',
          id: 'spotlight-monthly',
          paymentType: 'recurring',
          interval: 'month',
          lineItems: [
            {
              id: 'price_spotlight_monthly',
              name: 'Spotlight Tier',
              cost: 129.99,
              type: 'flat' as const,
            },
          ],
        },
        {
          name: 'Spotlight Yearly',
          id: 'spotlight-yearly',
          paymentType: 'recurring',
          interval: 'year',
          lineItems: [
            {
              id: 'price_spotlight_yearly',
              name: 'Spotlight Tier',
              cost: 1299.99,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: [
        'Top placement in all search results',
        'Premium badge and highlighting',
        'Advanced analytics with lead tracking',
        'Priority customer support',
        'Featured placement on category pages',
        'Enhanced profile customization',
        'Signal matching priority',
        'Exclusive marketplace benefits',
        'Custom SEO optimization',
        'Dedicated account manager',
      ],
    },
  ],
});