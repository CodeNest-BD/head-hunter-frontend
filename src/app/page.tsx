import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          HeadHunter
        </h1>
        <p className="max-w-md text-zinc-500">
          The recruitment marketplace connecting companies with specialist
          recruiters.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="h-10 rounded-md border border-zinc-200 px-6 text-sm font-medium leading-10 text-zinc-900 transition hover:border-zinc-400"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="h-10 rounded-md bg-zinc-900 px-6 text-sm font-medium leading-10 text-white transition hover:bg-zinc-800"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
