import { CalendarCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

/** „Reservierung erforderlich" on a restaurant that takes guests only with a booking. */
export function ReservationBadge() {
  const tCommon = useTranslations('common');
  return (
    <Badge variant="outline" className="text-xs">
      <CalendarCheck className="mr-1 h-3 w-3" />
      {tCommon('reservation')}
    </Badge>
  );
}
