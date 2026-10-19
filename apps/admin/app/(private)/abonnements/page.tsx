import { OperationsList } from "../../../components/operations-list";
export default async function Subscriptions({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; mode?: string; page?: string }> }) { return <OperationsList subscription search={await searchParams} />; }
