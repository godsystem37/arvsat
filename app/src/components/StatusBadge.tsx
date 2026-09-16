import { Text, View } from 'react-native';
import { BookingStatus, STATUS_LABEL } from '../lib/types';

const tones: Record<BookingStatus, string> = {
  new: 'bg-[#EEE4D2] text-ink',
  confirmed: 'bg-[#DCEBE4] text-forest',
  cancelled: 'bg-[#EFE7E1] text-muted',
  refund_requested: 'bg-[#F6E1D6] text-clay',
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${tones[status].split(' ')[0]}`}>
      <Text className={`text-xs font-semibold ${tones[status].split(' ')[1]}`}>
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
}
