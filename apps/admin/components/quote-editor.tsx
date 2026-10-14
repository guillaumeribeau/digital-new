"use client";
import { useActionState, useEffect, useState } from "react";
import { createQuoteAction } from "../app/commercial-actions";
type Item = { label: string; description: string; quantity: number; unitPrice: string; taxBasisPoints: number };
type Service = { id: string; label: string; description: string; unitCents: number; taxBasisPoints: number };
export type QuoteEditorInitial = { title: string; billingName: string; billingAddress: string; billingRegistrationNumber: string; billingVatNumber: string; deliveryTime: string; terms: string; validityDays: number; items: Item[]; quoteId?: string; expectedUpdatedAt?: string; parentId?: string };
export function QuoteEditor({ leadId, initial, services }: { leadId: string; initial: QuoteEditorInitial; services: Service[] }) {
  const [items, setItems] = useState<Item[]>(initial.items);
  const [state, action, pending] = useActionState(createQuoteAction, {});
  useEffect(() => { if (state.redirectTo) window.location.replace(state.redirectTo); }, [state]);
  function change(index: number, fields: Partial<Item>) { setItems(items.map((item, i) => i === index ? { ...item, ...fields } : item)); }
  return <form action={action} className="mutation-form quote-editor"><input type="hidden" name="leadId" value={leadId} /><input type="hidden" name="items" value={JSON.stringify(items)} />
    {initial.quoteId && <><input type="hidden" name="quoteId" value={initial.quoteId} /><input type="hidden" name="expectedUpdatedAt" value={initial.expectedUpdatedAt} /></>}
    {initial.parentId && <input type="hidden" name="parentId" value={initial.parentId} />}
    <label htmlFor="quote-title">Intitulé du devis</label><input id="quote-title" name="title" defaultValue={initial.title} required minLength={2} maxLength={200} />
    <h2>Informations de facturation du client</h2><label htmlFor="billingName">Raison sociale / nom de facturation</label><input id="billingName" name="billingName" defaultValue={initial.billingName} required minLength={2} maxLength={200} />
    <label htmlFor="billingAddress">Adresse de facturation</label><textarea id="billingAddress" name="billingAddress" defaultValue={initial.billingAddress} required minLength={5} maxLength={1000} />
    <div className="commercial-columns"><div><label htmlFor="billingRegistrationNumber">Immatriculation client · facultatif</label><input id="billingRegistrationNumber" name="billingRegistrationNumber" defaultValue={initial.billingRegistrationNumber} maxLength={100} /></div><div><label htmlFor="billingVatNumber">N° TVA client · facultatif</label><input id="billingVatNumber" name="billingVatNumber" defaultValue={initial.billingVatNumber} maxLength={100} /></div></div>
    <h2>Prestations complémentaires</h2>
    {services.length > 0 && <><label htmlFor="service-template">Ajouter une prestation du catalogue</label><select id="service-template" value="" onChange={(event) => { const service = services.find((item) => item.id === event.target.value); if (service && items.length < 30) setItems([...items, { label: service.label, description: service.description, quantity: 1, unitPrice: (service.unitCents / 100).toFixed(2), taxBasisPoints: service.taxBasisPoints }]); }}><option value="">Choisir une prestation</option>{services.map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}</select></>}
    {items.map((item, index) => <fieldset className="quote-line" key={index}><legend>Prestation {index + 1}</legend>
      <label htmlFor={`item-${index}`}>Nom de la prestation {index + 1}</label><input id={`item-${index}`} value={item.label} onChange={(event) => change(index, { label: event.target.value })} required minLength={2} maxLength={200} />
      <label htmlFor={`description-${index}`}>Description {index + 1}</label><textarea id={`description-${index}`} value={item.description} onChange={(event) => change(index, { description: event.target.value })} maxLength={2000} />
      <div className="commercial-columns"><div><label htmlFor={`quantity-${index}`}>Quantité {index + 1}</label><input id={`quantity-${index}`} type="number" min={1} max={1000} step={1} value={item.quantity} onChange={(event) => change(index, { quantity: Number(event.target.value) })} required /></div><div><label htmlFor={`price-${index}`}>Prix unitaire HT {index + 1} (€)</label><input id={`price-${index}`} inputMode="decimal" value={item.unitPrice} onChange={(event) => change(index, { unitPrice: event.target.value })} required /></div><div><label htmlFor={`tax-${index}`}>TVA {index + 1} (%)</label><input id={`tax-${index}`} type="number" min={0} max={100} step="0.01" value={item.taxBasisPoints / 100} onChange={(event) => change(index, { taxBasisPoints: Math.round(Number(event.target.value) * 100) })} required /></div></div>
      {items.length > 1 && <button className="text-link" type="button" onClick={() => setItems(items.filter((_, i) => i !== index))}>Retirer cette prestation</button>}
    </fieldset>)}
    <button className="button secondary" type="button" disabled={items.length >= 30} onClick={() => setItems([...items, { label: "", description: "", quantity: 1, unitPrice: "", taxBasisPoints: 0 }])}>Ajouter une ligne</button>
    <label htmlFor="deliveryTime">Délai de réalisation</label><input id="deliveryTime" name="deliveryTime" defaultValue={initial.deliveryTime} required minLength={2} maxLength={1000} />
    <label htmlFor="validityDays">Validité du devis (jours)</label><input id="validityDays" name="validityDays" type="number" min={1} max={180} defaultValue={initial.validityDays} required />
    <label htmlFor="quote-terms">Conditions de la prestation et du paiement</label><textarea id="quote-terms" name="terms" defaultValue={initial.terms} minLength={10} maxLength={10000} required />
    <button className="button" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer le brouillon"}</button>{state.error && <p className="notice error" role="alert">{state.error}</p>}
  </form>;
}
