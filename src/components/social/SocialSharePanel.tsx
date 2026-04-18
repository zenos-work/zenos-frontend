import { useState } from 'react'
import { Facebook, Linkedin, Twitter, Link2, CheckCheck, ExternalLink } from 'lucide-react'
import { useShare } from '../../hooks/useSocial'

type Provider = 'x' | 'linkedin' | 'facebook'

type Props = {
  articleId: string
  articleUrl: string
  articleTitle: string
}

const PROVIDERS: { id: Provider; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'x',         label: 'X (Twitter)', icon: <Twitter className="h-4 w-4" />,  color: 'bg-black hover:bg-neutral-800 text-white' },
  { id: 'linkedin',  label: 'LinkedIn',    icon: <Linkedin className="h-4 w-4" />, color: 'bg-[#0A66C2] hover:bg-[#004182] text-white' },
  { id: 'facebook',  label: 'Facebook',    icon: <Facebook className="h-4 w-4" />, color: 'bg-[#1877F2] hover:bg-[#1558b0] text-white' },
]

function buildShareUrl(provider: Provider, articleUrl: string, title: string): string {
  const enc = encodeURIComponent
  if (provider === 'x')
    return `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(articleUrl)}`
  if (provider === 'linkedin')
    return `https://www.linkedin.com/sharing/share-offsite/?url=${enc(articleUrl)}`
  return `https://www.facebook.com/sharer/sharer.php?u=${enc(articleUrl)}`
}

export default function SocialSharePanel({ articleId, articleUrl, articleTitle }: Props) {
  const [copied, setCopied] = useState(false)
  const shareMutation = useShare(articleId)

  function handleNativeShare(provider: Provider) {
    const url = buildShareUrl(provider, articleUrl, articleTitle)
    shareMutation.mutate(provider)
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(articleUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available — no-op
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Share this article</p>
      <div className="flex flex-wrap gap-2">
        {PROVIDERS.map(({ id, label, icon, color }) => (
          <button
            key={id}
            onClick={() => handleNativeShare(id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${color}`}
            aria-label={`Share on ${label}`}
            title={`Share on ${label}`}
          >
            {icon}
            <span>{label}</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </button>
        ))}

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Copy article link"
        >
          {copied ? (
            <>
              <CheckCheck className="h-4 w-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              <span>Copy link</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
