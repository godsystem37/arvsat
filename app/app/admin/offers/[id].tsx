import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { OfferEditor } from '../../../src/components/OfferEditor';
import { Screen } from '../../../src/components/Screen';
import { ErrorState } from '../../../src/components/States';
import { api, ApiError } from '../../../src/lib/api';
import { Offer, OfferField } from '../../../src/lib/types';

export default function EditOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .adminOffer(id)
      .then(setOffer)
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiError ? err.message : 'Оффер не найден');
      });
  }, [id]);

  async function save(payload: {
    title: string;
    price: number;
    limit: number;
    published: boolean;
    fields: OfferField[];
  }) {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      setOffer(await api.updateOffer(id, payload));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не сохранилось');
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <Screen>
        <ErrorState text={loadError} />
      </Screen>
    );
  }

  if (!offer) {
    return (
      <Screen>
        <Text className="text-muted">Открываем оффер…</Text>
      </Screen>
    );
  }

  return (
    <OfferEditor
      title="Редактирование"
      initial={offer}
      saving={saving}
      error={error}
      savedHint="Сохранено"
      onSubmit={save}
    />
  );
}
