'use client';

import { useRef, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Monitor,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@kit/ui/button';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Spinner } from '@kit/ui/spinner';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import { taxonomyKind } from '~/lib/directory/taxonomy';
import { type OfferingInput, OfferingSchema } from '~/lib/offerings/schema';

import { createOfferingAction } from '../_lib/actions';
import { type OfferingCategory, CategoryPicker } from './category-picker';
import { OfferingFieldControl } from './offering-field-control';
import { useWebsiteImport } from './use-website-import';

const steps = [
  'typeStep',
  'detailsStep',
  'categoriesStep',
  'reviewStep',
] as const;

export function OfferingForm({
  initial,
  categories,
  vendors,
}: {
  initial: { name: string; site: string };
  categories: OfferingCategory[];
  vendors: { id: string; name: string }[];
}) {
  const t = useTranslations('offering');
  const form = useForm({
    resolver: zodResolver(OfferingSchema),
    defaultValues: {
      name: initial.name,
      website: initial.site,
      description: '',
      vendor_business_id: '',
      category_ids: [],
    },
  });
  const [flow, setFlow] = useState<{ step: number; review?: OfferingInput }>({
    step: 0,
  });
  const heading = useRef<HTMLHeadingElement>(null);
  const action = useAction(createOfferingAction, {
    onNavigation: () => setFlow({ step: 0 }),
  });
  const issue = action.result.data?.issue;
  const [kind, website, description] = useWatch({
    control: form.control,
    name: ['offering_kind', 'website', 'description'] as const,
  });
  const websiteImport = useWebsiteImport(website, flow.step === 1, form);
  const review = flow.review;

  function goTo(step: number, draft?: OfferingInput) {
    action.reset();
    setFlow({ step, review: draft });
    // Focus the new step title after React commits the screen change.
    requestAnimationFrame(() => heading.current?.focus());
  }

  return (
    <div className="space-y-4">
      <ol
        aria-label={t('progress')}
        className="grid grid-cols-4 gap-2 sm:gap-3"
      >
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={index === flow.step ? 'step' : undefined}
            className={cn(
              'border-muted text-muted-foreground flex flex-col gap-1 border-t-2 pt-2 text-xs sm:flex-row sm:gap-2 sm:text-sm',
              index <= flow.step && 'border-primary',
              index === flow.step && 'text-foreground font-semibold',
            )}
          >
            <span>{index + 1}.</span> {t(label)}
          </li>
        ))}
      </ol>

      <section className="bg-card space-y-5 rounded-2xl border p-4 shadow-sm sm:space-y-6 sm:p-7">
        <div className="space-y-1">
          <h2
            ref={heading}
            tabIndex={-1}
            className="text-xl font-semibold outline-none sm:text-2xl"
          >
            {t(steps[flow.step]!)}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t(
              flow.step === 0
                ? 'chooseKind'
                : flow.step === 1
                  ? 'detailsHelp'
                  : flow.step === 2
                    ? 'categoriesHelp'
                    : 'reviewHelp',
            )}
          </p>
        </div>

        {review ? (
          <section aria-label={t('preview')} className="space-y-5">
            <div className="bg-muted/30 space-y-3 rounded-xl border p-4 sm:p-5">
              <p className="text-primary text-sm font-medium">
                {t(review.offering_kind)}
              </p>
              <h3 className="text-2xl font-semibold break-words">
                {review.name}
              </h3>
              <p className="break-words whitespace-pre-wrap">
                {review.description}
              </p>
              <ul className="flex flex-wrap gap-2">
                {categories
                  .filter(({ id }) => review.category_ids.includes(id))
                  .map(({ id, name }) => (
                    <li
                      key={id}
                      className="bg-background rounded-full border px-3 py-1 text-sm"
                    >
                      {name}
                    </li>
                  ))}
              </ul>
              <p className="text-muted-foreground text-sm break-all">
                {review.website}
              </p>
              {review.vendor_business_id && (
                <p className="text-muted-foreground text-sm">
                  {t('reviewVendor', {
                    name:
                      vendors.find(({ id }) => id === review.vendor_business_id)
                        ?.name ?? '',
                  })}
                </p>
              )}
            </div>

            {issue === 'invalid' && (
              <p role="alert" className="text-destructive text-sm">
                {t('invalidPublication')}
              </p>
            )}
            {(issue === 'unknown' ||
              action.result.serverError ||
              action.result.validationErrors) && (
              <p role="alert" className="text-destructive text-sm">
                {t('publishError')}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                type="button"
                data-test="offering-edit"
                disabled={action.isPending}
                onClick={() => goTo(1)}
              >
                <ArrowLeft aria-hidden /> {t('edit')}
              </Button>
              <Button
                type="button"
                data-test="offering-publish"
                disabled={action.isPending}
                onClick={() => action.execute(review)}
              >
                {action.isPending && <Spinner aria-hidden />}
                {t(action.isPending ? 'publishing' : 'publish')}
              </Button>
            </div>
          </section>
        ) : (
          <Form {...form}>
            <form
              noValidate
              className="space-y-5"
              onSubmit={async (event) => {
                event.preventDefault();
                if (flow.step === 1) {
                  if (
                    await form.trigger(
                      ['website', 'name', 'description', 'vendor_business_id'],
                      { shouldFocus: true },
                    )
                  )
                    goTo(2);
                } else if (flow.step === 2) {
                  await form.handleSubmit(
                    (draft) => goTo(3, draft),
                    (errors) => {
                      if (
                        errors.website ||
                        errors.name ||
                        errors.description ||
                        errors.vendor_business_id
                      )
                        goTo(1);
                      else form.setFocus('category_ids');
                    },
                  )(event);
                }
              }}
            >
              {flow.step === 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['software', 'service'] as const).map((value) => {
                    const Icon =
                      value === 'software' ? Monitor : BriefcaseBusiness;
                    return (
                      <button
                        key={value}
                        type="button"
                        data-test={`offering-kind-${value}`}
                        onClick={() => {
                          if (kind !== value) form.setValue('category_ids', []);
                          form.setValue('offering_kind', value);
                          if (value === 'service')
                            form.setValue('vendor_business_id', '');
                          goTo(1);
                        }}
                        className={cn(
                          'bg-background hover:border-primary hover:bg-primary/5 focus-visible:ring-ring flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                          kind === value && 'border-primary bg-primary/5',
                        )}
                      >
                        <span className="bg-primary/10 text-primary rounded-lg p-2">
                          <Icon aria-hidden className="size-5" />
                        </span>
                        <span className="space-y-1">
                          <span className="block font-semibold">
                            {t(value)}
                          </span>
                          <span className="text-muted-foreground block text-sm">
                            {t(
                              value === 'software'
                                ? 'softwareHelp'
                                : 'serviceHelp',
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {flow.step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('website')}</FormLabel>
                        <OfferingFieldControl
                          render={
                            <Input
                              {...field}
                              inputMode="url"
                              autoComplete="url"
                              maxLength={2048}
                              className="h-11"
                              placeholder="empresa.com.br"
                              data-test="offering-website"
                              onChange={(event) => {
                                websiteImport.updateWebsite(event.target.value);
                                field.onChange(event);
                              }}
                            />
                          }
                        />
                        <FormDescription>{t('websiteHelp')}</FormDescription>
                        {websiteImport.status && (
                          <p
                            role="status"
                            className="text-muted-foreground flex items-center gap-2 text-sm"
                          >
                            {websiteImport.status === 'loading' && (
                              <Spinner aria-hidden />
                            )}
                            {t(`websiteImport.${websiteImport.status}`)}
                          </p>
                        )}
                        {websiteImport.status === 'unavailable' && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="w-fit px-0"
                            data-test="offering-import-retry"
                            onClick={websiteImport.retry}
                          >
                            {t('retryImport')}
                          </Button>
                        )}
                        <FormMessage role="alert" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t(
                            kind === 'software'
                              ? 'softwareName'
                              : 'serviceName',
                          )}
                        </FormLabel>
                        <OfferingFieldControl
                          render={
                            <Input
                              {...field}
                              onChange={(event) => {
                                websiteImport.markEdited('name');
                                field.onChange(event);
                              }}
                              maxLength={160}
                              className="h-11"
                              data-test="offering-name"
                            />
                          }
                        />
                        <FormMessage role="alert" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('description')}</FormLabel>
                        <OfferingFieldControl
                          render={
                            <Textarea
                              {...field}
                              onChange={(event) => {
                                websiteImport.markEdited('description');
                                field.onChange(event);
                              }}
                              placeholder={t(
                                kind === 'software'
                                  ? 'softwareDescriptionExample'
                                  : 'serviceDescriptionExample',
                              )}
                              rows={3}
                              maxLength={10000}
                              data-test="offering-description"
                            />
                          }
                        />
                        <FormDescription>
                          {t('descriptionHelp', {
                            count: description.trim().length,
                          })}
                        </FormDescription>
                        <FormMessage role="alert" />
                      </FormItem>
                    )}
                  />
                  {kind === 'software' && vendors.length > 0 && (
                    <FormField
                      control={form.control}
                      name="vendor_business_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('vendor')}</FormLabel>
                          <OfferingFieldControl
                            render={
                              <select
                                {...field}
                                data-test="offering-vendor"
                                className="bg-background border-input focus-visible:ring-ring h-11 w-full rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                              >
                                <option value="">{t('noVendor')}</option>
                                {vendors.map(({ id, name }) => (
                                  <option key={id} value={id}>
                                    {name}
                                  </option>
                                ))}
                              </select>
                            }
                          />
                          <FormMessage role="alert" />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              {flow.step === 2 && (
                <FormField
                  control={form.control}
                  name="category_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('categorySearch')}</FormLabel>
                      <CategoryPicker
                        categories={categories.filter(
                          ({ slug }) => taxonomyKind(slug) === kind,
                        )}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        searchRef={field.ref}
                      />
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />
              )}

              {flow.step > 0 && (
                <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    data-test="offering-back"
                    onClick={() => goTo(flow.step - 1)}
                  >
                    <ArrowLeft aria-hidden /> {t('back')}
                  </Button>
                  <Button
                    type="submit"
                    data-test="offering-next"
                    disabled={form.formState.isSubmitting}
                  >
                    {t(flow.step === 1 ? 'continue' : 'review')}{' '}
                    <ArrowRight aria-hidden />
                  </Button>
                </div>
              )}
            </form>
          </Form>
        )}
      </section>
    </div>
  );
}
