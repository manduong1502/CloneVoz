import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DanOngThongMinh/1.0; +https://danongthongminh.vn)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error('Fetch failed');

    const html = await res.text();

    // Parse OG tags
    const getMetaContent = (name) => {
      // Try og: tags first
      const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${name}["'][^>]*content=["']([^"']*)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${name}["']`, 'i'));
      if (ogMatch) return ogMatch[1];

      // Fallback to regular meta tags
      const metaMatch = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'));
      if (metaMatch) return metaMatch[1];

      return null;
    };

    // Get title
    const ogTitle = getMetaContent('title');
    const htmlTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
    const title = ogTitle || htmlTitle || '';

    // Get description
    const description = getMetaContent('description') || '';

    // Get image
    const image = getMetaContent('image') || '';

    // Get favicon
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']*)["']/i)
      || html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i);
    
    let favicon = faviconMatch?.[1] || '';
    
    // Resolve relative favicon URL
    const urlObj = new URL(url);
    if (favicon && !favicon.startsWith('http')) {
      favicon = favicon.startsWith('/') 
        ? `${urlObj.protocol}//${urlObj.host}${favicon}`
        : `${urlObj.protocol}//${urlObj.host}/${favicon}`;
    }
    if (!favicon) {
      favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
    }

    // Get site name
    const siteName = getMetaContent('site_name') || urlObj.hostname;

    return NextResponse.json({
      title: title.substring(0, 200),
      description: description.substring(0, 300),
      image,
      favicon,
      siteName,
      url,
    });
  } catch (err) {
    return NextResponse.json({ 
      title: '',
      description: '',
      image: '',
      favicon: '',
      siteName: new URL(url).hostname,
      url,
      error: 'Could not fetch preview'
    });
  }
}
