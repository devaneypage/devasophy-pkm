import { useEffect } from "react";

export const HOMEPAGE_SEO = {
  title: "Devasophy PKM | Personal Knowledge & Research Workspace",
  description: "Organize notes, quotations, ideas, and research in Devasophy PKM. Connect knowledge with a personal lexicon, project tools, and AI-powered synthesis.",
  keywords: "personal knowledge management, research workspace, commonplace notebook, personal lexicon, AI synthesis",
  heading: "Your personal knowledge and research workspace",
} as const;

/** Apply homepage SEO even when the dashboard's private children are not mounted. */
export function useHomepageSeo(isHomepage: boolean) {
  useEffect(() => {
    if (!isHomepage) return;

    const previousTitle = document.title;
    document.title = HOMEPAGE_SEO.title;
    const restoreMetadata = (["description", "keywords"] as const).map((name) => {
      const existing = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      const tag = existing ?? document.createElement("meta");
      const previousContent = tag.getAttribute("content");
      tag.name = name;
      tag.content = HOMEPAGE_SEO[name];
      if (!existing) document.head.appendChild(tag);
      return () => {
        if (!existing) tag.remove();
        else if (previousContent === null) tag.removeAttribute("content");
        else tag.setAttribute("content", previousContent);
      };
    });

    return () => {
      document.title = previousTitle;
      restoreMetadata.forEach((restore) => restore());
    };
  }, [isHomepage]);
}
