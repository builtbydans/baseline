import { Suspense } from "react";

import { ResultsView } from "@/components/session/results-view";
import { latestSession } from "@/lib/mock-data";

export default function LatestResultsPage() {
  return (
    <Suspense>
      <ResultsView sessionId={latestSession.id} />
    </Suspense>
  );
}
