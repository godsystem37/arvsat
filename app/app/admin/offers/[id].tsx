import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { OfferEditor } from '../../../src/components/OfferEditor';
import { Screen } from '../../../src/components/Screen';
import { ErrorState } from '../../../src/components/States';
import { api, ApiError } from '../../../src/lib/api';
import { Offer, OfferField } from '../../../src/lib/types';

export default function EditOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .adminOffer(id)
      .then(setOffer)
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiError ? err.message : 'Событие не найдено');
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

  async function remove() {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteOffer(id);
      router.replace('/admin/offers');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Не удалось удалить');
    } finally {
      setDeleting(false);
    }
  }

  async function archive() {
    if (!id) return;
    setArchiving(true);
    setError(null);
    try {
      setOffer(await api.archiveOffer(id));
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Не удалось снять событие');
    } finally {
      setArchiving(false);
    }
  }

  async function unarchive() {
    if (!id) return;
    setArchiving(true);
    setError(null);
    try {
      setOffer(await api.unarchiveOffer(id));
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Не удалось вернуть событие');
    } finally {
      setArchiving(false);
    }
  }

  if (loadError) {
    return (
      <Screen inShell>
        <ErrorState text={loadError} />
      </Screen>
    );
  }

  if (!offer) {
    return (
      <Screen inShell>
        <Text className="text-muted">Открываем событие…</Text>
      </Screen>
    );
  }

  return (
    <OfferEditor
      key={`${offer.id}-${offer.archived ? 'arch' : 'live'}`}
      title="Редактирование события"
      initial={offer}
      saving={saving}
      deleting={deleting}
      archiving={archiving}
      error={error}
      savedHint="Сохранено"
      onSubmit={save}
      onDelete={remove}
      onArchive={archive}
      onUnarchive={unarchive}
    />
  );
}
