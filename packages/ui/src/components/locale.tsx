import { createContext, useContext, useMemo, type ReactNode } from "react";

/** Component-owned text. Application content remains owned by the caller. */
export const enMessages = {
  loading: "Loading",
  loadingContent: "Loading content",
  loadingHydra: "Loading Hydra…",
  closeDialog: "Close dialog",
  dismissNotification: "Dismiss notification",
  showPassword: "Show password",
  hidePassword: "Hide password",
  fileSelectionHint: "Selection only; files are not uploaded automatically.",
  assetHierarchy: "Asset hierarchy",
  breadcrumb: "Breadcrumb",
  menu: "Menu",
  explore: "Explore",
  pagination: "Pagination",
  previousPage: "Previous page",
  nextPage: "Next page",
  page: (n: number) => `Page ${n}`,
  pagesFor: (name: string) => `${name} pages`,
  progressSteps: "Progress steps",
  complete: "complete",
  tabs: "Tabs",
  filter: "Filter",
  resetFilter: (name: string) => `Reset ${name.toLowerCase()}`,
  position: (n: number, total: number) => `${n} of ${total}`,
  colorTheme: "Color theme",
  useLight: "Use light theme",
  useDark: "Use dark theme",
  letLightIn: "Let light in",
  afterDark: "After dark",
  daylight: "Daylight",
  nocturne: "Nocturne",
  chooseDate: "Choose date",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  scrollableTable: "Scrollable table",
  remaining: "Remaining",
  timeline: "Timeline",
  progress: "Progress",
  carousel: "Carousel",
  carouselRole: "carousel",
  slideRole: "slide",
  previousSlide: "Previous slide",
  nextSlide: "Next slide",
  gallery: "Gallery",
  before: "Before",
  after: "After",
  comparison: "Comparison",
  rotatingText: "Rotating text",
  pauseText: "Pause rotating text",
  resumeText: "Resume rotating text",
  pause: "Pause",
  resume: "Resume",
  code: "Code",
  codeExample: (language: string) => `${language} example`,
  phonePreview: "Phone preview",
  noOptions: "No matching options",
  loadingOptions: "Loading options",
  requiredOption: "Choose an option from the list.",
  clearSelection: "Clear selection",
  showOptions: "Show options",
  selectedOptions: "Selected options",
  options: "Options",
  remove: (name: string) => `Remove ${name}`,
  tags: "Tags",
  tagLimit: "The tag limit has been reached.",
  requiredTag: "Add at least one tag.",
  startDate: "Start date",
  endDate: "End date",
  chooseDates: "Choose dates",
  invalidRange: "End date must be on or after start date.",
  noRecords: "No matching records.",
  loadingRecords: "Loading records",
  retry: "Try again",
  selectPage: "Select this page",
  selectRow: (name: string) => `Select ${name}`,
  tableSummary: (
    page: number,
    pages: number,
    count: number,
    selected: number,
  ) =>
    `Page ${page} of ${pages} · ${count} ${count === 1 ? "record" : "records"} · ${selected} selected`,
  loadingData: "Loading…",
  loadError: "Unable to load data",
  noData: "No data available.",
  viewError: "This view could not load",
  viewErrorHint:
    "Try again, or reload to retrieve the latest application. Unsaved changes may be lost when reloading.",
  reload: "Reload application",
  report: "Report",
  image: "Image",
  archive: "Archive",
  file: "File",
  footerTagline: "Know your territory. Protect what matters.",
  footerHeadline: "Clarity beyond",
  footerHorizon: "the horizon.",
  footerCredit: "Crafted with purpose · El Salvador",
};
export type HydraMessages = typeof enMessages;

export const esMessages: HydraMessages = {
  loading: "Cargando",
  loadingContent: "Cargando contenido",
  loadingHydra: "Cargando Hydra…",
  closeDialog: "Cerrar diálogo",
  dismissNotification: "Descartar notificación",
  showPassword: "Mostrar contraseña",
  hidePassword: "Ocultar contraseña",
  fileSelectionHint:
    "Solo selección; los archivos no se suben automáticamente.",
  assetHierarchy: "Jerarquía de activos",
  breadcrumb: "Ruta de navegación",
  menu: "Menú",
  explore: "Explorar",
  pagination: "Paginación",
  previousPage: "Página anterior",
  nextPage: "Página siguiente",
  page: (n) => `Página ${n}`,
  pagesFor: (name) => `Páginas de ${name}`,
  progressSteps: "Pasos del progreso",
  complete: "completado",
  tabs: "Pestañas",
  filter: "Filtro",
  resetFilter: (name) => `Restablecer ${name.toLowerCase()}`,
  position: (n, total) => `${n} de ${total}`,
  colorTheme: "Tema de color",
  useLight: "Usar tema claro",
  useDark: "Usar tema oscuro",
  letLightIn: "Dejar entrar la luz",
  afterDark: "Al anochecer",
  daylight: "Luz del día",
  nocturne: "Nocturno",
  chooseDate: "Elegir fecha",
  previousMonth: "Mes anterior",
  nextMonth: "Mes siguiente",
  scrollableTable: "Tabla desplazable",
  remaining: "Restante",
  timeline: "Cronología",
  progress: "Progreso",
  carousel: "Carrusel",
  carouselRole: "carrusel",
  slideRole: "diapositiva",
  previousSlide: "Diapositiva anterior",
  nextSlide: "Diapositiva siguiente",
  gallery: "Galería",
  before: "Antes",
  after: "Después",
  comparison: "Comparación",
  rotatingText: "Texto rotativo",
  pauseText: "Pausar texto rotativo",
  resumeText: "Reanudar texto rotativo",
  pause: "Pausar",
  resume: "Reanudar",
  code: "Código",
  codeExample: (language) => `Ejemplo de ${language}`,
  phonePreview: "Vista previa de teléfono",
  noOptions: "No hay opciones coincidentes",
  loadingOptions: "Cargando opciones",
  requiredOption: "Elige una opción de la lista.",
  clearSelection: "Borrar selección",
  showOptions: "Mostrar opciones",
  selectedOptions: "Opciones seleccionadas",
  options: "Opciones",
  remove: (name) => `Quitar ${name}`,
  tags: "Etiquetas",
  tagLimit: "Se alcanzó el límite de etiquetas.",
  requiredTag: "Añade al menos una etiqueta.",
  startDate: "Fecha de inicio",
  endDate: "Fecha de fin",
  chooseDates: "Elegir fechas",
  invalidRange:
    "La fecha de fin debe ser igual o posterior a la fecha de inicio.",
  noRecords: "No hay registros coincidentes.",
  loadingRecords: "Cargando registros",
  retry: "Reintentar",
  selectPage: "Seleccionar esta página",
  selectRow: (name) => `Seleccionar ${name}`,
  tableSummary: (page, pages, count, selected) =>
    `Página ${page} de ${pages} · ${count} ${count === 1 ? "registro" : "registros"} · ${selected} ${selected === 1 ? "seleccionado" : "seleccionados"}`,
  loadingData: "Cargando…",
  loadError: "No se pudieron cargar los datos",
  noData: "No hay datos disponibles.",
  viewError: "No se pudo cargar esta vista",
  viewErrorHint:
    "Reintenta o recarga para obtener la última versión. Los cambios sin guardar podrían perderse al recargar.",
  reload: "Recargar aplicación",
  report: "Informe",
  image: "Imagen",
  archive: "Archivo comprimido",
  file: "Archivo",
  footerTagline: "Conoce tu territorio. Protege lo que importa.",
  footerHeadline: "Claridad más allá",
  footerHorizon: "del horizonte.",
  footerCredit: "Creado con propósito · El Salvador",
};

export interface HydraLocale {
  locale: string;
  direction: "ltr" | "rtl";
  messages: HydraMessages;
}
export const LocaleContext = createContext<HydraLocale>({
  locale: "en-US",
  direction: "ltr",
  messages: enMessages,
});
export interface LocaleProviderProps {
  children: ReactNode;
  /** BCP 47 locale. English and Spanish messages are included; other locales use English fallback. */
  locale?: string;
  direction?: "ltr" | "rtl";
  /** Partial, typed overrides. Explicit component labels take precedence. */
  messages?: Partial<HydraMessages>;
  className?: string;
}
/** SSR-safe scoped locale. A nested locale change resets messages to that language. */
export function LocaleProvider({
  children,
  locale,
  direction,
  messages,
  className,
}: LocaleProviderProps) {
  const parent = useContext(LocaleContext);
  const value = useMemo<HydraLocale>(() => {
    const resolved = locale ?? parent.locale;
    const language = new Intl.Locale(resolved).language;
    return {
      locale: resolved,
      direction:
        direction ??
        (locale
          ? /^(ar|fa|he|ur)$/.test(language)
            ? "rtl"
            : "ltr"
          : parent.direction),
      messages: {
        ...(locale && locale !== parent.locale
          ? language === "es"
            ? esMessages
            : enMessages
          : parent.messages),
        ...messages,
      },
    };
  }, [parent, locale, direction, messages]);
  return (
    <LocaleContext.Provider value={value}>
      <div lang={value.locale} dir={value.direction} className={className}>
        {children}
      </div>
    </LocaleContext.Provider>
  );
}
export function useHydraLocale(): HydraLocale {
  return useContext(LocaleContext);
}
