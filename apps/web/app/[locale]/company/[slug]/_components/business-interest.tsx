'use client';

import { useEffect, useRef } from 'react';
import type { ComponentProps } from 'react';

import type { InterestEvent } from '~/lib/business-analytics/events';

function record(businessId: string, event: InterestEvent) {
  if (
    navigator.doNotTrack === '1' ||
    ('globalPrivacyControl' in navigator && navigator.globalPrivacyControl)
  )
    return;
  // Best effort: a tracking outage must never block profile or contact navigation.
  void fetch('/api/business-interest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId, event }),
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => undefined);
}

export function BusinessView({ businessId }: { businessId: string }) {
  const recorded = useRef<string | null>(null);
  // Browser visibility is unavailable during SSR. Effects run only after the
  // profile is activated, excluding metadata requests and Next link prefetches.
  useEffect(() => {
    const visible = () => {
      if (
        document.visibilityState === 'visible' &&
        recorded.current !==
          `${businessId}:${new Date().toISOString().slice(0, 10)}`
      ) {
        recorded.current = `${businessId}:${new Date().toISOString().slice(0, 10)}`;
        record(businessId, 'view');
      }
    };
    visible();
    document.addEventListener('visibilitychange', visible);
    return () => document.removeEventListener('visibilitychange', visible);
  }, [businessId]);
  return null;
}

export function BusinessContactLink({
  businessId,
  event,
  ...props
}: {
  businessId: string;
  event: Exclude<InterestEvent, 'view'>;
} & Omit<ComponentProps<'a'>, 'onClick' | 'onAuxClick'>) {
  return (
    <a
      data-test={`business-contact-${event}`}
      {...props}
      onClick={() => record(businessId, event)}
      onAuxClick={(e) => {
        if (e.button === 1) record(businessId, event);
      }}
    />
  );
}
