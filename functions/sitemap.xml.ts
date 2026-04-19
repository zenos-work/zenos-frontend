interface Env {
  VITE_API_BASE_URL?: string;
}

interface Article {
  slug?: string;
}

interface Tag {
  slug?: string;
}

interface ApiResponse<T> {
  items?: T[];
  tags?: T[];
}

export async function onRequest(context: { env: Env }) {
  const { env } = context;
  const SITE_URL = 'https://zenos.work';
  // Use the API URL from environment variables, fallback to local if not set
  const API_BASE_URL = env.VITE_API_BASE_URL || 'http://127.0.0.1:8787';

  const STATIC_ROUTES = [
    '/',
    '/explore',
    '/search',
    '/membership',
    '/courses',
    '/marketplace',
    '/podcasts',
    '/terms',
    '/info/about',
    '/info/features',
    '/info/status',
    '/info/privacy',
    '/info/rules',
    '/info/terms',
    '/info/text-to-speech',
    '/info/help'
  ];

  const urls = [...STATIC_ROUTES];

  try {
    // 1. Fetch published articles
    console.log(`[Sitemap Debug] Fetching articles from: ${API_BASE_URL}/api/articles`);
    const articlesResp = await fetch(`${API_BASE_URL}/api/articles?limit=1000`);

    if (articlesResp.ok) {
      const data = (await articlesResp.json()) as ApiResponse<Article>;
      const items = data.items || [];
      console.log(`[Sitemap Debug] Successfully fetched ${items.length} articles.`);
      items.forEach((article) => {
        if (article.slug) urls.push(`/article/${article.slug}`);
      });
    } else {
      console.error(`[Sitemap Debug] Articles API failed with status: ${articlesResp.status}`);
    }

    // 2. Fetch public tags
    const tagsResp = await fetch(`${API_BASE_URL}/api/tags`);
    if (tagsResp.ok) {
      const data = (await tagsResp.json()) as ApiResponse<Tag>;
      const tags = data.tags || [];
      console.log(`[Sitemap Debug] Successfully fetched ${tags.length} tags.`);
      tags.forEach((tag) => {
        if (tag.slug) urls.push(`/tag/${tag.slug}`);
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Sitemap Debug] Fetch error:', message);
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => {
    const isPriority = url === '/' || url === '/explore';
    const isArticle = url.startsWith('/article/');
    return `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${isArticle ? 'weekly' : 'daily'}</changefreq>
    <priority>${isPriority ? '1.0' : isArticle ? '0.7' : '0.5'}</priority>
  </url>`;
  }).join('\n')}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
