'use client';

import { ArrowRight, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Button } from '@kit/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@kit/ui/form';
import { Input } from '@kit/ui/input';

import styles from '../home.module.css';

export function HomeSearch() {
  const t = useTranslations('marketing.home');
  const form = useForm({ defaultValues: { q: '' } });

  // Search is a native GET navigation, not a mutation or Server Action.
  // Keep the action usable before hydration and leave URL encoding to the browser.
  return (
    <Form {...form}>
      <form action="/search" method="get" role="search" aria-label={t('searchLabel')} className={styles.searchForm}>
        <FormField control={form.control} name="q" render={({ field }) => (
          <FormItem className={styles.searchField}>
            <FormLabel className="sr-only">{t('searchLabel')}</FormLabel>
            <Search size={20} aria-hidden="true" />
            <FormControl render={
              <Input {...field} data-test="homepage-search-input" aria-label={t('searchLabel')} maxLength={120} placeholder={t('searchPlaceholder')} className={styles.searchInput} />
            } />
            <FormDescription className="sr-only">{t('freeSearch')}</FormDescription>
          </FormItem>
        )} />
        <Button type="submit" data-test="homepage-search" className={styles.searchButton}>
          {t('searchButton')} <ArrowRight size={18} aria-hidden="true" />
        </Button>
      </form>
    </Form>
  );
}
