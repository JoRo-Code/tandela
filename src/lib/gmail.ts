import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state?: string) {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force consent to get refresh token
    state,
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export function getGmailClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function getUserEmail(accessToken: string) {
  const gmail = getGmailClient(accessToken);
  const profile = await gmail.users.getProfile({ userId: "me" });
  return profile.data.emailAddress;
}

export interface ParsedEmail {
  id: string;
  threadId: string;
  subject: string | null;
  from: string | null;
  to: string[];
  bodyText: string | null;
  bodyHtml: string | null;
  receivedAt: Date | null;
  isRead: boolean;
}

export async function fetchEmails(
  accessToken: string,
  refreshToken?: string,
  maxResults = 50
): Promise<ParsedEmail[]> {
  const gmail = getGmailClient(accessToken, refreshToken);

  // Get list of messages
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    labelIds: ["INBOX"],
  });

  const messages = listResponse.data.messages || [];

  // Fetch full message details
  const emails: ParsedEmail[] = [];

  for (const msg of messages) {
    if (!msg.id) continue;

    const fullMessage = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full",
    });

    const headers = fullMessage.data.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || null;

    // Parse body
    let bodyText: string | null = null;
    let bodyHtml: string | null = null;

    const payload = fullMessage.data.payload;
    if (payload) {
      // Simple message
      if (payload.body?.data) {
        const decoded = Buffer.from(payload.body.data, "base64").toString("utf-8");
        if (payload.mimeType === "text/html") {
          bodyHtml = decoded;
        } else {
          bodyText = decoded;
        }
      }

      // Multipart message
      if (payload.parts) {
        for (const part of payload.parts) {
          if (part.body?.data) {
            const decoded = Buffer.from(part.body.data, "base64").toString("utf-8");
            if (part.mimeType === "text/html") {
              bodyHtml = decoded;
            } else if (part.mimeType === "text/plain") {
              bodyText = decoded;
            }
          }
        }
      }
    }

    // Parse "To" header (can be multiple recipients)
    const toHeader = getHeader("To") || "";
    const toAddresses = toHeader
      .split(",")
      .map((addr) => addr.trim())
      .filter(Boolean);

    // Check if read
    const labelIds = fullMessage.data.labelIds || [];
    const isRead = !labelIds.includes("UNREAD");

    // Parse date
    const dateHeader = getHeader("Date");
    const receivedAt = dateHeader ? new Date(dateHeader) : null;

    emails.push({
      id: fullMessage.data.id!,
      threadId: fullMessage.data.threadId!,
      subject: getHeader("Subject"),
      from: getHeader("From"),
      to: toAddresses,
      bodyText,
      bodyHtml,
      receivedAt,
      isRead,
    });
  }

  return emails;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

export async function sendEmail(
  accessToken: string,
  refreshToken: string | undefined,
  options: SendEmailOptions
): Promise<{ id: string; threadId: string }> {
  const gmail = getGmailClient(accessToken, refreshToken);

  // Build email headers
  const headers = [
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    "Content-Type: text/plain; charset=utf-8",
  ];

  // Add threading headers if replying
  if (options.inReplyTo) {
    headers.push(`In-Reply-To: ${options.inReplyTo}`);
  }
  if (options.references) {
    headers.push(`References: ${options.references}`);
  }

  // Combine headers and body
  const email = [...headers, "", options.body].join("\r\n");

  // Encode as base64url
  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Send the email
  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedEmail,
      threadId: options.threadId,
    },
  });

  return {
    id: response.data.id!,
    threadId: response.data.threadId!,
  };
}
