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
  const [locale, setLocale] = useState("en-US"),
    [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [density, setDensity] = useState<HydraDensity>("comfortable"),
    [state, setState] = useState<State>("default");
  const es = locale.startsWith("es"),
    disabled = state === "disabled",
    readOnly = state === "readonly",
    loading = state === "loading";
  return (
    <section
      className="foundations-preview"
      aria-labelledby="consistency-title"
    >
      <Link href="#components">← All components</Link>
      <div className="foundations-heading">
        <div>
          <Badge severity="info">APPLICATION CONTRACTS</Badge>
          <h2 id="consistency-title">One system. Every state.</h2>
          <p>
            Inspect the same controls across language, density, direction and
            application state.
          </p>
        </div>
      </div>
      <div className="consistency-settings">
        <Field label="Preview language">
          <Select value={locale} onChange={(e) => setLocale(e.target.value)}>
            <option value="en-US">English</option>
            <option value="es-SV">Español</option>
          </Select>
        </Field>
        <Field label="Preview density">
          <Select
            value={density}
            onChange={(e) => setDensity(e.target.value as HydraDensity)}
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </Select>
        </Field>
        <Field label="Preview direction">
          <Select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "ltr" | "rtl")}
          >
            <option value="ltr">Left to right</option>
            <option value="rtl">Right to left</option>
          </Select>
        </Field>
        <Field label="Preview state">
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
              <option key={value}>{value}</option>
            ))}
          </Select>
        </Field>
      </div>
      <LocaleProvider locale={locale} direction={direction}>
        <DensityProvider density={density}>
          <div
            className="consistency-board"
            data-testid="consistency-board"
            key={locale}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {es ? "Configuración del alcance" : "Scope settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="foundations-form">
                <Field
                  label={es ? "Dominio autorizado" : "Authorized domain"}
                  required
                  disabled={disabled}
                  readOnly={readOnly}
                  hint={
                    es
                      ? "Incluye solo activos autorizados."
                      : "Include authorized assets only."
                  }
                  error={
                    state === "invalid"
                      ? es
                        ? "Revisa el dominio antes de continuar."
                        : "Review the domain before continuing."
                      : undefined
                  }
                >
                  <Input defaultValue="example.com" />
                </Field>
                <Field
                  label={es ? "Clave de acceso" : "Access token"}
                  disabled={disabled}
                  readOnly={readOnly}
                >
                  <PasswordInput defaultValue="example-token" />
                </Field>
                <Field
                  label={es ? "Equipo" : "Team"}
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
                  label={es ? "Revisores" : "Reviewers"}
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
                  label={es ? "Etiquetas" : "Labels"}
                  disabled={disabled}
                  readOnly={readOnly}
                >
                  <TagsInput defaultValue={["external"]} />
                </Field>
                <Checkbox
                  label={
                    es ? "Confirmo la autorización" : "I confirm authorization"
                  }
                  defaultChecked
                  disabled={disabled || readOnly}
                />
                <div className="foundation-actions">
                  <Button disabled={disabled || readOnly} loading={loading}>
                    {es ? "Guardar alcance" : "Save scope"}
                  </Button>
                  <Button variant="outline" disabled={disabled}>
                    {es ? "Cancelar" : "Cancel"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {es ? "Estado y navegación" : "Status and navigation"}
                </CardTitle>
              </CardHeader>
              <CardContent className="foundations-form">
                <Alert
                  tone={
                    state === "invalid" || state === "error" ? "danger" : "info"
                  }
                  title={es ? "Visibilidad continua" : "Continuous visibility"}
                >
                  {es
                    ? "Un mismo lenguaje para cada aplicación."
                    : "One visual language for every application."}
                </Alert>
                <Tabs
                  items={[
                    {
                      id: "overview",
                      label: es ? "Resumen" : "Overview",
                      content: (
                        <p>
                          {es
                            ? "Revisa el alcance antes de guardar."
                            : "Review the scope before saving."}
                        </p>
                      ),
                    },
                    {
                      id: "activity",
                      label: es ? "Actividad" : "Activity",
                      content: (
                        <p>
                          {es
                            ? "No hay cambios pendientes."
                            : "No pending changes."}
                        </p>
                      ),
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
                  {es
                    ? "Preferencias listas para revisar."
                    : "Preferences ready for review."}
                </Toast>
              </CardContent>
            </Card>
            <div className="consistency-table">
              <DataTable
                caption={es ? "Activos del alcance" : "Scope assets"}
                rows={state === "empty" ? [] : rows}
                columns={[
                  {
                    id: "host",
                    header: es ? "Activo" : "Asset",
                    accessor: (row) => row.host,
                    rowHeader: true,
                    sortable: true,
                  },
                  {
                    id: "risk",
                    header: es ? "Riesgo" : "Risk",
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
                    ? es
                      ? "No se pudo obtener el resultado."
                      : "The result could not be retrieved."
                    : undefined
                }
                onRetry={() => setState("default")}
              />
            </div>
          </div>
        </DensityProvider>
      </LocaleProvider>
      <Suspense fallback={<p role="status">Loading API reference…</p>}>
        <ApiReference exports="LocaleProvider DensityProvider" />
      </Suspense>
    </section>
  );
}
