import { Link } from 'react-router-dom';

const STEPS = [
  {
    title: '1) Profile Input',
    body: 'Student profile, skills, preferences, and academic signals are collected and standardized.',
  },
  {
    title: '2) System Processing',
    body: 'Profile and job requirements are converted into comparable signals for similarity and rule checks.',
  },
  {
    title: '3) Match Score Generation',
    body: 'A final match score is produced from fit factors such as skills, project signals, and preference alignment.',
  },
  {
    title: '4) Explanation Output',
    body: 'Top contributing and weak factors are shown so users understand why this score was generated.',
  },
];

export default function HowMatchingWorksPage() {
  return (
    <section className="stack-base">
      <header className="card-base">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/60">System Clarity</p>
        <h1 className="text-primary-hero">How Matching Works</h1>
        <p className="text-secondary">A quick technical flow from input to explainable score output.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {STEPS.map((step, index) => (
          <article key={step.title} className={`card-base stack-dense ${index % 2 === 1 ? 'brutal-panel-info' : ''}`}>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">{step.title}</h2>
            <p className="text-sm text-ink/85">{step.body}</p>
          </article>
        ))}
      </div>

      <article className="card-base stack-dense">
        <h2 className="text-base font-semibold">Data Flow Contract</h2>
        <p className="text-sm text-ink/80">{'Frontend -> Service -> API -> UI'}</p>
        <p className="text-xs text-ink/70">UI components remain presentation-focused while services shape and normalize data.</p>
      </article>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link to="/student/dashboard" className="btn-secondary btn-feedback">
          Back to Student Dashboard
        </Link>
        <Link to="/recruiter/dashboard" className="btn-secondary btn-feedback">
          Back to Recruiter Dashboard
        </Link>
      </div>
    </section>
  );
}
