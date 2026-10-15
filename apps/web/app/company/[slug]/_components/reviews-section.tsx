import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

import { ReviewForm } from './review-form';

type Review = {
  id: string;
  reviewer_name: string;
  rating: number;
  title: string | null;
  content: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string | null;
};

type ReviewsSectionProps = {
  businessId: string;
  reviews: Review[];
};

export function ReviewsSection({ reviews, businessId }: ReviewsSectionProps) {
  const approvedReviews = reviews.filter(
    (review) => review.status === 'approved',
  );

  return (
    <div className={'mb-8'}>
      <h2 className={'mb-4 text-2xl font-bold'}>
        <Trans
          i18nKey={'business:reviewsTitle'}
          defaults={'Reviews'}
          values={{ count: approvedReviews.length }}
        />
      </h2>

      {approvedReviews.length === 0 ? (
        <Card>
          <CardContent className={'py-8 text-center'}>
            <p className={'text-muted-foreground'}>
              <Trans
                i18nKey={'business:noReviews'}
                defaults={'No reviews yet. Be the first to review!'}
              />
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={'space-y-4'}>
          {approvedReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className={'flex items-start justify-between'}>
                  <div>
                    <CardTitle className={'text-lg'}>{review.title}</CardTitle>

                    <p className={'text-muted-foreground text-sm'}>
                      {review.reviewer_name}
                    </p>
                  </div>

                  <div className={'flex items-center gap-1'}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < review.rating
                            ? 'text-yellow-500'
                            : 'text-muted-foreground'
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className={'text-sm'}>{review.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ReviewForm businessId={businessId} />
    </div>
  );
}
