import { Link } from 'react-router-dom'

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For individual writers exploring Zenos.',
    features: ['Rich editor', 'Draft management', 'Basic media uploads'],
  },
  {
    name: 'Creator Pro',
    price: 'Free for first 1,000 active users **(launch offer)',
    description: 'For creators publishing frequently and collaborating with editors. Pricing starts after we cross 1,000 active users.',
    features: ['Everything in Starter', 'Approval workflows', 'Priority support', 'Advanced publishing controls', 'Paid plan activates after 1,000 active users **' , '** Active User Definition: An active user is defined as an author who publishes at least two pieces of content per week.', 'Launch Offer: The first 1,000 active users will receive this plan free for life, provided they maintain their active user status and consistently grow their Engagement Score through active sharing and platform advocacy.', 'Future Pricing: The paid plan activates only after the platform reaches 1,000 active users. Pricing will be determined and announced by Zenos.work at that time.', 'Engagement Score: An engagement score is calculated for each active user based on publishing frequency, content quality, audience interaction, and external sharing. This score helps determine both the validity of the launch offer and future pricing tiers for Creator Pro users.'],
  },
  {
    name: 'Team Suite',
    price: 'Custom',
    description: 'For editorial teams with governance and compliance needs.',
    features: ['Role-based governance', 'Admin analytics', 'Custom onboarding', 'Dedicated success partner'],
  },
]

export default function MembershipPage() {
  return (
    <div className='mx-auto max-w-6xl space-y-8 py-4'>
      <section className='rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-8'>
        <p className='text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]'>Membership</p>
        <h1 className='mt-3 text-4xl font-semibold tracking-tight text-[color:var(--text-primary)] md:text-5xl'>
          Membership built for writers and editorial teams
        </h1>
        <p className='mt-4 max-w-3xl text-sm leading-7 text-[color:var(--text-secondary)]'>
          Choose a plan based on how you create. Start free, scale to professional workflows, and move into enterprise-grade collaboration when your team is ready.
        </p>
      </section>

      <section className='grid gap-4 md:grid-cols-3'>
        {plans.map((plan) => (
          <article key={plan.name} className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-5'>
            <h2 className='text-xl font-semibold text-[color:var(--text-primary)]'>{plan.name}</h2>
            <p className='mt-1 text-sm font-semibold text-[color:var(--accent)]'>{plan.price}</p>
            <p className='mt-3 text-sm leading-6 text-[color:var(--text-secondary)]'>{plan.description}</p>
            <ul className='mt-4 space-y-2 text-sm text-[color:var(--text-primary)]'>
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section
        className='relative overflow-hidden rounded-[1.8rem] border border-[color:var(--border-strong)] p-6'
        style={{ background: 'linear-gradient(130deg, var(--surface-3) 0%, var(--surface-2) 54%, var(--surface-1) 100%)' }}
      >
        <div className='absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[color:var(--accent-dim)]/55 blur-2xl' />
        <div className='absolute -bottom-24 left-16 h-56 w-56 rounded-full bg-[color:var(--surface-0)]/35 blur-3xl' />
        <h2 className='relative text-2xl font-semibold text-[color:var(--text-primary)]'>Ready to publish with confidence?</h2>
        <p className='relative mt-2 max-w-2xl text-sm leading-7 text-[color:var(--text-secondary)]'>
          Join Zenos and bring your writing workflow into one connected platform.
        </p>
        <div className='relative mt-4 flex flex-wrap gap-3'>
          <Link to='/login' className='rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(5,20,34,0.18)] hover:opacity-95'>
            Start now
          </Link>
          <Link to='/' className='rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-5 py-2 text-sm font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'>
            Back to landing
          </Link>
        </div>
      </section>
    </div>
  )
}
