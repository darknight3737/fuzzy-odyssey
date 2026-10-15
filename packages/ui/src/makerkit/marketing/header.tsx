import { cn } from '../../lib/utils';

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  logo?: React.ReactNode;
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = function ({
  className,
  logo,
  navigation,
  actions,
  ...props
}) {
  return (
    <div
      className={cn(
        'site-header bg-background/80 dark:bg-background/80 sticky top-0 z-10 w-full backdrop-blur-lg',
        className,
      )}
      {...props}
    >
      <div className="container mx-auto flex items-center justify-between py-4">
        {logo}
        {navigation}
        <div className="flex items-center gap-x-2">{actions}</div>
      </div>
    </div>
  );
};
