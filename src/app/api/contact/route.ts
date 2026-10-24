import { Resend } from "resend";
import { contactSchema } from "@/components/portfolio/contact-schema";
import {
  checkContactRateLimit,
  RateLimitConfigurationError,
  RateLimitServiceError,
} from "./rate-limit";

const MAX_REQUEST_BYTES = 10 * 1024;

class PayloadTooLargeError extends Error {}

async function readLimitedBody(request: Request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new PayloadTooLargeError();
  }

  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;

    if (totalBytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new PayloadTooLargeError();
    }

    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function json(
  body: Record<string, unknown>,
  status = 200,
  headers?: HeadersInit,
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CONTACT_EMAIL;
  const sender = process.env.EMAIL_FROM;

  if (!apiKey || !recipient || !sender) {
    return json(
      { message: "The contact service is not configured yet. Please try again later." },
      503,
    );
  }

  try {
    const rateLimit = await checkContactRateLimit(request);
    if (rateLimit.limited) {
      return json(
        { message: "Too many messages were sent. Please try again in a few minutes." },
        429,
        { "Retry-After": String(rateLimit.retryAfterSeconds) },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
      return json({ message: "Submit the form using JSON." }, 415);
    }

    let bodyText: string;
    try {
      bodyText = await readLimitedBody(request);
    } catch (error) {
      if (error instanceof PayloadTooLargeError) {
        return json({ message: "Your message is too large to submit." }, 413);
      }
      throw error;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return json({ message: "The request body must contain valid JSON." }, 400);
    }

    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      return json(
        {
          message: "Please check the highlighted fields and try again.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        400,
      );
    }

    const { name, email, subject, message, website } = parsed.data;
    if (website) {
      return json({ message: "Your message was submitted successfully." });
    }

    const resend = new Resend(apiKey);
    let result: Awaited<ReturnType<typeof resend.emails.send>>;
    try {
      result = await resend.emails.send({
        from: sender,
        to: [recipient],
        replyTo: email,
        subject: `[Portfolio] ${subject.replace(/[\r\n]/g, " ")}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Subject: ${subject}`,
          "",
          "Message:",
          message,
        ].join("\n"),
      });
    } catch (error) {
      console.error("Contact email provider request failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return json(
        { message: "We couldn’t send your message right now. Please try again later." },
        502,
      );
    }

    if (result.error) {
      console.error("Contact email provider rejected the request", {
        statusCode: result.error.statusCode,
        name: result.error.name,
      });
      return json(
        { message: "We couldn’t send your message right now. Please try again later." },
        502,
      );
    }

    return json({ message: "Thanks for reaching out. Your message was submitted." });
  } catch (error) {
    if (error instanceof RateLimitConfigurationError) {
      console.error("Contact rate limiter is not configured.");
      return json(
        { message: "The contact service is not configured yet. Please try again later." },
        503,
      );
    }

    if (error instanceof RateLimitServiceError) {
      console.error("Contact rate limiter is unavailable.");
      return json(
        { message: "Messages are temporarily unavailable. Please try again later." },
        503,
      );
    }

    console.error("Unexpected contact request failure", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return json(
      { message: "We couldn’t process your message. Please try again later." },
      500,
    );
  }
}
