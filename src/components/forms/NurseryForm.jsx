import { useEffect, useState } from "react";

export default function NurseryForm({ value, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    lat: "",
    lng: "",
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (value)
      setForm({
        name: value.name || "",
        city: value.city || "",
        address: value.address || "",
        lat: value.lat || "",
        lng: value.lng || "",
      });
  }, [value]);

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
    };
    onSave(payload, file);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm">City</label>
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm">Address</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm">Latitude</label>
          <input
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm">Longitude</label>
          <input
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: e.target.value })}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          className="rounded-md bg-emerald-600 px-4 py-2 text-white"
          type="submit"
        >
          Save
        </button>
        <button
          className="rounded-md border px-4 py-2"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
