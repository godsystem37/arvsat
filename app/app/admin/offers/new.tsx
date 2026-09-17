import { useRouter } from 'expo-router';
import { useState } from 'react';
import { OfferEditor } from '../../../src/components/OfferEditor';
import { api } from '../../../src/lib/api';
import { OfferField } from '../../../src/lib/types';

export default function NewOfferScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(payload: {
    title: string;
    price: number;
    limit: number;
    published: boolean;
    fields: OfferField[];
  }) {
    setSaving(true);
    setError(null);
    try {
      const offer = await api.createOffer(payload);
      router.replace(`/admin/offers/${offer.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не сохранилось');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OfferEditor
      title="Новое событие"
      saving={saving}
      error={error}
      onSubmit={save}
    />
  );
}
