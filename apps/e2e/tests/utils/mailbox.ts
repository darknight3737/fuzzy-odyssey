import { Page } from '@playwright/test';
import { parse } from 'node-html-parser';

type MessageSummary = {
  ID: string;
  MessageID: string;
  Read: boolean;
  From: {
    Name: string;
    Address: string;
  };
  To: Array<{
    Name: string;
    Address: string;
  }>;
  Cc: Array<any>;
  Bcc: Array<any>;
  ReplyTo: Array<any>;
  Subject: string;
  Created: string;
  Tags: Array<any>;
  Size: number;
  Attachments: number;
  Snippet: string;
};

type MessagesResponse = {
  total: number;
  unread: number;
  count: number;
  messages_count: number;
  start: number;
  tags: Array<any>;
  messages: MessageSummary[];
};

/**
 * Mailbox class for interacting with the Mailpit mailbox API.
 */
export class Mailbox {
  static URL = 'http://127.0.0.1:54324';

  /**
   * Subjects the OTP mailer may use. The kit ships English only, so
   * deployments running another default locale add their translated subject
   * through `OTP_EMAIL_SUBJECTS` (pipe-separated).
   */
  static OTP_SUBJECTS = [
    'One-time password for',
    ...(process.env.OTP_EMAIL_SUBJECTS?.split('|').map((s) => s.trim()) ?? []),
  ].filter(Boolean);

  constructor(private readonly page: Page) {}

  async visitMailbox(
    email: string,
    params: {
      deleteAfter: boolean;
      subject?: string;
    },
  ) {
    console.log(`Visiting mailbox ${email} ...`);

    if (!email) {
      throw new Error('Invalid email');
    }

    const json = await this.getEmail(email, params);

    if (!json) {
      throw new Error('Email body was not found');
    }

    console.log(`Email found for email: ${email}`, {
      expectedEmail: email,
      id: json.ID,
      subject: json.Subject,
      date: json.Date,
      to: json.To[0],
      text: json.Text,
    });

    if (email !== json.To[0]!.Address) {
      throw new Error(
        `Email address mismatch. Expected ${email}, got ${json.To[0]!.Address}`,
      );
    }

    const el = parse(json.HTML);

    const linkHref = el.querySelector('a')?.getAttribute('href');

    if (!linkHref) {
      throw new Error('No link found in email');
    }

    console.log(`Visiting ${linkHref} from mailbox ${email}...`);

    return this.page.goto(linkHref);
  }

  /**
   * Retrieves an OTP code from an email
   * @param email The email address to check for the OTP
   * @param deleteAfter Whether to delete the email after retrieving the OTP
   * @returns The OTP code
   */
  async getOtpFromEmail(email: string, deleteAfter = false) {
    console.log(`Retrieving OTP from mailbox ${email} ...`);

    if (!email) {
      throw new Error('Invalid email');
    }

    const json = await this.getEmail(email, {
      deleteAfter,
      subject: Mailbox.OTP_SUBJECTS,
    });

    if (!json) {
      throw new Error(
        `OTP email was not found for ${email}. Searched subjects: ${Mailbox.OTP_SUBJECTS.join(
          ', ',
        )}. Set OTP_EMAIL_SUBJECTS when the mailer runs in another locale.`,
      );
    }

    if (email !== json.To[0]!.Address) {
      throw new Error(
        `Email address mismatch. Expected ${email}, got ${json.To[0]!.Address}`,
      );
    }

    // The OTP button holds the raw digits and nothing else, so it reads the
    // same in every locale — unlike the sentence above it.
    const code =
      json.HTML.match(/>\s*(\d{6})\s*</)?.[1] ??
      json.HTML.match(/one-time password is:\s*(\d{6})/i)?.[1];

    if (code) {
      console.log(`OTP code found in text: ${code}`);
      return code;
    }

    throw new Error('Could not find OTP code in email');
  }

  /**
   * Retrieves the 6-digit code from the `{{ .Token }}` panel in a GoTrue auth
   * email (confirmation, recovery). Distinct from `getOtpFromEmail`, which reads
   * the kit mailer's "One-time password for" email — a different mechanism.
   */
  async getAuthOtpFromEmail(email: string, subject: string) {
    const json = await this.getEmail(email, { deleteAfter: false, subject });

    if (!json) {
      throw new Error(`Email with subject "${subject}" was not found`);
    }

    const code = json.HTML.match(
      /Or enter this code in the app:[\s\S]*?>(\d{6})</,
    )?.[1];

    if (!code) {
      throw new Error(
        `No auth code panel found in the "${subject}" email — did the {{ .Token }} block get dropped from the template?`,
      );
    }

    return code;
  }

  async getEmail(
    email: string,
    params: {
      deleteAfter: boolean;
      subject?: string | string[];
    },
  ) {
    console.log(`Retrieving email from mailbox ${email}...`);

    const url = `${Mailbox.URL}/api/v1/search?query=to:${email}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch emails: ${response.statusText}`);
    }

    const messagesResponse = (await response.json()) as MessagesResponse;

    if (!messagesResponse || !messagesResponse.messages?.length) {
      console.log(`No emails found for mailbox ${email}`);

      return;
    }

    const subjects = params.subject
      ? Array.isArray(params.subject)
        ? params.subject
        : [params.subject]
      : [];

    const candidates = subjects.length
      ? messagesResponse.messages.filter((item) =>
          subjects.some((subject) => item.Subject.includes(subject)),
        )
      : messagesResponse.messages;

    if (subjects.length) {
      console.log(
        `Found ${candidates.length} emails with subject ${subjects.join(' | ')}`,
      );
    }

    // Reducing without a seed throws on an empty list, which hides the real
    // problem (no matching email) behind a cryptic TypeError.
    if (!candidates.length) {
      return;
    }

    // retrieve the latest by timestamp
    const message = candidates.reduce((acc, item) =>
      new Date(acc.Created).getTime() < new Date(item.Created).getTime()
        ? item
        : acc,
    );

    const messageId = message.ID;
    const messageUrl = `${Mailbox.URL}/api/v1/message/${messageId}`;

    const messageResponse = await fetch(messageUrl);

    if (!messageResponse.ok) {
      throw new Error(`Failed to fetch email: ${messageResponse.statusText}`);
    }

    // delete message
    if (params.deleteAfter) {
      console.log(`Deleting email ${messageId} ...`);

      const res = await fetch(`${Mailbox.URL}/api/v1/messages`, {
        method: 'DELETE',
        body: JSON.stringify({ Ids: [messageId] }),
      });

      if (!res.ok) {
        console.error(`Failed to delete email: ${res.statusText}`);
      }
    }

    return (await messageResponse.json()) as Promise<{
      ID: string;
      MessageID: string;
      From: {
        Name: string;
        Address: string;
      };
      To: Array<{
        Name: string;
        Address: string;
      }>;
      Cc: Array<any>;
      Bcc: Array<any>;
      ReplyTo: Array<any>;
      ReturnPath: string;
      Subject: string;
      ListUnsubscribe: {
        Header: string;
        Links: Array<any>;
        Errors: string;
        HeaderPost: string;
      };
      Date: string;
      Tags: Array<any>;
      Text: string;
      HTML: string;
      Size: number;
      Inline: Array<any>;
      Attachments: Array<any>;
    }>;
  }
}
