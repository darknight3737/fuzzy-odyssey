import { Suspense } from 'react';

import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

import { getBillingGatewayProvider } from '@kit/billing-gateway';
import { BillingSessionStatus } from '@kit/billing-gateway/components';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import billingConfig from '~/config/billing.config';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { EmbeddedCheckoutForm } from '../_components/embedded-checkout-form';

interface SessionPageProps {
  searchParams: Promise<{
    session_id: string;
  }>;
}

function ReturnCheckoutSessionPage({ searchParams }: SessionPageProps) {
  return (
    <Suspense fallback={null}>
      <CheckoutSessionStatus searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * The Stripe session id arrives in the query string and the session itself is
 * fetched per request, so both sit behind the boundary.
 */
async function CheckoutSessionStatus({ searchParams }: SessionPageProps) {
  const sessionId = (await searchParams).session_id;

  if (!sessionId) {
    redirect('../');
  }

  const { customerEmail, checkoutToken } = await loadCheckoutSession(sessionId);

  if (checkoutToken) {
    return (
      <EmbeddedCheckoutForm
        checkoutToken={checkoutToken}
        provider={billingConfig.provider}
      />
    );
  }

  return (
    <>
      <div className={'fixed top-48 left-0 z-50 mx-auto w-full'}>
        <BillingSessionStatus
          redirectPath={'../billing'}
          customerEmail={customerEmail ?? ''}
        />
      </div>

      <BlurryBackdrop />
    </>
  );
}

export default ReturnCheckoutSessionPage;

function BlurryBackdrop() {
  return (
    <div
      className={
        'bg-background/30 fixed top-0 left-0 w-full backdrop-blur-sm' +
        ' !m-0 h-full'
      }
    />
  );
}

async function loadCheckoutSession(sessionId: string) {
  await requireUserInServerComponent();

  await connection();

  const client = getSupabaseServerClient();
  const gateway = await getBillingGatewayProvider(client);

  const session = await gateway.retrieveCheckoutSession({
    sessionId,
  });

  if (!session) {
    notFound();
  }

  const checkoutToken = session.isSessionOpen ? session.checkoutToken : null;

  // otherwise - we show the user the return page
  // and display the details of the session
  return {
    status: session.status,
    customerEmail: session.customer.email,
    checkoutToken,
  };
}
