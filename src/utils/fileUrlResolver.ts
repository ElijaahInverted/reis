/**
 * Resolve IS Mendelu document URLs to direct download links.
 * Handles intermediate pages and path corrections.
 */
export async function resolveFinalFileUrl(link: string): Promise<string> {
    // Clean up the link - IS Mendelu uses semicolons in URLs which causes 404s
    link = link.replace(/\?;/g, '?').replace(/;/g, '&');

    // Check if it's a "dokumenty_cteni.pl" link (view link)
    if (link.includes('dokumenty_cteni.pl')) {
        try {
            const normalizedLink = link.replace(/;/g, '&').replace(/\?/g, '&');
            const idMatch = normalizedLink.match(/[&]id=(\d+)/);
            const dokMatch = normalizedLink.match(/[&]dok=(\d+)/);

            if (idMatch && dokMatch) {
                const id = idMatch[1];
                const dok = dokMatch[1];
                return `https://is.mendelu.cz/auth/dok_server/slozka.pl?download=${dok}&id=${id}&z=1`;
            }
        } catch (e) {
            console.warn('Failed to construct direct download URL:', e);
        }
    }

    // Construct the full URL
    let fullUrl = '';
    if (link.startsWith('http')) {
        fullUrl = link;
    } else {
        if (link.startsWith('/')) {
            fullUrl = `https://is.mendelu.cz${link}`;
        } else {
            fullUrl = `https://is.mendelu.cz/auth/dok_server/${link}`;
        }
    }

    // Check if we need to find the download link
    if (!fullUrl.includes('download=')) {
        try {
            const pageResponse = await fetch(fullUrl, { credentials: 'include' });
            const pageText = await pageResponse.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(pageText, 'text/html');

            const downloadLink = Array.from(doc.querySelectorAll('a')).find(a =>
                a.href.includes('download=') && a.querySelector('img[sysid]')
            );

            if (downloadLink) {
                const newLink = downloadLink.getAttribute('href');
                if (newLink) {
                    if (!newLink.startsWith('http')) {
                        if (newLink.startsWith('/')) {
                            fullUrl = newLink.includes('dokumenty_cteni.pl')
                                ? `https://is.mendelu.cz/auth/dok_server${newLink}`
                                : `https://is.mendelu.cz${newLink}`;
                        } else {
                            fullUrl = `https://is.mendelu.cz/auth/dok_server/${newLink}`;
                        }
                    } else {
                        fullUrl = newLink;
                        if (fullUrl.includes('dokumenty_cteni.pl') && !fullUrl.includes('/auth/')) {
                            fullUrl = fullUrl.replace('is.mendelu.cz/dokumenty_cteni.pl', 'is.mendelu.cz/auth/dok_server/dokumenty_cteni.pl');
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to parse intermediate page:', e);
        }
    }

    return fullUrl;
}
