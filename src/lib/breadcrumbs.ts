export interface Breadcrumb {
  name: string;
  url: string;
}

/**
 * BreadcrumbList items carry `name` both on the ListItem and on the linked
 * page. Google has reported "Unnamed item" when a visual trail or an `item`
 * URL had no readable name.
 */
export function breadcrumbList(items: Breadcrumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: {
        "@type": "WebPage",
        "@id": crumb.url,
        name: crumb.name,
        url: crumb.url,
      },
    })),
  };
}
