import { MessageSquareQuote } from 'lucide-react';

import {
  SectionHeading,
  Stars,
  formatRating,
  reviewCountLabel,
} from '~/components/directory-ui';

import { ReportReview } from './report-review';
import { ReviewForm } from './review-form';

type Review = {
  id: string;
  reviewer_name: string;
  rating: number;
  title: string | null;
  content: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string | null;
  dimensions: import('~/lib/database.types').Json;
  review_responses: Array<{
    response_text: string;
    status: 'active' | 'hidden';
  }>;
};

type ReviewsSectionProps = {
  businessId: string;
  businessName: string;
  reviews: Review[];
  canReview: boolean;
  kind: string;
  summary: { average: number; count: number };
};

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '·'
  );
}

function dimensionsOf(value: Review['dimensions']) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number',
  );
}

export function ReviewsSection({
  reviews,
  businessId,
  businessName,
  canReview,
  kind,
  summary,
}: ReviewsSectionProps) {
  const approvedReviews = reviews.filter(
    (review) => review.status === 'approved',
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <SectionHeading
          title="Avaliações"
          subtitle={
            <>
              <strong className="text-[#0f161e]">
                {reviewCountLabel(summary.count)}
              </strong>{' '}
              sobre {businessName}
            </>
          }
        />
        {summary.count > 0 && (
          <div
            className="text-right"
            aria-label={`Nota ${formatRating(summary.average)} de 5, ${reviewCountLabel(summary.count)}`}
          >
            <p className="text-[32px] leading-none font-semibold text-[#0f161e]">
              {formatRating(summary.average)}
              <span className="text-lg font-normal text-[#6f7073]">/5</span>
            </p>
            <Stars value={summary.average} size={18} className="mt-2" />
          </div>
        )}
      </div>

      {approvedReviews.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-[#dce5e1] bg-[#f7f9f8] px-6 py-12 text-center">
          <MessageSquareQuote
            aria-hidden="true"
            className="size-6 text-[#6f7073]"
          />
          <p className="mt-3 font-semibold text-[#0f161e]">
            Esta empresa ainda não recebeu avaliações
          </p>
          {canReview && (
            <p className="mt-1 text-sm text-[#3d3e45]">
              Já trabalhou com {businessName}? Compartilhe sua experiência
              abaixo.
            </p>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-[#dce5e1] rounded-xl border border-[#dce5e1]">
          {approvedReviews.map((review) => {
            const dimensions = dimensionsOf(review.dimensions);
            const responses = review.review_responses?.filter(
              (response) => response.status === 'active',
            );
            return (
              <li
                key={review.id}
                className="grid gap-6 p-6 md:grid-cols-[200px_1fr_180px]"
              >
                <div className="flex items-center gap-3 md:flex-col md:items-start">
                  <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#dce5e1] bg-[#f7f9f8] font-semibold text-[#333e49]"
                  >
                    {initials(review.reviewer_name)}
                  </span>
                  <div>
                    <p className="font-semibold [overflow-wrap:anywhere] text-[#0f161e]">
                      {review.reviewer_name}
                    </p>
                    {review.created_at && (
                      <p className="text-sm text-[#6f7073]">
                        <time dateTime={review.created_at}>
                          {dateFormat.format(new Date(review.created_at))}
                        </time>
                      </p>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  {review.title && (
                    <h3 className="font-semibold text-[#0f161e]">
                      {review.title}
                    </h3>
                  )}
                  {review.content && (
                    <p className="mt-2 text-sm whitespace-pre-line text-[#3d3e45]">
                      {review.content}
                    </p>
                  )}
                  {responses?.map((response, index) => (
                    <blockquote
                      key={index}
                      className="mt-4 rounded-lg border-l-2 border-[#00756a] bg-[#f6fefb] p-4 text-sm text-[#3d3e45]"
                    >
                      <strong className="block text-[#004038]">
                        Resposta da empresa
                      </strong>
                      <p className="mt-1 whitespace-pre-line">
                        {response.response_text}
                      </p>
                    </blockquote>
                  ))}
                  <ReportReview reviewId={review.id} />
                </div>
                <div className="rounded-lg bg-[#f7f9f8] p-4">
                  <div
                    className="text-center"
                    aria-label={`Nota geral ${review.rating} de 5`}
                  >
                    <span className="text-2xl font-semibold text-[#0f161e]">
                      {review.rating}
                    </span>
                    <span className="text-sm text-[#6f7073]">/5</span>
                    <Stars
                      value={review.rating}
                      size={14}
                      className="mt-1 flex justify-center"
                    />
                  </div>
                  {dimensions.length > 0 && (
                    <dl className="mt-4 space-y-3 border-t border-[#dce5e1] pt-4">
                      {dimensions.map(([label, value]) => (
                        <div key={label} className="text-center">
                          <dt className="text-[13px] font-medium text-[#333e49]">
                            {label}
                          </dt>
                          <dd aria-label={`${value} de 5`}>
                            <Stars
                              value={value}
                              size={12}
                              className="flex justify-center"
                            />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {canReview && <ReviewForm businessId={businessId} kind={kind} />}
    </div>
  );
}
