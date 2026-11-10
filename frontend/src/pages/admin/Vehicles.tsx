import { useState } from 'react';
import type { FormEvent } from 'react';
import FormField from '../../components/FormField';
import { api, ApiError, assetUrl } from '../../lib/api';
import type { Vehicle } from '../../lib/types';
import { useFetch } from '../../lib/useFetch';

type Panel = { id: string; kind: 'edit' | 'block' };

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Une erreur est survenue';
}

export default function Vehicles() {
  const vehicles = useFetch<Vehicle[]>('/vehicles');

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  // Véhicule dont la photo est en cours d'envoi ou de suppression
  const [photoBusyId, setPhotoBusyId] = useState<string | null>(null);

  // Ajout d'un véhicule
  const [adding, setAdding] = useState(false);
  const [add, setAdd] = useState({ model: '', plateNumber: '' });

  // Modification et blocage
  const [edit, setEdit] = useState({ model: '', plateNumber: '' });
  const [reason, setReason] = useState('');

  const list = vehicles.data ?? [];
  const availableCount = list.filter((v) => v.isAvailable).length;

  function clearMessages() {
    setNotice('');
    setError('');
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    clearMessages();
    setBusy(true);
    try {
      await api('/vehicles', {
        method: 'POST',
        body: { model: add.model.trim(), plateNumber: add.plateNumber.trim() },
      });
      setNotice(`Véhicule ajouté : ${add.model.trim()}.`);
      setAdd({ model: '', plateNumber: '' });
      setAdding(false);
      vehicles.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit(event: FormEvent, vehicle: Vehicle) {
    event.preventDefault();
    clearMessages();
    setBusy(true);
    try {
      await api(`/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        body: { model: edit.model.trim(), plateNumber: edit.plateNumber.trim() },
      });
      setNotice('Véhicule modifié.');
      setPanel(null);
      vehicles.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(vehicle: Vehicle, file: File | undefined) {
    if (!file) return;
    clearMessages();

    // Contrôles rapides côté navigateur (le serveur revérifie tout)
    if (!PHOTO_TYPES.includes(file.type)) {
      setError('Format non pris en charge : utilisez une photo JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Photo trop lourde : 2 Mo maximum. Réduisez-la avant de l’envoyer.');
      return;
    }

    setPhotoBusyId(vehicle.id);
    try {
      const form = new FormData();
      form.append('photo', file);
      await api(`/vehicles/${vehicle.id}/photo`, { method: 'POST', body: form });
      setNotice(`Photo de ${vehicle.model} enregistrée.`);
      vehicles.reload();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 413
          ? 'Photo trop lourde : 2 Mo maximum.'
          : errorMessage(err),
      );
    } finally {
      setPhotoBusyId(null);
    }
  }

  async function removePhoto(vehicle: Vehicle) {
    clearMessages();
    setPhotoBusyId(vehicle.id);
    try {
      await api(`/vehicles/${vehicle.id}/photo`, { method: 'DELETE' });
      setNotice(`Photo de ${vehicle.model} retirée.`);
      vehicles.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPhotoBusyId(null);
    }
  }

  async function setAvailability(vehicle: Vehicle, isAvailable: boolean, why?: string) {
    clearMessages();
    setBusy(true);
    try {
      await api(`/vehicles/${vehicle.id}`, {
        method: 'PATCH',
        body: {
          isAvailable,
          ...(!isAvailable && why?.trim() ? { unavailableReason: why.trim() } : {}),
        },
      });
      setNotice(
        isAvailable
          ? `${vehicle.model} est de nouveau en service.`
          : `${vehicle.model} est bloqué : il n'est plus proposé à la réservation.`,
      );
      setPanel(null);
      setReason('');
      vehicles.reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Véhicules
          </h1>
          {vehicles.data && (
            <p className="mt-1 text-slate-600">
              {availableCount} en service sur {list.length}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setAdding((v) => !v);
            clearMessages();
          }}
          className="rounded-lg bg-signal px-5 py-2.5 font-semibold text-white hover:bg-signal-dark"
        >
          {adding ? 'Fermer' : 'Ajouter un véhicule'}
        </button>
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6"
          aria-label="Ajouter un véhicule"
        >
          <h2 className="font-display text-xl font-bold">Nouveau véhicule</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Modèle"
              name="add-model"
              required
              maxLength={100}
              placeholder="Renault Clio"
              value={add.model}
              onChange={(e) => setAdd({ ...add, model: e.target.value })}
            />
            <FormField
              label="Plaque d'immatriculation"
              name="add-plate"
              required
              minLength={3}
              maxLength={20}
              placeholder="AA-123-BB"
              value={add.plateNumber}
              onChange={(e) => setAdd({ ...add, plateNumber: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-signal px-6 py-2.5 font-bold text-white hover:bg-signal-dark disabled:opacity-60"
          >
            {busy ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-xl bg-green-100 p-4 text-sm font-semibold text-green-900"
        >
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-100 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      {vehicles.loading && <p className="text-slate-600">Chargement...</p>}
      {vehicles.error && (
        <p role="alert" className="text-red-700">
          {vehicles.error}
        </p>
      )}
      {vehicles.data && list.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Aucun véhicule. Sans véhicule, aucune leçon ne peut être réservée : ajoutez-en un.
        </p>
      )}
      {vehicles.data && list.length > 0 && availableCount === 0 && (
        <p role="status" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">
          Tous les véhicules sont bloqués : les élèves ne peuvent plus réserver.
        </p>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {list.map((v) => {
          const open = panel?.id === v.id ? panel.kind : null;
          return (
            <li
              key={v.id}
              className={`overflow-hidden rounded-3xl border bg-white ${
                v.isAvailable ? 'border-slate-200' : 'border-red-200'
              }`}
            >
              {/* Photo du véhicule */}
              <div className="relative aspect-[16/9] bg-gradient-to-br from-navy to-signal">
                {v.photoUrl ? (
                  <img
                    src={assetUrl(v.photoUrl)}
                    alt={`${v.model}, plaque ${v.plateNumber}`}
                    loading="lazy"
                    className={`h-full w-full object-cover ${v.isAvailable ? '' : 'grayscale'}`}
                  />
                ) : (
                  <p className="flex h-full items-center justify-center text-sm font-semibold text-white/80">
                    Pas de photo
                  </p>
                )}
                {photoBusyId === v.id && (
                  <p className="absolute inset-0 flex items-center justify-center bg-navy/70 font-semibold text-white">
                    Envoi en cours...
                  </p>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold">{v.model}</h2>
                    <p className="mt-1 inline-block rounded-md border border-slate-300 bg-mist px-2.5 py-0.5 font-mono text-sm font-semibold">
                      {v.plateNumber}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      v.isAvailable ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {v.isAvailable ? 'En service' : 'Bloqué'}
                  </span>
                </div>

                {!v.isAvailable && (
                  <p className="mt-3 text-sm text-red-800">
                    Motif : {v.unavailableReason ?? 'non précisé'}
                  </p>
                )}

                {open === null && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <label className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold focus-within:ring-2 focus-within:ring-signal hover:bg-slate-50">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={photoBusyId === v.id}
                        onChange={(e) => {
                          void uploadPhoto(v, e.target.files?.[0]);
                          // Permet de renvoyer le même fichier ensuite
                          e.target.value = '';
                        }}
                      />
                      {v.photoUrl ? 'Changer la photo' : 'Ajouter une photo'}
                    </label>
                    {v.photoUrl && (
                      <button
                        type="button"
                        disabled={photoBusyId === v.id}
                        onClick={() => removePhoto(v)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
                      >
                        Retirer la photo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEdit({ model: v.model, plateNumber: v.plateNumber });
                        setPanel({ id: v.id, kind: 'edit' });
                        clearMessages();
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      Modifier
                    </button>
                    {v.isAvailable ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReason('');
                          setPanel({ id: v.id, kind: 'block' });
                          clearMessages();
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        Bloquer
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setAvailability(v, true)}
                        className="rounded-lg bg-signal px-4 py-2 text-sm font-bold text-white hover:bg-signal-dark disabled:opacity-60"
                      >
                        Remettre en service
                      </button>
                    )}
                  </div>
                )}

                {open === 'edit' && (
                  <form
                    onSubmit={(e) => handleEdit(e, v)}
                    className="mt-5 space-y-4 rounded-2xl bg-mist p-5"
                    aria-label={`Modifier ${v.model}`}
                  >
                    <FormField
                      label="Modèle"
                      name={`model-${v.id}`}
                      required
                      maxLength={100}
                      value={edit.model}
                      onChange={(e) => setEdit({ ...edit, model: e.target.value })}
                    />
                    <FormField
                      label="Plaque d'immatriculation"
                      name={`plate-${v.id}`}
                      required
                      minLength={3}
                      maxLength={20}
                      value={edit.plateNumber}
                      onChange={(e) => setEdit({ ...edit, plateNumber: e.target.value })}
                    />
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-lg bg-signal px-5 py-2.5 font-bold text-white hover:bg-signal-dark disabled:opacity-60"
                      >
                        {busy ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPanel(null)}
                        className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}

                {open === 'block' && (
                  <div
                    role="alertdialog"
                    aria-label={`Bloquer ${v.model}`}
                    className="mt-5 space-y-3 rounded-2xl bg-amber-50 p-5"
                  >
                    <p className="font-semibold text-amber-900">Bloquer ce véhicule ?</p>
                    <p className="text-sm text-amber-900">
                      Il ne sera plus proposé à la réservation. Les leçons déjà réservées avec ce
                      véhicule ne sont pas annulées : pensez à les vérifier dans les rendez-vous.
                    </p>
                    <FormField
                      label="Motif (facultatif)"
                      name={`reason-${v.id}`}
                      maxLength={255}
                      placeholder="Panne, entretien, contrôle technique..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setAvailability(v, false, reason)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {busy ? 'Blocage...' : 'Oui, bloquer'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPanel(null)}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}