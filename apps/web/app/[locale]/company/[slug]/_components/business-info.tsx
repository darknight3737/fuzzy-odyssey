import Link from 'next/link';

import { Globe, Lock, Mail, MapPin, Phone } from 'lucide-react';

import { safeWebsite } from '~/lib/seo';

import { BusinessContactLink } from './business-interest';

type Business = {
  id: string;
  name?: string;
  tier: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  address_description?: string | null;
  social_links?: Array<{ label: string; href: string }>;
  business_categories?: Array<{
    is_primary: boolean;
    categories: { name: string; slug: string; is_active: boolean } | null;
  }>;
  business_locations?: Array<{
    locations: { name: string; slug: string } | null;
  }>;
};

type BusinessInfoProps = {
  business: Business;
};

const chip =
  'inline-flex min-h-8 items-center rounded-full border border-[#dce5e1] px-3 text-[13px] font-medium text-[#333e49]';
const chipLink = `${chip} hover:border-[#00756a] hover:text-[#004038]`;

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Globe;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 border-b border-[#dce5e1] py-4 last:border-b-0">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-[#6f7073]"
      />
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-[#0f161e]">{label}</p>
        <div className="mt-0.5 [overflow-wrap:anywhere] text-[#3d3e45]">
          {children}
        </div>
      </div>
    </li>
  );
}

export function BusinessInfo({ business }: BusinessInfoProps) {
  const canContact = ['verified', 'highlight', 'spotlight'].includes(
    business.tier,
  );
  const activeCategories = business.business_categories?.filter(
    (entry) => entry.categories?.is_active,
  );
  const primaryCategory = (
    activeCategories?.find((entry) => entry.is_primary) ?? activeCategories?.[0]
  )?.categories;
  const link = 'text-[#00756a] underline hover:text-[#004038]';
  const hasContact =
    canContact && (business.website || business.phone || business.email);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-xl border border-[#dce5e1] bg-white px-6 py-2">
        <ul>
          {canContact && business.website && (
            <Row icon={Globe} label="Site">
              <BusinessContactLink
                businessId={business.id}
                event="website"
                href={safeWebsite(business.website)}
                target="_blank"
                rel="noopener noreferrer"
                className={link}
              >
                {business.website}
              </BusinessContactLink>
            </Row>
          )}
          {canContact && business.phone && (
            <Row icon={Phone} label="Telefone">
              <BusinessContactLink
                businessId={business.id}
                event="phone"
                href={`tel:${business.phone}`}
                className={link}
              >
                {business.phone}
              </BusinessContactLink>
            </Row>
          )}
          {canContact && business.email && (
            <Row icon={Mail} label="E-mail">
              <BusinessContactLink
                businessId={business.id}
                event="email"
                href={`mailto:${business.email}`}
                className={link}
              >
                {business.email}
              </BusinessContactLink>
            </Row>
          )}
          {business.address_description && (
            <Row icon={MapPin} label="Endereço">
              {business.address_description}
            </Row>
          )}
          {!hasContact && (
            <Row icon={Lock} label="Contato direto indisponível">
              Esta empresa ainda não verificou o perfil na Selletive. Salve-a na
              sua lista ou explore empresas parecidas.
            </Row>
          )}
        </ul>
        {!!business.social_links?.length && (
          <div className="flex gap-4 border-t border-[#dce5e1] py-4 text-sm">
            {business.social_links.map((social) => (
              <a
                key={social.href}
                className={link}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {business.business_categories &&
          business.business_categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#0f161e]">
                Categorias
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {business.business_categories.map(
                  (bc, idx) =>
                    bc.categories &&
                    (bc.categories.is_active ? (
                      <Link
                        key={idx}
                        href={`/categories/${bc.categories.slug}`}
                        data-test="business-category-link"
                        className={chipLink}
                      >
                        {bc.categories.name}
                      </Link>
                    ) : (
                      <span key={idx} className={chip}>
                        {bc.categories.name}
                      </span>
                    )),
                )}
              </div>
            </div>
          )}

        {business.business_locations &&
          business.business_locations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#0f161e]">
                Localizações
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {business.business_locations.map(
                  (bl, idx) =>
                    bl.locations &&
                    (primaryCategory ? (
                      <Link
                        key={idx}
                        href={`/${primaryCategory.slug}/${bl.locations.slug}`}
                        data-test="business-location-link"
                        className={chipLink}
                      >
                        {bl.locations.name}
                      </Link>
                    ) : (
                      <span key={idx} className={chip}>
                        {bl.locations.name}
                      </span>
                    )),
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
