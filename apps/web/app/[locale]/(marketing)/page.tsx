import { cacheLife, cacheTag } from 'next/cache';
import Link from 'next/link';

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  Code2,
  Compass,
  Globe2,
  Layers3,
  Megaphone,
  MousePointer2,
  Palette,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import appConfig from '~/config/app.config';
import { pageMetadata, serializeJsonLd } from '~/lib/seo';
import { getDirectoryClient } from '~/lib/supabase/directory-client';

import { HomeSearch } from './_components/home-search';

import styles from './home.module.css';

export const metadata = pageMetadata(
  'Selletive — Encontre o próximo parceiro da sua empresa',
  'Descubra empresas e prestadores de serviços B2B. Compare especialidades, localização e avaliações para escolher seu próximo parceiro.',
  '/',
);

const specialties = [
  { key: 'marketing', term: 'Marketing', icon: Megaphone },
  { key: 'design', term: 'Design', icon: Palette },
  { key: 'technology', term: 'Tecnologia', icon: Code2 },
] as const;

const categoryIcons = [Megaphone, Palette, Code2, Globe2, Layers3, Building2];

async function Home() {
  'use cache';
  cacheLife('hours');
  cacheTag('directory');

  const client = getDirectoryClient();
  const [t, categoryResult, businessResult] = await Promise.all([
    getTranslations('marketing.home'),
    client
      .from('categories')
      .select('id, name, slug, description')
      .eq('is_active', true)
      .eq('level', 1)
      .order('name')
      .limit(6),
    client
      .from('businesses')
      .select('id, name, slug, description')
      .order('name')
      .limit(4),
  ]);

  if (categoryResult.error) throw categoryResult.error;
  if (businessResult.error) throw businessResult.error;

  const categories = categoryResult.data ?? [];
  const businesses = businessResult.data ?? [];

  return (
    <main className={styles.home} data-test="workable-home">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Selletive',
            url: appConfig.url,
            inLanguage: 'pt-BR',
          }),
        }}
      />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.liveDot} aria-hidden="true" />
              {t('eyebrow')}
            </p>
            <h1 id="hero-title" className={styles.heroTitle}>
              {t('heroTitle')} <span>{t('heroAccent')}</span>
            </h1>
            <p className={styles.heroDescription}>{t('heroDescription')}</p>
            <HomeSearch />
            <div className={styles.popular}>
              <span>{t('popular')}</span>
              {specialties.map(({ key, term }) => (
                <Link key={key} href={`/search?q=${encodeURIComponent(term)}`}>
                  {t(key)}
                </Link>
              ))}
            </div>
            <p className={styles.heroNote}>
              <Check size={16} aria-hidden="true" /> {t('freeSearch')}
              <span aria-hidden="true">·</span> {t('yourPace')}
            </p>
          </div>

          <div className={styles.discovery}>
            <div className={styles.discoveryHeading}>
              <span className={styles.miniBrand}>
                <Compass size={19} aria-hidden="true" /> selletive
              </span>
              <span className={styles.discoveryPill}>
                {t('discoveryLabel')}
              </span>
            </div>
            <div className={styles.discoveryOrbit} aria-hidden="true">
              <div className={styles.orbitRing} />
              <div className={styles.orbitRingInner} />
              <span className={styles.orbitDot} />
              <span className={styles.orbitStar}>
                <Sparkles size={23} />
              </span>
              <div className={styles.orbitCore}>
                <Compass size={44} strokeWidth={1.5} />
              </div>
            </div>
            <div className={styles.discoveryCopy}>
              <p>{t('discoveryTitle')}</p>
              <span>{t('discoveryDescription')}</span>
            </div>
            <div className={styles.specialtyStack}>
              {specialties.map(({ key, term, icon: Icon }, index) => (
                <Link
                  key={key}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className={styles.specialtyCard}
                >
                  <span className={styles.specialtyIcon} data-tone={index}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{t(key)}</strong>
                    <small>{t(`${key}Hint`)}</small>
                  </span>
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
              ))}
            </div>
            <div className={styles.discoveryFoot}>
              <span>
                <span className={styles.liveDot} aria-hidden="true" />{' '}
                {t('discoveryFoot')}
              </span>
              <MousePointer2 size={16} aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className={`${styles.container} ${styles.heroBottom}`}>
          <span>{t('heroBottom')}</span>
          <a href="#especialidades">
            {t('exploreBelow')} <ArrowDown size={15} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section
        id="especialidades"
        className={styles.section}
        aria-labelledby="categories-title"
      >
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>{t('categoriesEyebrow')}</p>
              <h2 id="categories-title">{t('categoriesTitle')}</h2>
              <p className={styles.sectionDescription}>
                {t('categoriesDescription')}
              </p>
            </div>
            <Link href="/categories" className={styles.textLink}>
              {t('allCategories')} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          {categories.length ? (
            <div className={styles.categoryGrid}>
              {categories.map((category, index) => {
                const Icon =
                  categoryIcons[index % categoryIcons.length] ?? Building2;
                return (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className={styles.categoryCard}
                    data-tone={index % 3}
                  >
                    <div className={styles.categoryTop}>
                      <span className={styles.categoryIcon}>
                        <Icon size={24} strokeWidth={1.7} aria-hidden="true" />
                      </span>
                      <ArrowUpRight size={21} aria-hidden="true" />
                    </div>
                    <h3>{category.name}</h3>
                    <p>
                      {category.description ||
                        t('categoryFallback', { category: category.name })}
                    </p>
                    <span className={styles.categoryAction}>
                      {t('exploreCategory')}{' '}
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Compass size={28} aria-hidden="true" />
              <h3>{t('emptyTitle')}</h3>
              <p>{t('emptyDescription')}</p>
              <Link href="/search" className={styles.textLink}>
                {t('searchAction')} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section
        id="como-funciona"
        className={`${styles.section} ${styles.processSection}`}
        aria-labelledby="process-title"
      >
        <div className={styles.container}>
          <div className={styles.centerHeading}>
            <p className={styles.eyebrow}>{t('processEyebrow')}</p>
            <h2 id="process-title">{t('processTitle')}</h2>
            <p className={styles.sectionDescription}>
              {t('processDescription')}
            </p>
          </div>
          <div className={styles.processGrid}>
            {[
              { key: 'find', icon: Search },
              { key: 'understand', icon: SlidersHorizontal },
              { key: 'connect', icon: ArrowUpRight },
            ].map(({ key, icon: Icon }, index) => (
              <div key={key} className={styles.processStep}>
                <div className={styles.stepTop}>
                  <span className={styles.stepIcon}>
                    <Icon size={25} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <span className={styles.stepNumber}>0{index + 1}</span>
                </div>
                <h3>{t(`${key}Title`)}</h3>
                <p>{t(`${key}Description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="choice-title">
        <div className={styles.container}>
          <div className={styles.featureGrid}>
            <div className={`${styles.featurePanel} ${styles.featureMint}`}>
              <p className={styles.eyebrow}>{t('choiceEyebrow')}</p>
              <h2 id="choice-title">{t('choiceTitle')}</h2>
              <p>{t('choiceDescription')}</p>
              <Link href="/search" className={styles.textLink}>
                {t('searchAction')} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <div className={styles.criteriaCard}>
                <div className={styles.criteriaHeading}>
                  <SlidersHorizontal size={18} aria-hidden="true" />
                  <strong>{t('criteriaTitle')}</strong>
                </div>
                {[
                  t('criteriaService'),
                  t('criteriaLocation'),
                  t('criteriaProfile'),
                ].map((criterion) => (
                  <div key={criterion} className={styles.criteriaRow}>
                    <span>{criterion}</span>
                    <Check size={17} aria-hidden="true" />
                  </div>
                ))}
                <span className={styles.criteriaFoot}>{t('criteriaFoot')}</span>
              </div>
            </div>
            <div className={`${styles.featurePanel} ${styles.featureBlue}`}>
              <p className={styles.eyebrow}>{t('clarityEyebrow')}</p>
              <h2>{t('clarityTitle')}</h2>
              <p>{t('clarityDescription')}</p>
              <Link href="/categories" className={styles.textLink}>
                {t('exploreServices')}{' '}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <div className={styles.serviceTiles}>
                {specialties.map(({ key, term, icon: Icon }) => (
                  <Link
                    key={key}
                    href={`/search?q=${encodeURIComponent(term)}`}
                  >
                    <Icon size={25} strokeWidth={1.5} aria-hidden="true" />
                    <span>{t(key)}</span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {businesses.length ? (
        <section
          className={`${styles.section} ${styles.businessSection}`}
          aria-labelledby="businesses-title"
        >
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>{t('businessEyebrow')}</p>
                <h2 id="businesses-title">{t('businessTitle')}</h2>
                <p className={styles.sectionDescription}>
                  {t('businessDescription')}
                </p>
              </div>
              <Link href="/search" className={styles.textLink}>
                {t('allBusinesses')} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.businessGrid}>
              {businesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/company/${business.slug}`}
                  className={styles.businessCard}
                >
                  <span className={styles.businessInitial} aria-hidden="true">
                    {business.name.charAt(0)}
                  </span>
                  <h3>{business.name}</h3>
                  <p>{business.description || t('businessFallback')}</p>
                  <span className={styles.textLink}>
                    {t('viewBusiness')}{' '}
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.ctaSection} aria-labelledby="cta-title">
        <div className={`${styles.container} ${styles.ctaInner}`}>
          <div className={styles.ctaMark} aria-hidden="true">
            <Compass size={46} strokeWidth={1.3} />
          </div>
          <p className={styles.eyebrow}>{t('ctaEyebrow')}</p>
          <h2 id="cta-title">{t('ctaTitle')}</h2>
          <p>{t('ctaDescription')}</p>
          <Link href="/categories" className={styles.accentButton}>
            {t('ctaAction')} <ArrowRight size={19} aria-hidden="true" />
          </Link>
          <span className={styles.ctaNote}>{t('ctaNote')}</span>
        </div>
      </section>

      <section
        className={styles.providerSection}
        aria-labelledby="provider-title"
      >
        <div className={`${styles.container} ${styles.providerInner}`}>
          <div className={styles.providerIcon}>
            <Building2 size={27} strokeWidth={1.6} aria-hidden="true" />
          </div>
          <div>
            <p className={styles.eyebrow}>{t('providerEyebrow')}</p>
            <h2 id="provider-title">{t('providerTitle')}</h2>
            <p>{t('providerDescription')}</p>
          </div>
          <Link href="/claim" className={styles.secondaryButton}>
            {t('providerAction')} <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;
