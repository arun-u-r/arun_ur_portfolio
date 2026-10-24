"use client";

import { useRef, useState, type FormEvent } from "react";
import { contactSchema, type ContactFormValues } from "./contact-schema";

type FieldErrors = Partial<Record<keyof ContactFormValues, string>>;

type SubmitState =
  | { kind: "idle"; message: "" }
  | { kind: "sending"; message: "Sending your message…" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const initialValues: ContactFormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const fieldIds: Record<keyof ContactFormValues, string> = {
  name: "contact-name",
  email: "contact-email",
  subject: "contact-subject",
  message: "contact-message",
};

export default function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>({
    kind: "idle",
    message: "",
  });
  const submittingRef = useRef(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const form = event.currentTarget;
    const parsed = contactSchema.safeParse({
      ...values,
      website: new FormData(form).get("website") ?? "",
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const key of Object.keys(fieldIds) as (keyof ContactFormValues)[]) {
        const issue = parsed.error.issues.find(
          (entry) => entry.path[0] === key,
        );
        if (issue) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setSubmitState({
        kind: "error",
        message: "Please check the highlighted fields and try again.",
      });
      return;
    }

    submittingRef.current = true;
    setErrors({});
    setSubmitState({ kind: "sending", message: "Sending your message…" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const result: unknown = await response.json();
      if (typeof result !== "object" || result === null) {
        throw new Error("The server returned an unexpected response.");
      }

      const payload = result as {
        message?: unknown;
        fieldErrors?: unknown;
      };

      if (!response.ok) {
        if (
          typeof payload.fieldErrors === "object" &&
          payload.fieldErrors !== null
        ) {
          const nextErrors: FieldErrors = {};
          for (const key of Object.keys(fieldIds) as (keyof ContactFormValues)[]) {
            const fieldError = (payload.fieldErrors as Record<string, unknown>)[key];
            if (Array.isArray(fieldError) && typeof fieldError[0] === "string") {
              nextErrors[key] = fieldError[0];
            }
          }
          setErrors(nextErrors);
        }

        setSubmitState({
          kind: "error",
          message:
            typeof payload.message === "string"
              ? payload.message
              : "We could not send your message. Please try again.",
        });
        return;
      }

      setValues(initialValues);
      form.reset();
      setSubmitState({
        kind: "success",
        message:
          typeof payload.message === "string"
            ? payload.message
            : "Your message was submitted successfully.",
      });
    } catch {
      setSubmitState({
        kind: "error",
        message:
          "We couldn’t reach the message service. Your message is still here; please try again.",
      });
    } finally {
      submittingRef.current = false;
    }
  };

  const handleChange = (
    field: keyof ContactFormValues,
    value: string,
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const renderError = (field: keyof ContactFormValues) =>
    errors[field] ? (
      <span className="contact-field-error" id={`${fieldIds[field]}-error`}>
        {errors[field]}
      </span>
    ) : null;

  return (
    <form
      className="contact-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="contact-form-grid">
        <div className="contact-field">
          <label htmlFor={fieldIds.name}>Name</label>
          <input
            id={fieldIds.name}
            name="name"
            autoComplete="name"
            maxLength={100}
            required
            value={values.name}
            onChange={(event) => handleChange("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${fieldIds.name}-error` : undefined}
          />
          {renderError("name")}
        </div>

        <div className="contact-field">
          <label htmlFor={fieldIds.email}>Email address</label>
          <input
            id={fieldIds.email}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={values.email}
            onChange={(event) => handleChange("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? `${fieldIds.email}-error` : undefined
            }
          />
          {renderError("email")}
        </div>

        <div className="contact-field contact-field-full">
          <label htmlFor={fieldIds.subject}>Subject</label>
          <input
            id={fieldIds.subject}
            name="subject"
            maxLength={160}
            required
            value={values.subject}
            onChange={(event) => handleChange("subject", event.target.value)}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={
              errors.subject ? `${fieldIds.subject}-error` : undefined
            }
          />
          {renderError("subject")}
        </div>

        <div className="contact-field contact-field-full">
          <label htmlFor={fieldIds.message}>Message</label>
          <textarea
            id={fieldIds.message}
            name="message"
            rows={5}
            maxLength={5000}
            required
            value={values.message}
            onChange={(event) => handleChange("message", event.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={
              errors.message ? `${fieldIds.message}-error` : undefined
            }
          />
          {renderError("message")}
        </div>
      </div>

      <div className="contact-form-actions">
        <button
          className="contact-submit"
          type="submit"
          disabled={submitState.kind === "sending"}
        >
          {submitState.kind === "sending" ? "Sending…" : "Send Message"}
          <span aria-hidden="true">↗</span>
        </button>
        <p className="contact-form-note">
          Your details are used only to respond to your message.
        </p>
      </div>

      <p
        className={`contact-form-status contact-form-status--${submitState.kind}`}
        role={submitState.kind === "error" ? "alert" : "status"}
        aria-live={submitState.kind === "error" ? "assertive" : "polite"}
      >
        {submitState.message}
      </p>
    </form>
  );
}
