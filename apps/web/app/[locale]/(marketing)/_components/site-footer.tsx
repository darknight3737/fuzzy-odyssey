import { cacheLife } from 'next/cache';
import Link from 'next/link';

import { Compass } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import styles from '../marketing.module.css';

async function getCopyrightYear() {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const [year, t] = await Promise.all([
    getCopyrightYear(),
    getTranslations('marketing.home'),
  ]);
  const sections = [
    {
      title: t('footerExplore'),
      links: [
        { href: '/categories', label: t('footerCategories') },
        { href: '/search', label: t('footerSearch') },
        { href: '/claim', label: t('footerCompanies') },
      ],
    },
    {
      title: t('footerHelp'),
      links: [
        { href: '/faq', label: t('footerFaq') },
        { href: '/contact', label: t('footerContact') },
        { href: '/claim', label: t('footerClaim') },
      ],
    },
    {
      title: t('footerLegal'),
      links: [
        { href: '/terms-of-service', label: t('footerTerms') },
        { href: '/privacy-policy', label: t('footerPrivacy') },
        { href: '/cookie-policy', label: t('footerCookies') },
      ],
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Link href="/" aria-label="Selletive" className={styles.logo}>
              <Compass aria-hidden="true" /> selletive
            </Link>
            <p className={styles.footerTagline}>{t('footerTagline')}</p>
            <p className={styles.footerDescription}>{t('footerDescription')}</p>
          </div>
          {sections.map((section) => (
            <div key={section.title} className={styles.footerGroup}>
              <h2>{section.title}</h2>
              <ul>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={styles.footerBottom}>
          <p>{t('footerCopyright', { year })}</p>
          <p>{t('footerNote')}</p>
        </div>
      </div>
    </footer>
  );
}
