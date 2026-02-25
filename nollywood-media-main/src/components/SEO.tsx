import { useEffect } from 'react';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogType?: string;
    canonical?: string;
}

const SITE_NAME = 'NaijaMation';
const DEFAULT_DESCRIPTION = 'Stream the best of Nollywood and African animation. Discover, watch, and create amazing content.';

/**
 * Lightweight SEO component — sets document title + meta tags via DOM API.
 * No external dependency required.
 */
export function SEO({
    title,
    description = DEFAULT_DESCRIPTION,
    keywords,
    ogImage,
    ogType = 'website',
    canonical,
}: SEOProps) {
    useEffect(() => {
        // Title
        const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
        document.title = fullTitle;

        // Helper to set or create meta tags
        const setMeta = (attr: string, key: string, content: string) => {
            let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, key);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        // Standard meta
        setMeta('name', 'description', description);
        if (keywords) setMeta('name', 'keywords', keywords);

        // Open Graph
        setMeta('property', 'og:title', fullTitle);
        setMeta('property', 'og:description', description);
        setMeta('property', 'og:type', ogType);
        setMeta('property', 'og:site_name', SITE_NAME);
        if (ogImage) setMeta('property', 'og:image', ogImage);

        // Twitter Card
        setMeta('name', 'twitter:card', 'summary_large_image');
        setMeta('name', 'twitter:title', fullTitle);
        setMeta('name', 'twitter:description', description);
        if (ogImage) setMeta('name', 'twitter:image', ogImage);

        // Canonical
        if (canonical) {
            let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                document.head.appendChild(link);
            }
            link.setAttribute('href', canonical);
        }

        return () => {
            document.title = SITE_NAME;
        };
    }, [title, description, keywords, ogImage, ogType, canonical]);

    return null;
}
