import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  DocumentCard,
  Field,
  HydraIcon,
  Input,
  PasswordInput,
} from "@hydra-security/ui";

/** Preserve Hydra-specific examples alongside the standard component catalog. */
export default function HydraExtras() {
  return (
    <section className="catalog-extras" aria-labelledby="hydra-extras-title">
      <h2 id="hydra-extras-title">Hydra extensions</h2>
      <p>
        Evidence, iconography and specialized inputs from the original component
        lab.
      </p>
      <div className="catalog-grid">
        <Card>
          <CardHeader>
            <CardTitle>System iconography</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-5">
            {(
              [
                "01-general-ui/search",
                "01-general-ui/menu",
                "01-general-ui/close",
                "03-recon-network/subdomain",
                "02-states-severity/vulnerable",
                "05-technologies/react",
              ] as const
            ).map((name) => (
              <div key={name} className="grid justify-items-center gap-2">
                <HydraIcon name={name} className="size-10" />
                <span className="text-xs">{name.split("/")[1]}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Documents &amp; evidence</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <DocumentCard
              name="executive-surface-report.pdf"
              kind="pdf"
              meta="2.4 MB · sample"
            />
            <DocumentCard
              name="asset-inventory.csv"
              kind="csv"
              meta="30 rows"
            />
            <DocumentCard name="scan-evidence.json" kind="json" meta="Sample" />
            <DocumentCard
              name="screenshots.zip"
              kind="archive"
              meta="18 files"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Specialized inputs</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="API credential">
              <PasswordInput autoComplete="off" />
            </Field>
            {(
              [
                "date",
                "time",
                "datetime-local",
                "number",
                "color",
                "email",
                "url",
                "search",
                "tel",
              ] as const
            ).map((type) => (
              <Field key={type} label={`Native ${type}`}>
                <Input type={type} />
              </Field>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
