import { showcaseText, useShowcaseText } from "./showcase-i18n";
import { lazy, Suspense, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Calendar,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Checkbox,
  Combobox,
  DataTable,
  DensityProvider,
  Field,
  Input,
  LocaleProvider,
  MultiSelect,
  PasswordInput,
  Select,
  TagsInput,
  Tabs,
  Toast,
  Link,
  useHydraLocale,
  type HydraDensity,
} from "@hydra-security/ui";
const ApiReference = lazy(() => import("./ApiReference"));

const options = [
  { value: "security", label: "Security" },
  { value: "platform", label: "Platform" },
  { value: "research", label: "Research" },
];
const rows = [
  { id: "a", host: "api.example.com", risk: 82 },
  { id: "b", host: "cdn.example.com", risk: 24 },
  { id: "c", host: "mail.example.com", risk: 51 },
];
const getId = (row: (typeof rows)[number]) => row.id;
type State =
  | "default"
  | "invalid"
  | "disabled"
  | "readonly"
  | "loading"
  | "empty"
  | "error";
export default function ConsistencyPreview() {
  const t = useShowcaseText();
  const { locale: siteLocale } = useHydraLocale();
  const [locale, setLocale] = useState(""),
    [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [density, setDensity] = useState<HydraDensity>("comfortable"),
    [state, setState] = useState<State>("default");
  const previewT = showcaseText(locale || siteLocale);
  const disabled = state === "disabled",
    readOnly = state === "readonly",
    loading = state === "loading";
  return (
    <section
      className="foundations-preview"
      aria-labelledby="consistency-title"
    >
      <Link href="#components">{t("← All components")}</Link>
      <div className="foundations-heading">
        <div>
          <Badge severity="info">{t("APPLICATION CONTRACTS")}</Badge>
          <h2 id="consistency-title">{t("One system. Every state.")}</h2>
          <p>
            {t(
              "Inspect the same controls across language, density, direction and application state.",
            )}
          </p>
        </div>
      </div>
      <div className="consistency-settings">
        <Field label={t("Preview language")}>
          <Select value={locale} onChange={(e) => setLocale(e.target.value)}>
            <option value="">{t("Use site language")}</option>
            <option value="en-US">English</option>
            <option value="es-SV">Español</option>
            <option value="pt-BR">Português (Brasil)</option>
          </Select>
        </Field>
        <Field label={t("Preview density")}>
          <Select
            value={density}
            onChange={(e) => setDensity(e.target.value as HydraDensity)}
          >
            <option value="comfortable">{t("Comfortable")}</option>
            <option value="compact">{t("Compact")}</option>
          </Select>
        </Field>
        <Field label={t("Preview direction")}>
          <Select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "ltr" | "rtl")}
          >
            <option value="ltr">{t("Left to right")}</option>
            <option value="rtl">{t("Right to left")}</option>
          </Select>
        </Field>
        <Field label={t("Preview state")}>
          <Select
            value={state}
            onChange={(e) => setState(e.target.value as State)}
          >
            {[
              "default",
              "invalid",
              "disabled",
              "readonly",
              "loading",
              "empty",
              "error",
            ].map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <LocaleProvider locale={locale || siteLocale} direction={direction}>
        <DensityProvider density={density}>
          <div className="consistency-board" data-testid="consistency-board">
            <Card>
              <CardHeader>
                <CardTitle>{previewT("Scope settings")}</CardTitle>
              </CardHeader>
              <CardContent className="foundations-form">
                <Field
                  label={previewT("Authorized domain")}
                  required
                  disabled={disabled}
                  readOnly={readOnly}
                  hint={previewT("Include authorized assets only.")}
                  error={
                    state === "invalid"
                      ? previewT("Review the domain before continuing.")
                      : undefined
                  }
                >
                  <Input defaultValue="example.com" />
                </Field>
                <Field
                  label={previewT("Access token")}
                  disabled={disabled}
                  readOnly={readOnly}
                >
                  <PasswordInput defaultValue="example-token" />
                </Field>
                <Field
                  label={previewT("Team")}
                  disabled={disabled}
                  readOnly={readOnly}
                >
                  <Combobox
                    options={state === "empty" ? [] : options}
                    defaultValue={state === "empty" ? "" : "security"}
                    loading={loading}
                  />
                </Field>
                <Field
                  label={previewT("Reviewers")}
                  disabled={disabled}
                  readOnly={readOnly}
                >
                  <MultiSelect
                    options={options}
                    defaultValue={["security"]}
                    loading={loading}
                  />
                </Field>
                <Field
                  label={previewT("Labels")}
                  disabled={disabled}
                  readOnly={readOnly}
                >
                  <TagsInput defaultValue={["external"]} />
                </Field>
                <Checkbox
                  label={previewT("I confirm authorization")}
                  defaultChecked
                  disabled={disabled || readOnly}
                />
                <div className="foundation-actions">
                  <Button disabled={disabled || readOnly} loading={loading}>
                    {previewT("Save scope")}
                  </Button>
                  <Button variant="outline" disabled={disabled}>
                    {previewT("Cancel")}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{previewT("Status and navigation")}</CardTitle>
              </CardHeader>
              <CardContent className="foundations-form">
                <Alert
                  tone={
                    state === "invalid" || state === "error" ? "danger" : "info"
                  }
                  title={previewT("Continuous visibility")}
                >
                  {previewT("One visual language for every application.")}
                </Alert>
                <Tabs
                  items={[
                    {
                      id: "overview",
                      label: previewT("Overview"),
                      content: (
                        <p>{previewT("Review the scope before saving.")}</p>
                      ),
                    },
                    {
                      id: "activity",
                      label: previewT("Activity"),
                      content: <p>{previewT("No pending changes.")}</p>,
                    },
                  ]}
                />
                <Calendar
                  defaultValue="2026-09-14"
                  min="2026-09-01"
                  max="2026-10-31"
                  disabled={disabled || readOnly}
                />
                <Toast onDismiss={() => setState("default")}>
                  {previewT("Preferences ready for review.")}
                </Toast>
              </CardContent>
            </Card>
            <div className="consistency-table">
              <DataTable
                caption={previewT("Scope assets")}
                rows={state === "empty" ? [] : rows}
                columns={[
                  {
                    id: "host",
                    header: previewT("Asset"),
                    accessor: (row) => row.host,
                    rowHeader: true,
                    sortable: true,
                  },
                  {
                    id: "risk",
                    header: previewT("Risk"),
                    accessor: (row) => row.risk,
                    sortable: true,
                  },
                ]}
                getRowId={getId}
                rowLabel={(row) => row.host}
                selectable
                pageSize={2}
                loading={loading}
                error={
                  state === "error"
                    ? previewT("The result could not be retrieved.")
                    : undefined
                }
                onRetry={() => setState("default")}
              />
            </div>
          </div>
        </DensityProvider>
      </LocaleProvider>
      <Suspense fallback={<p role="status">{t("Loading API reference…")}</p>}>
        <ApiReference exports="LocaleProvider DensityProvider" />
      </Suspense>
    </section>
  );
}
