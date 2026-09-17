import { Text, View } from 'react-native';
import { BookingStatus, STATUS_LABEL } from '../lib/types';

const tones: Record<BookingStatus, { bg: string; text: string }> = {
  new: { bg: 'bg-cream-soft', text: 'text-ink' },
  confirmed: { bg: 'bg-forest-soft', text: 'text-forest' },
  refund_requested: { bg: 'bg-clay-soft', text: 'text-clay' },
  done: { bg: 'bg-forest', text: 'text-white' },
  cancelled: { bg: 'bg-cream', text: 'text-muted' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const tone = tones[status] ?? tones.new;
  return (
    <View className={`self-start rounded-full px-3 py-1 ${tone.bg}`}>
      <Text className={`text-xs font-semibold ${tone.text}`}>
        {STATUS_LABEL[status] ?? status}
      </Text>
    </View>
  );
}
