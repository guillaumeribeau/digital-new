import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "@/components/ui/tracked-link";
import { CTA } from "@/components/ui/cta";
import { brand } from "@/config/brand.config";
import { adviceArticles, advicePath, getAdvice } from "@/content/advice";
import { pageMetadata } from "@/lib/seo";
import { BudgetComparison } from "@/components/sections/budget-comparison";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return adviceArticles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getAdvice((await params).slug);
  if (!article) notFound();
  const metadata = pageMetadata(article.seoTitle, article.description, advicePath(article.slug));
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", authors: [brand.name], section: "Conseils" } };
}

export default async function AdvicePage({ params }: Props) {
  const article = getAdvice((await params).slug);
  if (!article) notFound();
  const url = new URL(advicePath(article.slug), brand.domain).href;
  const related = article.relatedSlugs
    ? article.relatedSlugs.flatMap(slug => { const other = getAdvice(slug); return other && other.slug !== article.slug ? [other] : []; }).slice(0, 2)
    : adviceArticles.filter(other => other.slug !== article.slug).slice(0, 2);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article", "@id": `${url}#article`, headline: article.title,
        description: article.description, inLanguage: "fr-FR", mainEntityOfPage: url,
        author: { "@type": "Organization", name: brand.name, url: brand.domain },
        publisher: { "@type": "Organization", "@id": `${brand.domain.replace(/\/$/, "")}/#organization`, name: brand.name, url: brand.domain },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: new URL("/", brand.domain).href },
          { "@type": "ListItem", position: 2, name: "Conseils", item: new URL("/conseils", brand.domain).href },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <div className={`container advice-article-wrap${article.budgetComparison ? " budget-guide" : ""}`}>
        <nav aria-label="Fil d’Ariane" className="advice-breadcrumb"><Link href="/">Accueil</Link><span aria-hidden="true">/</span><Link href="/conseils">Conseils</Link><span aria-hidden="true">/</span><span aria-current="page">{article.category.toLocaleLowerCase("fr-FR")}</span></nav>
        <header className="advice-article-header">
          <p className="eyebrow">{article.category}</p>
          <h1>{article.title}</h1>
          <p className="advice-article-introduction">{article.introduction}</p>
          <p className="advice-byline">Un guide par Zelyweb · Pour les petites entreprises et les indépendants</p>
        </header>
        <div className="advice-article-layout">
          <aside className="advice-sidebar">
            <nav aria-label="Sommaire du guide">
              <p className="eyebrow">DANS CE GUIDE</p>
              <ol>{article.sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{section.title.replace(/^\d+\. /, "")}</a></li>)}</ol>
            </nav>
            <Link href="/notre-offre" className="advice-sidebar-offer">Le détail de l’offre Zelyweb <ArrowUpRight size={17} aria-hidden="true" /></Link>
          </aside>
          <article className="advice-article-body" aria-label={article.title}>
            {article.budgetComparison ? <BudgetComparison /> : <div className="advice-takeaway"><p className="eyebrow">À RETENIR</p><p>{article.takeaway}</p></div>}
            {article.sections.map(section => (
              <section id={section.id} key={section.id} className="advice-section" aria-labelledby={`${section.id}-title`}>
                <h2 id={`${section.id}-title`}>{section.title}</h2>
                {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                {section.table && <div className={`advice-table-scroll${section.table.highlightLastRow === false ? " advice-table-plain" : ""}`} role="region" aria-label={section.table.caption} tabIndex={0}><table><caption>{section.table.caption}</caption><thead><tr>{section.table.headers.map(header => <th scope="col" key={header}>{header}</th>)}</tr></thead><tbody>{section.table.rows.map(row => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={index}>{cell}</th> : <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div>}
                {section.bullets && <ul>{section.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>}
                {section.example && <div className="advice-example"><h3>{section.example.label}</h3><p>{section.example.text}</p></div>}
                {section.advantages && <div className="budget-advantages">{section.advantages.map((advantage, index) => <div key={advantage.title}><span aria-hidden="true">0{index + 1}</span><h3>{advantage.title}</h3><p>{advantage.text}</p></div>)}</div>}
                {section.links && <ul className="advice-section-links">{section.links.map(link => <li key={link.href}><Link href={link.href}>{link.label}<ArrowUpRight size={15} aria-hidden="true" /></Link></li>)}</ul>}
              </section>
            ))}
            <div className="advice-next-step"><h2>Et pour votre projet ?</h2><p>{article.nextStep}</p><CTA placement="page" href={article.nextHref}>{article.nextLabel}</CTA><p className="advice-conditions">Le périmètre et les conditions de l’offre sont détaillés dans les <Link href="/conditions-generales">conditions de l’offre Zelyweb</Link>.</p></div>
            <Link href="/conseils" className="advice-back"><ArrowLeft size={17} aria-hidden="true" /> Tous les conseils</Link>
          </article>
        </div>
        <section className="advice-related" aria-labelledby="related-title"><p className="eyebrow">POUR CONTINUER</p><h2 id="related-title">Les autres questions à se poser.</h2><div>{related.map(other => <Link href={advicePath(other.slug)} key={other.slug}><span>{other.title}</span><ArrowUpRight size={23} aria-hidden="true" /></Link>)}</div></section>
      </div>
    </>
  );
}
