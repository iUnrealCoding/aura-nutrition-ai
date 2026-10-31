"use client";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { X, Sparkles, Plus } from "lucide-react";
import {
  api,
  json,
  localTime,
  macros,
  nutrientKeys,
  type Food,
} from "@/lib/models";
export default function FoodLogModal({
  onSaved,
  initial,
  onClose,
}: {
  onSaved: () => void;
  initial?: Food;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(!!initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [image, setImage] = useState<File | null>(null),
    [description, setDescription] = useState(""),
    [notes, setNotes] = useState("");
  const [fields, setFields] = useState<Record<string, string | number>>(() => ({
    ...Object.fromEntries(
      [...macros, ...nutrientKeys].map((k) => [k, initial?.[k] ?? 0]),
    ),
    food_name: initial?.food_name ?? "",
    meal_category: initial?.meal_category ?? "Lunch",
    created_at: localTime(initial?.created_at ?? new Date()),
  }));
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current?.close();
  }, [open]);
  function close() {
    if (busy) return;
    setOpen(false);
    onClose?.();
  }
  async function estimate() {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("description", description);
      if (image) fd.append("file", image);
      const out = await api<{
        data: Record<string, string | number> & { notes: string };
      }>("/api/ai/estimate", { method: "POST", body: fd });
      const { notes, ...values } = out.data;
      setFields((f) => ({ ...f, ...values }));
      setNotes(notes);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let path = initial?.image_url;
      if (image) {
        const fd = new FormData();
        fd.append("file", image);
        path = (
          await api<{ path: string }>("/api/upload", {
            method: "POST",
            body: fd,
          })
        ).path;
      }
      const body = {
        ...fields,
        created_at: new Date(String(fields.created_at)).toISOString(),
        image_url: path ?? null,
      };
      await api(
        "/api/food" + (initial ? "?id=" + initial.id : ""),
        json(initial ? "PATCH" : "POST", body),
      );
      setOpen(false);
      setImage(null);
      onSaved();
      onClose?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const change = (k: string, v: string | number) =>
    setFields((f) => ({ ...f, [k]: v }));
  return (
    <>
      {!initial && (
        <button onClick={() => setOpen(true)}>
          <Plus size={16} />
          Log food
        </button>
      )}
      <dialog
        aria-label="Food entry"
        ref={dialog}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          color: "inherit",
          maxWidth: "100vw",
          maxHeight: "100dvh",
        }}
      >
        <div className="modal-backdrop">
          <div className="modal">
            <div className="between modal-head">
              <div>
                <span className="eyebrow">Nourish your day</span>
                <h2>{initial ? "Edit food entry" : "Log a meal"}</h2>
              </div>
              <button
                type="button"
                className="ghost"
                onClick={close}
                disabled={busy}
                aria-label="Close food entry"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save} className="meal-form">
              <details>
                <summary className="muted" style={{ cursor: "pointer" }}>
                  ✦ Start with an AI estimate
                </summary>
                <div className="stack" style={{ marginTop: 14 }}>
                  <label>
                    Describe the food and portion
                    <textarea
                      placeholder="e.g. 150 g cooked rice, 200 g grilled chicken and a tablespoon of olive oil"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={2000}
                    />
                  </label>
                  <label>
                    Optional meal photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy || (!description && !image)}
                    onClick={estimate}
                  >
                    <Sparkles size={15} />
                    {busy ? "Working…" : "Estimate nutrition"}
                  </button>
                  <p className="muted" style={{ fontSize: 11 }}>
                    Photos and descriptions are sent to Google Gemini. Estimates
                    can be inaccurate; verify portions and values before saving.
                  </p>
                </div>
              </details>
              {notes && <p className="notice">Estimate — {notes}</p>}
              <label>
                Food or meal name
                <input
                  autoFocus
                  name="food_name"
                  required
                  maxLength={200}
                  value={fields.food_name}
                  onChange={(e) => change("food_name", e.target.value)}
                  placeholder="What did you eat?"
                />
              </label>
              <div className="form-grid">
                <label>
                  Meal
                  <select
                    value={fields.meal_category}
                    onChange={(e) => change("meal_category", e.target.value)}
                  >
                    {[
                      "Breakfast",
                      "Lunch",
                      "Dinner",
                      "Snack",
                      "IntraWorkout",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Date and time
                  <input
                    type="datetime-local"
                    required
                    value={fields.created_at}
                    onChange={(e) => change("created_at", e.target.value)}
                  />
                </label>
              </div>
              <div className="form-grid four">
                {macros.map((k, i) => (
                  <label key={k}>
                    {["Calories", "Protein (g)", "Carbs (g)", "Fat (g)"][i]}
                    <input
                      type="number"
                      min="0"
                      max={i ? 2000 : 10000}
                      step="0.1"
                      required
                      value={fields[k]}
                      onChange={(e) => change(k, Number(e.target.value))}
                    />
                  </label>
                ))}
              </div>
              <details>
                <summary className="muted" style={{ cursor: "pointer" }}>
                  Micronutrients and additional details
                </summary>
                <div className="form-grid" style={{ marginTop: 16 }}>
                  {nutrientKeys.map((k) => (
                    <label key={k}>
                      {k.replaceAll("_", " ")}
                      <input
                        type="number"
                        min="0"
                        max="1000000"
                        step="any"
                        value={fields[k]}
                        onChange={(e) => change(k, Number(e.target.value))}
                      />
                    </label>
                  ))}
                </div>
              </details>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="between">
                <span className="muted" style={{ fontSize: 11 }}>
                  Values are for the entire entry.
                </span>
                <button disabled={busy}>
                  {busy ? "Working…" : initial ? "Save changes" : "Save meal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
