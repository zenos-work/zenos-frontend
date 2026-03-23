import { Link, useParams } from 'react-router-dom'

type InfoContent = {
  title: string
  subtitle: string
  bullets: string[]
}

const INFO_CONTENT: Record<string, InfoContent> = {
  status: {
    title: 'Platform Status',
    subtitle: 'Current service health and incident communication.',
    bullets: [
      'Core writing and reading services are currently operational.',
      'Scheduled maintenance updates will be posted in advance.',
      'For urgent issues, contact support via Help.',
    ],
  },
  about: {
    title: 'About Zenos',
    subtitle: 'Why we built this platform and who it serves.',
    bullets: [
      'Zenos is designed for writers, editors, and publishing teams.',
      'We focus on quality writing, clear approvals, and reliable distribution.',
      'Product direction is shaped directly by creator feedback.',
    ],
  },
  privacy: {
    title: 'Privacy',
    subtitle: 'How we handle your account and content data.',
    bullets: [
      'Data collection is limited to what is needed to operate the platform.',
      'Security and role-based access are built into core workflows.',
      'Privacy controls evolve with regulatory and user requirements.',
    ],
  },
  rules: {
    title: 'Community Rules',
    subtitle: 'Standards for respectful and lawful publishing.',
    bullets: [
      'Publish original and lawful content.',
      'Do not post harmful, deceptive, or abusive material.',
      'Respect intellectual property and privacy rights.',
    ],
  },
  terms: {
    title: 'Terms',
    subtitle: 'High-level terms overview for guests.',
    bullets: [
      'Usage of Zenos requires acceptance of creator and user terms after login.',
      'Rights and obligations vary by role and publishing workflow.',
      'Refer to the full in-app terms before publishing.',
    ],
  },
  'text-to-speech': {
    title: 'Text to Speech',
    subtitle: 'Accessibility support for listening workflows.',
    bullets: [
      'Text-to-speech support is designed for accessible reading.',
      'Playback quality depends on browser and device voice engines.',
      'Additional voice and controls improvements are planned.',
    ],
  },
  help: {
    title: 'Help',
    subtitle: 'Where to get support and product guidance.',
    bullets: [
      'Use onboarding guides for first-time setup.',
      'Check status updates before reporting outages.',
      'Contact support for account or workflow issues.',
    ],
  },
}

export default function InfoPage() {
  const { slug = '' } = useParams()
  const content = INFO_CONTENT[slug]

  if (!content) {
    return (
      <div className='mx-auto max-w-3xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-6'>
        <h1 className='text-2xl font-semibold text-[color:var(--text-primary)]'>Information page not found</h1>
        <p className='mt-2 text-sm text-[color:var(--text-secondary)]'>The requested information section is unavailable.</p>
        <Link to='/' className='mt-4 inline-flex rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--text-primary)]'>
          Back to landing
        </Link>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-4xl space-y-5 py-4'>
      <section className='rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-7'>
        <h1 className='text-4xl font-semibold tracking-tight text-[color:var(--text-primary)]'>{content.title}</h1>
        <p className='mt-3 text-sm leading-7 text-[color:var(--text-secondary)]'>{content.subtitle}</p>
      </section>

      <section className='rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-6'>
        <ul className='space-y-3 text-sm leading-7 text-[color:var(--text-primary)]'>
          {content.bullets.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
        <Link to='/' className='mt-5 inline-flex rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--text-primary)]'>
          Back to landing
        </Link>
      </section>
    </div>
  )
}
