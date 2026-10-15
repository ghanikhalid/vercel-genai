import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <span className="pill-badge">
        <span className="pill-dot" />
        404 Plot Twist
      </span>
      <h1 className="hero-title">
        Lost in the <span className="gradient-text">Multiverse.</span>
      </h1>
      <p className="lede" style={{ marginBottom: 24 }}>
        This route wandered off looking for snacks. Head back to the studio.
      </p>
      <Link className="btn btn-primary" href="/">
        Back to Prism Pop
      </Link>
    </main>
  );
}
