/**
 * @name getSubscriptionIntervalType
 * @description Infer the billing interval from a subscription's renewal date.
 *
 * Lemon Squeezy does not expose a reliable interval field on the subscription
 * object, and `billing_anchor` is a day-of-month (1-31), not an interval count.
 * We therefore derive the interval from the distance to the next renewal date,
 * which is the authoritative source shared by the webhook handler and the
 * billing strategy service.
 */
export function getSubscriptionIntervalType(renewsAt: string) {
  const renewalDate = new Date(renewsAt);
  const currentDate = new Date();

  // Calculate the difference in milliseconds
  const timeDifference = renewalDate.getTime() - currentDate.getTime();

  // Convert milliseconds to days
  const daysDifference = timeDifference / (1000 * 3600 * 24);

  if (daysDifference <= 32) {
    return {
      interval: 'month',
      intervalCount: 1,
    };
  }

  return {
    interval: 'year',
    intervalCount: 1,
  };
}
