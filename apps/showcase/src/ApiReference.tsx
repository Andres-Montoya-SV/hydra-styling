import { useShowcaseText } from "./showcase-i18n";
import api from "./component-api.generated.json";

export default function ApiReference({ exports: names }: { exports: string }) {
  const t = useShowcaseText();
  const keys = [...new Set(names.match(/\b[A-Z][A-Za-z0-9]+\b/g) ?? [])].filter(
    (name) => name in api,
  );
  return (
    <section className="catalog-api" aria-label={t("Component API")}>
      <h3>{t("Props and defaults")}</h3>
      <p>
        {t(
          "Generated from the public TypeScript types. Native controls also accept their React HTML attributes.",
        )}
      </p>
      {keys.map((name) => {
        const component = api[name as keyof typeof api];
        return (
          <details key={name} open={keys.length === 1 || undefined}>
            <summary>{name}</summary>
            {component.description && <p>{component.description}</p>}
            <div
              className="catalog-api-scroll"
              role="region"
              aria-label={t("{name} props", { name })}
              tabIndex={0}
            >
              <table>
                <caption className="sr-only">
                  {t("{name} props", { name })}
                </caption>
                <thead>
                  <tr>
                    <th>{t("Prop")}</th>
                    <th>{t("Type")}</th>
                    <th>{t("Default")}</th>
                  </tr>
                </thead>
                <tbody>
                  {component.props.map((prop) => (
                    <tr key={prop.name}>
                      <th scope="row">
                        <code>{prop.name}</code>
                        {prop.required && (
                          <span className="catalog-required">
                            {t("required")}
                          </span>
                        )}
                        {prop.description && <p>{prop.description}</p>}
                      </th>
                      <td>
                        <code>{prop.type}</code>
                      </td>
                      <td>
                        <code>{prop.default ?? "—"}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
    </section>
  );
}
