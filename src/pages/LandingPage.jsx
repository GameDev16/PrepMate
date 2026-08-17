import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const templateNames = [
  "Long Form Notes", "Concise Notes", "Revision Notes", "Bullet Points",
  "Q&A Mode", "Flashcards", "Cheat Sheet", "Teacher Notes",
  "Beginner Mode", "Advanced Mode", "Interview Prep", "Mind Map",
  "Comparison Tables", "Formula Sheet", "MCQ Generator", "Timeline",
  "Case Study", "Viva Preparation"
];

const specs = [
  { label: "Templates", value: "18 formats, one PDF" },
  { label: "Languages", value: "15+, technical terms kept as-is" },
  { label: "Depth", value: "Ultra-short to comprehensive, your call" },
  { label: "Personas", value: "Professor to explain-like-I'm-5" },
  { label: "Notebooks", value: "Unlimited, organized by subject" },
  { label: "Export", value: "Markdown & PDF" },
];

// Rotating accent colors for the template tag cloud — deliberately excludes
// marker-red, which is reserved elsewhere in the app for error states.
const tagColors = ["bg-hi-yellow", "bg-jelly-green", "bg-bubblegum", "bg-powder-sky", "bg-sunbeam"];
const tagRotations = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "-rotate-3", "rotate-3"];

function NotesGlyph({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 8h20" /><path d="M6 15h20" /><path d="M6 22h13" />
    </svg>
  );
}

function FlashcardGlyph({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="8" y="4" width="18" height="13" rx="2.5" transform="rotate(-6 17 10)" />
      <rect x="4" y="15" width="18" height="13" rx="2.5" />
    </svg>
  );
}

function McqGlyph({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="9" cy="9" r="5.5" />
      <path d="M6.5 9l1.8 1.8L11.5 7" />
      <path d="M19 8h9" /><path d="M19 16h9" strokeOpacity="0.4" /><path d="M19 24h9" strokeOpacity="0.4" />
    </svg>
  );
}

function MindMapGlyph({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="16" cy="16" r="3" fill="currentColor" stroke="none" />
      <path d="M16 13V6" /><circle cx="16" cy="4" r="2" fill="currentColor" stroke="none" />
      <path d="M18.5 17.5l5 5" /><circle cx="25" cy="24" r="2" fill="currentColor" stroke="none" />
      <path d="M13.5 17.5l-5 5" /><circle cx="7" cy="24" r="2" fill="currentColor" stroke="none" />
      <path d="M19 15h7" /><circle cx="28" cy="15" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LandingPage() {
  const [cookieConsentAccepted, setCookieConsentAccepted] = useState(() => {
    return localStorage.getItem('prepmate_cookie_consent') === 'true';
  });

  const acceptCookies = () => {
    localStorage.setItem('prepmate_cookie_consent', 'true');
    setCookieConsentAccepted(true);
  };

  return (
    <div className="min-h-screen bg-chalk flex flex-col font-body text-ink selection:bg-frost">
      {/* Ticker */}
      <div className="w-full bg-ink text-white h-8 overflow-hidden relative z-40 flex items-center">
        <div className="flex animate-marquee whitespace-nowrap font-mono text-[12px] uppercase tracking-wider items-center">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="mx-4 flex items-center gap-4">
              <span>Turn any PDF into study notes in seconds</span>
              <span>/</span>
              <span>18 formats, 15+ languages</span>
              <span>/</span>
              <span>3 free generations, no card required</span>
              <span>/</span>
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-paper border-b border-frost h-16 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display font-extrabold text-2xl tracking-tight text-ink">
            PrepMate
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            <a href="#shapes" className="text-[16px] font-medium text-ink/70 hover:text-ink transition-colors">
              Formats
            </a>
            <a href="#specs" className="text-[16px] font-medium text-ink/70 hover:text-ink transition-colors">
              Details
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/login" className="px-4 py-2 text-ink hover:underline text-[16px] font-medium transition-all">
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 bg-electric-iris text-white text-[16px] font-semibold rounded-full shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 sm:px-8 pt-14 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="max-w-[1180px] mx-auto grid lg:grid-cols-[1fr_440px] gap-14 lg:gap-10 items-center">
          {/* Copy */}
          <div className="animate-fade-in-up">
            <h1 className="font-display font-extrabold text-[42px] sm:text-6xl lg:text-[64px] leading-[1.05] tracking-tight text-ink mb-6">
              One PDF.<br />
              <span className="text-electric-iris">Eighteen</span> ways to learn it.
            </h1>
            <p className="text-lg sm:text-xl text-ink/70 max-w-lg mb-9 leading-relaxed">
              Upload a chapter, pick a shape — flashcards, a mind map, a formula
              sheet, a mock viva — and PrepMate cuts it down to exactly what
              you need to study.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
              <Link
                to="/register"
                className="px-7 py-3.5 bg-electric-iris text-white font-semibold text-lg rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all inline-flex items-center justify-center gap-2"
              >
                Start for free
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <Link
                to="/login"
                className="px-7 py-3.5 bg-transparent border-2 border-ink text-ink font-semibold text-lg rounded-full hover:bg-ink hover:text-white transition-all text-center"
              >
                Sign in
              </Link>
            </div>
            <p className="text-sm font-mono uppercase tracking-wide text-ink/50">
              3 free generations — no card required
            </p>
          </div>

          {/* Signature visual: a source PDF cut into study formats */}
          <div className="w-full max-w-[420px] mx-auto lg:mx-0">
            <div className="grid grid-cols-2 sm:grid-cols-[1.3fr_1fr_1fr] gap-3 sm:gap-4">
              <div className="col-span-2 sm:col-span-1 sm:row-span-2 bg-paper border-2 border-ink torn-right shadow-hard -rotate-2 p-5 flex flex-col justify-between min-h-[190px] sm:min-h-[280px]">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
                  chapter-07.pdf
                </span>
                <div className="space-y-2.5 my-4">
                  {[100, 88, 94, 60, 90].map((w, i) => (
                    <div key={i} className="h-2 bg-frost rounded-full" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-electric-iris font-bold">
                  → pick a shape
                </span>
              </div>

              <div className="bg-jelly-green border-2 border-ink rounded-2xl shadow-hard-sm rotate-2 p-4 flex flex-col justify-between min-h-[120px] hover:-translate-y-1 transition-transform">
                <FlashcardGlyph className="w-7 h-7 text-ink" />
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink font-bold mt-2">Flashcards</p>
              </div>
              <div className="bg-bubblegum border-2 border-ink rounded-2xl shadow-hard-sm -rotate-3 p-4 flex flex-col justify-between min-h-[120px] hover:-translate-y-1 transition-transform">
                <McqGlyph className="w-7 h-7 text-ink" />
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink font-bold mt-2">MCQs</p>
              </div>
              <div className="bg-hi-yellow border-2 border-ink rounded-2xl shadow-hard-sm rotate-3 p-4 flex flex-col justify-between min-h-[120px] hover:-translate-y-1 transition-transform">
                <MindMapGlyph className="w-7 h-7 text-ink" />
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink font-bold mt-2">Mind map</p>
              </div>
              <div className="bg-powder-sky border-2 border-ink rounded-2xl shadow-hard-sm -rotate-2 p-4 flex flex-col justify-between min-h-[120px] hover:-translate-y-1 transition-transform">
                <NotesGlyph className="w-7 h-7 text-ink" />
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink font-bold mt-2">Notes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Template name ticker */}
      <section className="py-6 bg-paper border-y border-frost overflow-hidden relative z-10">
        <div className="flex animate-marquee whitespace-nowrap items-center">
          {[...templateNames, ...templateNames].map((name, i) => (
            <span key={i} className="mx-6 text-lg font-medium text-ink/70 flex items-center gap-3">
              <span className="text-ink/30">/</span>
              <span>{name}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Template tag cloud — replaces a generic feature grid with the actual content */}
      <section id="shapes" className="py-20 px-4 sm:px-8 bg-chalk relative z-10">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-ink mb-4">
            Same chapter. Eighteen different shapes.
          </h2>
          <p className="text-lg text-ink/70 max-w-xl mx-auto mb-14">
            Every format below runs on the same PDF you upload once — mix
            and match for however you actually study.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {templateNames.map((name, i) => (
              <span
                key={name}
                className={`px-4 py-2 border-2 border-ink font-mono text-sm uppercase tracking-wide rounded-xl shadow-hard-sm ${tagColors[i % tagColors.length]} ${tagRotations[i % tagRotations.length]} hover:rotate-0 hover:-translate-y-0.5 transition-transform`}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Spec sheet */}
      <section id="specs" className="py-20 px-4 sm:px-8 bg-paper border-y border-frost relative z-10">
        <div className="max-w-[720px] mx-auto">
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-ink text-center mb-14">
            What you get
          </h2>
          <div className="border-2 border-ink rounded-[24px] shadow-hard bg-chalk overflow-hidden">
            {specs.map((spec, i) => (
              <div
                key={spec.label}
                className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 px-6 sm:px-8 py-5 ${i !== specs.length - 1 ? 'border-b border-ink/10' : ''}`}
              >
                <span className="font-mono text-xs uppercase tracking-widest text-electric-iris font-bold w-full sm:w-40 shrink-0">
                  {spec.label}
                </span>
                <span className="text-lg text-ink/80">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="py-16 px-4 sm:px-8 bg-chalk relative z-10">
        <div className="max-w-[1180px] mx-auto bg-hi-yellow border-2 border-ink rounded-[24px] p-8 sm:p-14 shadow-hard flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <span className="inline-block px-3 py-1 bg-ink text-white font-mono text-xs uppercase tracking-wider rounded-full mb-4">
              No card needed
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-[40px] text-ink tracking-tight leading-tight">
              Your next chapter is one upload away.
            </h2>
            <p className="text-lg text-ink/80 mt-2">
              3 free generations, ready the moment you sign up.
            </p>
          </div>
          <Link
            to="/register"
            className="px-8 py-4 bg-electric-iris text-white font-semibold text-lg rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all shrink-0 inline-flex items-center gap-2"
          >
            Start for free
            <ArrowRight size={18} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-8 bg-ink text-white relative z-10">
        <div className="max-w-[1180px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/10 pb-8 mb-8">
          <span className="font-display font-extrabold text-xl tracking-tight">PrepMate</span>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-white/80">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Create Account</Link>
            <Link to="/forgot-password" className="hover:text-white transition-colors">Reset Password</Link>
          </nav>
        </div>
        <div className="max-w-[1180px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/50 text-center sm:text-left">
          <p>© {new Date().getFullYear()} PrepMate. Made for late-night study sessions.</p>
          <p>Notes stay yours. Nothing is sold to anyone.</p>
        </div>
      </footer>

      {/* Cookie Consent Bar */}
      {!cookieConsentAccepted && (
        <aside className="fixed bottom-0 inset-x-0 bg-ink text-white p-4 sm:px-6 z-50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-frost shadow-hard animate-fade-in-up">
          <p className="text-[16px] font-normal leading-relaxed text-white/90">
            We use essential cookies and local storage to maintain your active study session and verify your AI generations.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={acceptCookies}
              className="px-5 py-2 bg-transparent border border-white text-white font-normal text-[16px] rounded-full hover:bg-white/10 transition-all"
            >
              Essential cookies only
            </button>
            <button
              onClick={acceptCookies}
              className="px-6 py-2 bg-electric-iris text-white font-normal text-[16px] rounded-full shadow-hard-iris hover:translate-y-0.5 transition-all"
            >
              Sounds good
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

export default LandingPage;
