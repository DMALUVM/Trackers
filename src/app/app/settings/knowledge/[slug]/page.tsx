"use client";

import { useParams } from "next/navigation";
import { SubPageHeader } from "@/app/app/_components/ui";
import { KB_ARTICLES } from "@/lib/knowledgeBase";
import { BookOpen } from "lucide-react";

export default function KBArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const article = KB_ARTICLES.find(a => a.slug === slug);

  if (!article) {
    return (
      <div className="space-y-6">
        <SubPageHeader title="Not Found" backHref="/app/settings/knowledge" />
        <p style={{ color: "var(--text-muted)" }}>Article not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 stagger-sections">
      <SubPageHeader title={article.title} backHref="/app/settings/knowledge" />

      {/* Hero */}
      <div className="text-center py-2">
        <span className="text-5xl">{article.emoji}</span>
        <p className="text-sm font-medium mt-2" style={{ color: "var(--text-muted)" }}>
          {article.tagline}
        </p>
      </div>

      {/* Sections */}
      {article.sections.map((section, i) => (
        <section key={i} className="card p-5">
          <h3 className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            {section.heading}
          </h3>
          <p className="text-[13.5px] leading-[1.7]" style={{ color: "var(--text-secondary)" }}>
            {section.body}
          </p>
        </section>
      ))}

      {/* Sources */}
      {article.sources.length > 0 && (
        <section className="rounded-2xl p-5" style={{ background: "var(--bg-card-hover)" }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} style={{ color: "var(--text-faint)" }} />
            <h3 className="text-xs font-bold tracking-wider uppercase" style={{ color: "var(--text-faint)" }}>
              Sources
            </h3>
          </div>
          <div className="space-y-2">
            {article.sources.map((src, i) => (
              <p key={i} className="text-[11px] leading-relaxed" style={{ color: "var(--text-faint)" }}>
                {src}
              </p>
            ))}
          </div>
        </section>
      )}

      <div className="pb-6" />
    </div>
  );
}
