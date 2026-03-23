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
    price: '$12 / month',
    description: 'For creators publishing frequently and collaborating with editors.',
    features: ['Everything in Starter', 'Approval workflows', 'Priority support', 'Advanced publishing controls'],
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

      <section className='rounded-2xl border border-[color:var(--border)] bg-gradient-to-br from-[#21374a] via-[#36556f] to-[#5a7c95] p-6 text-white'>
        <h2 className='text-2xl font-semibold'>Ready to publish with confidence?</h2>
        <p className='mt-2 max-w-2xl text-sm leading-7 text-white/85'>
          Join Zenos and bring your writing workflow into one connected platform.
        </p>
        <div className='mt-4 flex flex-wrap gap-3'>
          <Link to='/login' className='rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#1f3445]'>
            Start now
          </Link>
          <Link to='/' className='rounded-full border border-white/45 px-5 py-2 text-sm font-semibold text-white'>
            Back to landing
          </Link>
        </div>
      </section>
    </div>
  )
}
