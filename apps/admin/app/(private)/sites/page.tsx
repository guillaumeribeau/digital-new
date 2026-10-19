import { OperationsList } from "../../../components/operations-list";
export default async function Sites({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; mode?: string; page?: string }> }) { return <OperationsList search={await searchParams} />; }
