import Link from "next/link";
export default function NotFound() {
  return (
    <main className="panel empty">
      <h1>Page not found</h1>
      <Link className="button" href="/dashboard">
        Back to your dashboard
      </Link>
    </main>
  );
}
