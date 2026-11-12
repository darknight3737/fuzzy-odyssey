/**
 * Selletive Billing Configuration
 * Destaque (R$99/mês) and Spotlight (R$299/mês) tiers for business promotion
 */
import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

// The billing provider to use. This should be set in the environment variables
// and should match the provider in the database. We also add it here so we can validate
// your configuration against the selected provider at build time.
const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER ?? 'stripe',
);

export default createBillingSchema({
  // also update config.billing_provider in the DB to match the selected
  provider,
  // products configuration for Selletive promotion tiers
  products: [
    {
      id: 'highlight',
      name: 'Destaque',
      description:
        'Boost your business visibility with enhanced listing features',
      currency: 'BRL',
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
              cost: 99,
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
              cost: 990,
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
      description:
        'Maximum visibility with premium placement and exclusive features',
      currency: 'BRL',
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
              cost: 299,
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
              cost: 2990,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: [
        'Exposição em segmentos contratados',
        'Premium badge and highlighting',
        'Advanced analytics with lead tracking',
        'Priority customer support',
        'Featured placement on category pages',
        'Enhanced profile customization',
      ],
    },
  ],
});
