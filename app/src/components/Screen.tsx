import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  wide?: boolean;
  inShell?: boolean;
};

export function Screen({ children, wide, inShell }: Props) {
  const body = (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className={`w-full self-center ${wide ? 'max-w-5xl' : 'max-w-xl'}`}>
        {children}
      </View>
    </ScrollView>
  );

  if (inShell) {
    return <View className="flex-1 bg-cream">{body}</View>;
  }

  return <SafeAreaView className="flex-1 bg-cream">{body}</SafeAreaView>;
}
