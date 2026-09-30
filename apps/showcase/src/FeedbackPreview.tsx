import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertDialog,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Link,
  Popover,
  Snackbar,
  useNotifications,
  type NotificationOptions,
} from "@hydra-security/ui";
import { ShieldCheck } from "lucide-react";
import { useShowcaseText } from "./showcase-i18n";
const ApiReference = lazy(() => import("./ApiReference"));

export default function FeedbackPreview() {
  const t = useShowcaseText();
  const notifications = useNotifications();
  const [alertVisible, setAlertVisible] = useState(true),
    [confirm, setConfirm] = useState(false),
    [popover, setPopover] = useState(false);
  const [queueFull, setQueueFull] = useState(false),
    [label, setLabel] = useState("external");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const confirmTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  function notify(options: NotificationOptions) {
    setQueueFull(notifications.notify(options) === undefined);
  }
  function simulateSave() {
    const id = notifications.notify({
      id: "feedback-save",
      tone: "loading",
      message: t("Saving preferences…"),
    });
    setQueueFull(id === undefined);
    if (id) {
      timers.current.forEach(clearTimeout);
      timers.current = [
        setTimeout(
          () =>
            notifications.update(id, {
              tone: "success",
              message: t("Preferences saved."),
              duration: 5000,
            }),
          1600,
        ),
      ];
    }
  }
  return (
    <section className="foundations-preview" aria-labelledby="feedback-title">
      <Link href="#components">{t("← All components")}</Link>
      <div className="foundations-heading">
        <div>
          <Badge severity="info">{t("APPLICATION FEEDBACK")}</Badge>
          <h2 id="feedback-title">{t("Clear signals. Calm interactions.")}</h2>
          <p>
            {t(
              "Contextual alerts, actionable notifications and focused confirmations in the same Vitral language.",
            )}
          </p>
        </div>
      </div>
      <div className="feedback-board" data-testid="feedback-board">
        <Card>
          <CardHeader>
            <CardTitle>{t("Custom alerts")}</CardTitle>
          </CardHeader>
          <CardContent className="foundations-form">
            {alertVisible ? (
              <Alert
                title={t("Scope ready for review")}
                icon={<ShieldCheck size={20} />}
                onDismiss={() => setAlertVisible(false)}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      notify({ tone: "success", message: t("Scope reviewed.") })
                    }
                  >
                    {t("Review scope")}
                  </Button>
                }
              >
                {t("Every domain remains under your control.")}
              </Alert>
            ) : (
              <Button variant="outline" onClick={() => setAlertVisible(true)}>
                {t("Restore alert")}
              </Button>
            )}
            <Alert
              tone="warning"
              variant="outline"
              title={t("Authorization required")}
            >
              {t("Confirm permission before including another domain.")}
            </Alert>
            <Alert tone="danger" title={t("Connection unavailable")}>
              {t(
                "Your changes are still here. Try again when the connection returns.",
              )}
            </Alert>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("Snackbars and queue")}</CardTitle>
          </CardHeader>
          <CardContent className="foundations-form">
            <Snackbar tone="success" title={t("Ready to continue")}>
              {t("Persistent by default. You decide when a message expires.")}
            </Snackbar>
            <div className="foundation-actions">
              <Button
                onClick={() =>
                  notify({ tone: "success", message: t("Preferences saved.") })
                }
              >
                {t("Show success")}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  notify({
                    message: t(
                      "This message pauses while you interact with it.",
                    ),
                    duration: 7000,
                  })
                }
              >
                {t("Timed message")}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  notify({
                    tone: "danger",
                    title: t("Connection unavailable"),
                    message: t(
                      "Your changes are still here. Try again when the connection returns.",
                    ),
                  })
                }
              >
                {t("Show error")}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  notify({
                    message: t("Demo item archived."),
                    action: {
                      label: t("Undo"),
                      onClick: () => {
                        notify({
                          tone: "success",
                          message: t("Demo item restored."),
                        });
                      },
                    },
                  })
                }
              >
                {t("Action with undo")}
              </Button>
              <Button variant="outline" onClick={simulateSave}>
                {t("Simulate save")}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  notify({
                    message: t("A safe example of an action that fails."),
                    action: {
                      label: t("Try action"),
                      onClick: async () => {
                        throw new Error("Demonstration failure");
                      },
                    },
                  })
                }
              >
                {t("Failing action")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  notifications.clear();
                  setQueueFull(false);
                }}
              >
                {t("Clear notifications")}
              </Button>
            </div>
            {queueFull && (
              <Alert tone="warning">
                {t("The queue is full. Dismiss a notification and try again.")}
              </Alert>
            )}
            <p className="text-sm text-hydra-muted">
              {t(
                "Up to three messages are visible. Errors and actions stay until dismissed; timed messages can be paused.",
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("Explicit confirmation")}</CardTitle>
          </CardHeader>
          <CardContent className="foundations-form">
            <p>
              {t(
                "The safest action receives focus first. Closing the dialog returns you to its trigger.",
              )}
            </p>
            <Button
              ref={confirmTrigger}
              variant="danger"
              onClick={() => setConfirm(true)}
            >
              {t("Remove demo scope")}
            </Button>
            <AlertDialog
              open={confirm}
              returnFocusRef={confirmTrigger}
              onOpenChange={setConfirm}
              title={t("Remove this scope?")}
              description={t(
                "This demonstration changes no real assets. Review the scope before confirming.",
              )}
              confirmLabel={t("Remove scope")}
              onConfirm={() => {
                setConfirm(false);
                notify({ message: t("Demo scope removed."), tone: "success" });
              }}
            >
              <Popover label={t("Inspect scope")} title={t("Scope details")}>
                <p>example.com</p>
              </Popover>
            </AlertDialog>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("Contextual popover")}</CardTitle>
          </CardHeader>
          <CardContent className="foundations-form">
            <p>
              {t(
                "A small task next to its trigger, with keyboard and outside-click dismissal.",
              )}
            </p>
            <Popover
              label={t("Edit label")}
              title={t("Label settings")}
              open={popover}
              onOpenChange={setPopover}
            >
              <form
                className="foundations-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setPopover(false);
                  notify({
                    tone: "success",
                    message: t("Label saved: {label}", { label }),
                  });
                }}
              >
                <Field label={t("Label")}>
                  <Input
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    required
                  />
                </Field>
                <Button type="submit">{t("Save label")}</Button>
              </form>
            </Popover>
          </CardContent>
        </Card>
      </div>
      <Suspense fallback={<p role="status">{t("Loading API reference…")}</p>}>
        <ApiReference exports="Alert Snackbar NotificationProvider AlertDialog Popover" />
      </Suspense>
    </section>
  );
}
