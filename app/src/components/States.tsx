import { Text, View } from 'react-native';

export function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <View className="rounded-3xl border border-dashed border-line bg-paper px-5 py-8">
      <Text className="text-lg font-semibold text-ink">{title}</Text>
      <Text className="mt-2 text-base leading-6 text-muted">{text}</Text>
    </View>
  );
}

export function ErrorState({
  title,
  text,
}: {
  title?: string;
  text: string;
}) {
  return (
    <View className="rounded-3xl border border-danger bg-danger-soft px-5 py-6">
      <Text className="text-lg font-semibold text-danger">{title ?? 'Не получилось'}</Text>
      <Text className="mt-2 text-base leading-6 text-ink">{text}</Text>
    </View>
  );
}
