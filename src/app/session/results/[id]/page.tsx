import { Suspense } from "react";

import { ResultsView } from "@/components/session/results-view";

export default async function SessionResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense>
      <ResultsView sessionId={id} />
    </Suspense>
  );
}
