import api from "./component-api.generated.json";

export default function ApiReference({ exports: names }: { exports: string }) {
  const keys = [...new Set(names.match(/\b[A-Z][A-Za-z0-9]+\b/g) ?? [])].filter(
    (name) => name in api,
  );
  return (
    <section className="catalog-api" aria-label="Component API">
      <h3>Props and defaults</h3>
      <p>
        Generated from the public TypeScript types. Native controls also accept
        their React HTML attributes.
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
              aria-label={name + " props"}
              tabIndex={0}
            >
              <table>
                <caption className="sr-only">{name} props</caption>
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Default</th>
                  </tr>
                </thead>
                <tbody>
                  {component.props.map((prop) => (
                    <tr key={prop.name}>
                      <th scope="row">
                        <code>{prop.name}</code>
                        {prop.required && (
                          <span className="catalog-required">required</span>
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
