type BusinessRatingProps = {
  rating: number | null;
  reviewCount: number;
};

export function BusinessRating({ rating, reviewCount }: BusinessRatingProps) {
  if (rating === null) {
    return (
      <div className={'text-muted-foreground flex items-center gap-2 text-sm'}>
        <span>No reviews yet</span>
      </div>
    );
  }

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={'flex items-center gap-2'}>
      <div className={'flex items-center gap-0.5'}>
        <span className={'text-lg font-semibold'}>{rating.toFixed(1)}</span>
        <div className={'flex items-center'}>
          {Array.from({ length: fullStars }).map((_, i) => (
            <span key={`full-${i}`} className={'text-yellow-500'}>
              ★
            </span>
          ))}
          {hasHalfStar && (
            <span key="half" className={'text-yellow-500 opacity-75'}>
              ★
            </span>
          )}
          {Array.from({ length: emptyStars }).map((_, i) => (
            <span key={`empty-${i}`} className={'text-muted-foreground'}>
              ★
            </span>
          ))}
        </div>
      </div>
      <span className={'text-muted-foreground text-sm'}>
        ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}
