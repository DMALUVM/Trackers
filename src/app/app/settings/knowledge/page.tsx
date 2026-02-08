"use client";

import Link from "next/link";
import { SubPageHeader } from "@/app/app/_components/ui";
import { KB_CATEGORIES, KB_ARTICLES } from "@/lib/knowledgeBase";
import { hapticLight } from "@/lib/haptics";

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-6 stagger-sections">
      <SubPageHeader title="Knowledge Base" subtitle="The science behind your habits" backHref="/app/settings" />

      {KB_CATEGORIES.map((cat) => {
        const articles = KB_ARTICLES.filter(a => a.category === cat.key);
        if (articles.length === 0) return null;
        return (
          <section key={cat.key}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-base">{cat.emoji}</span>
              <p className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
                {cat.label}
              </p>
            </div>
            <div className="space-y-1.5">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/app/settings/knowledge/${article.slug}`}
                  className="card-interactive flex items-center gap-3.5 px-4 py-3.5"
                  onClick={() => hapticLight()}
                >
                  <span className="text-2xl shrink-0">{article.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {article.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-faint)" }}>
                      {article.tagline}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" style={{ color: "var(--text-faint)", flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <footer className="text-center pt-2 pb-6">
        <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
          Sources cited in each article · For educational purposes only
        </p>
      </footer>
    </div>
  );
}
