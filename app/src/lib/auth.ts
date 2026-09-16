import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sbor.admin.token';

export async function getAdminToken() {
  return AsyncStorage.getItem(KEY);
}

export async function setAdminToken(token: string) {
  await AsyncStorage.setItem(KEY, token);
}

export async function clearAdminToken() {
  await AsyncStorage.removeItem(KEY);
}
