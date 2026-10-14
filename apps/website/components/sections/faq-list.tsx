import { Plus } from "lucide-react";
import { faq } from "@/lib/content";
export function FAQList({ limit }: { limit?: number }) {
  return (
    <div className="faq-list">
      {faq.slice(0, limit).map(([question, answer], i) => (
        <details className="faq-item" key={question}>
          <summary>
            <span className="faq-number">{String(i + 1).padStart(2, "0")}</span>
            <span>{question}</span>
            <Plus size={20} aria-hidden="true" />
          </summary>
          <div className="faq-answer">
            <p>{answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
