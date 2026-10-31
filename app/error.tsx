"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="panel empty">
      <h1>Something interrupted your session</h1>
      <p className="muted">
        Your saved data is safe. Try loading this page again.
      </p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
