import { notFound } from "next/navigation";
import { localEmailMode } from "../../lib/local-email";
import { LocalMailbox } from "../../components/local-mailbox";

export const dynamic = "force-dynamic";
export const metadata = { title: "E-mails de test locaux", robots: { index: false, follow: false } };
export default function LocalEmails() {
  if (!localEmailMode()) notFound();
  return <LocalMailbox />;
}
