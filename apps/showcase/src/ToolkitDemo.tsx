import { useState } from "react";
import {
  AuditTimeline,
  Card,
  CardContent,
  FindingReviewForm,
  ScanJobList,
  ScopeSummary,
  type FindingReview,
} from "@hydra-security/ui";
export default function ToolkitDemo() {
  const [review, setReview] = useState<FindingReview>({
    findingId: "example-finding",
    status: "open",
    assignee: "",
    note: "",
  });
  return (
    <div className="grid gap-6">
      <p className="text-sm text-hydra-muted">
        Synthetic workflow examples. Review changes stay in this demo; no scan
        is launched.
      </p>
      <Card>
        <CardContent>
          <ScopeSummary
            policyVersion="example-v1"
            included={["example.com", "*.example.com"]}
            excluded={["payments.example.com"]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <ScanJobList
            jobs={[
              {
                id: "one",
                target: "example.com",
                status: "running",
                message: "DNS collection in progress",
              },
              {
                id: "two",
                target: "api.example.com",
                status: "partial",
                message: "TLS collection timed out; coverage is partial.",
              },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <FindingReviewForm
            value={review}
            onSave={async (value) => setReview(value)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <AuditTimeline
            events={[
              {
                id: "one",
                actor: "Example analyst",
                action: "Reviewed evidence",
                target: "example.com",
                occurredAt: "2026-09-19T10:00:00Z",
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
