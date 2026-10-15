import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <p className="kicker">Wrong door</p>
      <h1 className="display" style={{ fontSize: 96 }}>
        404
      </h1>
      <p className="lede">This page walked out before last call.</p>
      <Link className="btn" href="/">
        Back to LAST NITE
      </Link>
    </main>
  );
}
