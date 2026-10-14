"use client";
import { useCallback, useState } from "react";
import { CommercialForm } from "./commercial-form";
type Template = { id: string; label: string; subject: string; content: string };
export function MessageComposer({ leadId, requestId, templates }: { leadId: string; requestId: string; templates: Template[] }) {
  const [subject, setSubject] = useState(""); const [content, setContent] = useState("");
  const clear = useCallback(() => { setSubject(""); setContent(""); }, []);
  return <CommercialForm operation="message" button="Envoyer le message" reset onSuccess={clear}>
    <input type="hidden" name="leadId" value={leadId} /><input type="hidden" name="requestId" defaultValue={requestId} />
    {templates.length > 0 && <><label htmlFor="message-template">Utiliser un modèle</label><select id="message-template" defaultValue="" onChange={(event) => { const template = templates.find((item) => item.id === event.target.value); if (template) { setSubject(template.subject); setContent(template.content); } }}><option value="">Choisir un modèle</option>{templates.map((template) => <option value={template.id} key={template.id}>{template.label}</option>)}</select></>}
    <label htmlFor="message-subject">Objet de votre message</label><input id="message-subject" name="subject" value={subject} onChange={(event) => setSubject(event.target.value)} required minLength={2} maxLength={300} />
    <label htmlFor="message-content">Votre message au client</label><textarea id="message-content" name="content" value={content} onChange={(event) => setContent(event.target.value)} required minLength={2} maxLength={20000} />
  </CommercialForm>;
}
