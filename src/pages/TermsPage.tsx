function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className='mb-10 rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface-1)]/90 px-5 py-5 shadow-[var(--shadow)] sm:px-7'>
      <h2 className='mb-4 flex items-baseline gap-3 border-b border-[color:var(--border-strong)] pb-3 text-base font-bold tracking-[0.02em] text-[color:var(--text-primary)] sm:text-lg'>
        <span className='font-mono text-sm text-[color:var(--accent)]'>{num}</span>
        <span>{title.toUpperCase()}</span>
      </h2>
      {children}
    </section>
  )
}
function Sub({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className='mb-5 rounded-2xl bg-[color:var(--surface-0)]/85 px-4 py-4 last:mb-0 sm:px-5'>
      <h3 className='mb-2 text-sm font-semibold text-[color:var(--text-primary)] sm:text-[0.95rem]'>
        <span className='mr-2 font-mono text-[color:var(--accent)]'>{num}</span>{title}
      </h3>
      {children}
    </div>
  )
}
const P = ({ children }: { children: React.ReactNode }) => (
  <p className='mb-2 text-sm leading-7 text-[color:var(--text-secondary)] sm:text-[0.96rem]'>{children}</p>
)
const Bullets = ({ items }: { items: string[] }) => (
  <ul className='mb-2 space-y-2 pl-1'>
    {items.map((item, i) => (
      <li key={i} className='flex gap-3 text-sm leading-7 text-[color:var(--text-secondary)] sm:text-[0.96rem]'>
        <span className='mt-2 h-2 w-2 shrink-0 rounded-full bg-[color:var(--accent)]' />
        <span>{item}</span>
      </li>
    ))}
  </ul>
)
const Important = ({ children }: { children: React.ReactNode }) => (
  <div className='my-4 rounded-2xl border border-[color:rgba(166,124,60,0.28)] bg-[color:var(--accent-dim)] px-4 py-4 shadow-sm'>
    <p className='mb-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[color:var(--accent)]'>Important</p>
    <p className='text-sm leading-7 text-[color:var(--text-primary)] sm:text-[0.96rem]'>{children}</p>
  </div>
)
const Note = ({ children }: { children: React.ReactNode }) => (
  <div className='my-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-4'>
    <p className='text-sm leading-7 text-[color:var(--text-secondary)] sm:text-[0.96rem]'>{children}</p>
  </div>
)

export default function TermsPage() {
  const effectiveDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className='flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(166,124,60,0.12),_transparent_32%),var(--surface-0)] text-[color:var(--text-primary)]'>

      {/* Sticky header */}
      <header className='sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-[color:var(--border)] bg-[color:var(--topbar-bg)] px-5 py-4 backdrop-blur-md sm:px-6'>
        <div>
          <div className='mb-1 flex items-baseline gap-[1px] leading-none select-none'>
            <span style={{
              fontFamily: "'Syne', system-ui, sans-serif",
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: '-0.06em',
              color: 'var(--text-primary)',
            }}>Z</span>
            <span style={{
              fontFamily: "'Syne', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
            }}>ENOS</span>
            <span style={{
              fontFamily: "'Syne', system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: '-0.02em',
              color: 'var(--accent)',
            }}>.work</span>
          </div>
          <div className='text-xs text-[color:var(--text-muted)]'>Writer Content Agreement · ZW-WCA-001 v1.0</div>
        </div>
        <div className='hidden text-right text-xs text-[color:var(--text-muted)] sm:block'>
          <div>Effective: {effectiveDate}</div>
          {/* <div>Governing Law: Delaware, USA</div> */}
        </div>
      </header>

      {/* Warning banner */}
      <div className='shrink-0 border-b border-[color:rgba(166,124,60,0.18)] bg-[color:var(--accent-dim)] px-5 py-4 sm:px-6'>
        <p className='mx-auto max-w-4xl text-center text-sm leading-6 text-[color:var(--text-primary)]'>
          <strong>Before you start writing</strong> — please read this agreement. Signing in or
          continuing with zenos.work records acceptance of these terms, including the content
          license for indexing, ebooks, printed books, AI training, and related use.
        </p>
      </div>

      {/* Scrollable content */}
      <div className='flex-1 px-4 py-8 sm:px-6 sm:py-10'>
        <div className='mx-auto max-w-4xl'>

          <div className='mb-8 rounded-[2rem] border border-[color:var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.38),rgba(255,255,255,0.08))] px-6 py-7 shadow-[var(--shadow)] sm:px-8'>
            <div className='mb-4 inline-flex rounded-full border border-[color:rgba(166,124,60,0.2)] bg-[color:var(--accent-dim)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]'>
              Legal agreement
            </div>
            <h1 className='mb-3 text-3xl font-bold tracking-tight text-[color:var(--text-primary)] sm:text-4xl'>Writer Content Agreement</h1>
            <p className='max-w-2xl text-sm leading-7 text-[color:var(--text-secondary)] sm:text-base'>
              Clear terms for creators publishing on zenos.work, with the core licensing, royalty, and
              removal implications surfaced in readable language before you sign in or publish.
            </p>
            <div className='mt-5 flex flex-wrap gap-3 text-xs text-[color:var(--text-muted)]'>
              <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5'>Ref: ZW-WCA-001</span>
              <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5'>Version 1.0</span>
              <span className='rounded-full border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 py-1.5'>Effective: {effectiveDate}</span>
            </div>
          </div>

          <Important>
            PLEASE READ THIS AGREEMENT CAREFULLY. BY SIGNING IN OR SUBMITTING ANY CONTENT,
            YOU AGREE TO BE BOUND BY ALL TERMS BELOW.
          </Important>

          <Important>
            <b>ALL PAYMENT TERMS ARE STRICTLY CONTINGENT UPON OFFICIAL NOTIFICATION. PRIOR TO SUCH ANNOUNCEMENT, NO PAYMENT TERMS SHALL APPLY.</b>
          </Important>

          <Section num='1.' title='Parties and Definitions'>
            <Sub num='1.1' title='Parties'>
              <P>This Writer Content Agreement ("Agreement") is between (a) zenos.work, operated under
              its current ownership and any future parent companies, subsidiaries, affiliates, successors,
              assigns, licensees, and transferees (collectively, "the Platform"); and (b) you ("Writer").</P>
            </Sub>
            <Sub num='1.2' title='Key Definitions'>
              <div className='overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)]'>
                {[
                  ['"Content"','Any text, articles, images, metadata, titles, abstracts, comments, or material you submit.'],
                  ['"Affiliates"','All parent companies, subsidiaries, successors, acquirers, future owners, and licensees.'],
                  ['"Derivative Works"','Ebooks, printed books, audiobooks, translations, AI training datasets, and compilations derived from your Content.'],
                  ['"Commercial Use"','Any revenue-generating use including book sales, licensing, AI licensing, and white-label resale.'],
                  ['"Moral Rights"','Rights of attribution and integrity under the Berne Convention and national laws.'],
                ].map(([t, d], i) => (
                  <div key={i} className={`flex flex-col gap-2 px-4 py-4 sm:flex-row sm:gap-4 ${i % 2 ? 'bg-[color:var(--surface-2)]/75' : 'bg-transparent'}`}>
                    <span className='w-36 shrink-0 text-sm font-bold text-[color:var(--text-primary)] sm:font-mono'>{t}</span>
                    <span className='text-sm leading-7 text-[color:var(--text-secondary)]'>{d}</span>
                  </div>
                ))}
              </div>
            </Sub>
          </Section>

          <Section num='2.' title='Grant of Rights and Content License'>
            <Sub num='2.1' title='Broad License Grant'>
              <P>By submitting any Content to the Platform — whether as draft or published — you grant
              the Platform and its Affiliates a <strong className='text-[color:var(--text-primary)]'>worldwide, irrevocable,
              perpetual, non-exclusive, royalty-free, transferable, and sublicensable license</strong> to
              use, reproduce, distribute, display, modify, translate, create Derivative Works from, and
              exploit the Content in any medium now known or hereafter devised.</P>
              <Important>
                THIS LICENSE SURVIVES TERMINATION OF YOUR ACCOUNT. Deleting your account or removing
                content from public display does not revoke this license for uses already made or
                Derivative Works already created.
              </Important>
            </Sub>
            <Sub num='2.2' title='Specific Permitted Uses'>
              <P>The license expressly includes the right to:</P>
              <Bullets items={[
                'Index your Content in search engines, databases, and information retrieval systems',
                'Display and distribute your Content on the Platform and partner platforms',
                'Create, publish, and sell ebooks and electronic publications incorporating your Content',
                'Create, print, and sell physical books, anthologies, and journals incorporating your Content',
                'Produce audiobook and podcast versions of your Content',
                'Use your Content to train, fine-tune, and improve AI and machine learning models',
                'License your Content to third parties for educational, research, and commercial purposes',
                'Translate your Content into any language and distribute globally',
                'Sub-license any of the above rights to third parties without further notice to you',
                'Transfer all rights to any future owner or acquirer of the Platform',
              ]} />
            </Sub>
            <Sub num='2.3' title='Future Owners and Transferees'>
              <P>This Agreement and the license granted herein automatically transfer to any future owner,
              acquirer, successor, or transferee of the Platform — whether by merger, acquisition, asset
              sale, or restructuring — without requiring your further consent.</P>
              <Note>If zenos.work is acquired, the new owners receive all rights to your Content
              automatically. No re-agreement is needed.</Note>
            </Sub>
            <Sub num='2.4' title='Sub-licensing Rights'>
              <P>The Platform may sub-license rights to third-party publishers, AI companies, research
              institutions, and other parties at its sole discretion, without notice to you.</P>
            </Sub>
          </Section>

          <Section num='3.' title="Writer's Retained Rights">
            <Sub num='3.1' title='You Keep Copyright Ownership'>
              <P>You retain full copyright ownership of all original Content you create. This Agreement
              transfers only a license to use it, not ownership.</P>
            </Sub>
            <Sub num='3.2' title='Non-Exclusive — Publish Elsewhere Freely'>
              <P>The license is non-exclusive. You may publish, sell, and license your Content through any
              other channels or platforms without restriction.</P>
            </Sub>
            <Sub num='3.3' title='Attribution (Best Effort)'>
              <P>When the Platform features your Content in Platform-branded publications, it will use
              reasonable efforts to credit you by your account name. Attribution is not guaranteed in
              training datasets, search indexes, or compilations where individual attribution is
              impractical.</P>
            </Sub>
            <Sub num='3.4' title='Moral Rights Waiver'>
              <P>To the fullest extent permitted by law, you irrevocably waive any moral rights and rights
              of integrity in the Content worldwide. Where waiver is not permitted, you agree not to assert
              such rights against the Platform.</P>
            </Sub>
          </Section>

          <Section num='4.' title='Your Representations and Warranties'>
            <Sub num='4.1' title='You Represent and Warrant'>
              <Bullets items={[
                'You are the sole author and copyright owner of the Content, or have all necessary rights to grant this license',
                'The Content does not infringe any third party\'s intellectual property, privacy, or other rights',
                'The Content is not defamatory, unlawful, harassing, or otherwise objectionable',
                'You have full legal capacity and authority to enter this Agreement (you are 18 or older)',
                'The Content does not violate any confidentiality or non-disclosure obligation binding on you',
              ]} />
            </Sub>
          </Section>

          <Section num='5.' title='Compensation and Revenue Sharing'>
            <Sub num='5.1' title='Consideration for License'>
              <P>The license is granted in exchange for access to Platform Services: editor, editorial
              workflow, reader engagement, analytics, and feed distribution.</P>
            </Sub>
            <Sub num='5.2' title='Royalties for Publications'>
              <P>Where your Content is included in a commercially sold publication:</P>
              <div className='mb-2 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)]'>
                <div className='grid grid-cols-3 border-b border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-3'>
                  {['Type', 'Royalty', 'Threshold'].map(h => (
                    <span key={h} className='text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]'>{h}</span>
                  ))}
                </div>
                {[
                  ['Ebook — solo author','15% net receipts (pro-rated)','Yet to be announced'],
                  ['Ebook — anthology','5% net receipts (pro-rated)','Yet to be announced'],
                  ['Print book — solo author','10% net receipts (pro-rated)','Yet to be announced'],
                  ['Print book — anthology','3% net receipts (pro-rated)','Yet to be announced'],
                  ['AI training datasets','No royalty','N/A'],
                  ['Indexing / distribution','No royalty','N/A'],
                ].map(([t, r, th], i) => (
                  <div key={i} className={`grid grid-cols-3 px-4 py-3 ${i % 2 ? 'bg-[color:var(--surface-2)]/65' : 'bg-transparent'}`}>
                    <span className='pr-3 text-sm leading-6 text-[color:var(--text-primary)]'>{t}</span>
                    <span className='pr-3 text-sm font-semibold leading-6 text-[color:#2f6b46] dark:text-[#9bd3aa]'>{r}</span>
                    <span className='text-sm leading-6 text-[color:var(--text-secondary)]'>{th}</span>
                  </div>
                ))}
              </div>
              <Note>Annual royalty statements available on request. "Net receipts" excludes
              distributor commissions, returns, and processing fees.</Note>
            </Sub>
          </Section>

          <Section num='6.' title='Content Removal and Termination'>
            <Sub num='6.1' title='Removing Content from Public Display'>
              <P>You may archive or request removal of your Content from public display via your account
              or by contacting support. Removal from public display occurs within 14 business days.</P>
              <Important>
                REMOVAL DOES NOT TERMINATE THE LICENSE. Content already incorporated into publications,
                AI training datasets, or distribution channels continues to be covered by the license
                granted in Section 2.
              </Important>
            </Sub>
            <Sub num='6.2' title='Account Termination'>
              <P>You may terminate your account at any time. The license granted in Section 2 survives
              account termination indefinitely for all Content submitted before termination.</P>
            </Sub>
          </Section>

          <Section num='7.' title='Indemnification and Limitation of Liability'>
            <Sub num='7.1' title='Your Indemnification Obligations'>
              <P>You agree to indemnify and hold harmless the Platform and its Affiliates from all
              claims, damages, and expenses (including attorneys' fees) arising from your Content, your
              breach of this Agreement, or any third-party IP infringement claim related to your Content.</P>
            </Sub>
            <Sub num='7.2' title="Platform's Liability Cap">
              <P>THE PLATFORM'S MAXIMUM LIABILITY CAP IS YET TO BE ANNOUNCED AND WILL BE COMMUNICATED
              IN A FUTURE POLICY UPDATE. THE PLATFORM IS NOT LIABLE FOR INDIRECT OR
              CONSEQUENTIAL DAMAGES.</P>
            </Sub>
          </Section>

          <Section num='8.' title='Modifications and General Provisions'>
            <Sub num='8.1' title='Modifications to Agreement'>
              <P>The Platform may modify this Agreement. For material changes reducing your rights,
              30 days' notice will be provided. Continued use after the effective date = acceptance.</P>
            </Sub>
            {/* <Sub num='8.2' title='Governing Law and Disputes'>
              <P>Delaware law, USA governs. All disputes go to binding JAMS arbitration in Wilmington,
              Delaware. Class action waived — all claims individual only.</P>
            </Sub> */}
            <Sub num='8.3' title='Assignment'>
              <P>The Platform may assign this Agreement without your consent. You may not assign your
              rights without written Platform approval.</P>
            </Sub>
          </Section>

          <div className='mt-6 rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface-1)] px-5 py-5 text-center shadow-[var(--shadow)]'>
            <p className='text-xs leading-6 text-[color:var(--text-muted)] sm:text-sm'>
              Questions? <span className='font-semibold text-[color:var(--accent)]'>legal@zenos.work</span>
              {' '}· Effective {effectiveDate}
              {' '}· <span className='font-medium text-[color:var(--text-primary)]'>Not legal advice — consult qualified counsel before relying on these terms.</span>
            </p>
          </div>

          <div className='mt-6 rounded-[1.75rem] border border-[color:rgba(166,124,60,0.28)] bg-[color:var(--accent-dim)] px-5 py-5 text-center shadow-sm'>
            <p className='text-sm leading-7 text-[color:var(--text-primary)]'>
              No explicit accept or decline action is required on this page. Signing in to zenos.work
              automatically records acceptance of this agreement for writer workflows.
            </p>
          </div>

          <div className='h-10' />
        </div>
      </div>
    </div>
  )
}
