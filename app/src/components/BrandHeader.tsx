import { Link } from 'expo-router';
import { Text, View } from 'react-native';

type Props = {
  subtitle?: string;
  admin?: boolean;
};

export function BrandHeader({ subtitle, admin }: Props) {
  return (
    <View className="mb-8 flex-row items-start justify-between gap-4">
      <View className="flex-1">
        <Link href="/">
          <Text className="text-3xl font-semibold text-ink">Сбор</Text>
        </Link>
        <Text className="mt-1 text-base text-muted">
          {subtitle ?? 'Заявка на поездку или товар — без переписки в пяти чатах'}
        </Text>
      </View>
      <Link href={admin ? '/admin/people' : '/admin/login'}>
        <Text className="pt-2 text-sm text-forest">{admin ? 'Админка' : 'Войти'}</Text>
      </Link>
    </View>
  );
}
