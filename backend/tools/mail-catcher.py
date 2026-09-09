#!/usr/bin/env python3
"""
A local SMTP server that accepts mail and writes it to disk instead of
sending it anywhere.

Point MAIL_MAILER=smtp at 127.0.0.1:1025 and the application takes the real
SMTP path — connection, envelope, MIME, attachments — while every message
lands in storage/app/mail as an .html you can open and an .eml you can drag
into a mail client. Nothing can reach a customer by accident, and no
credentials exist to leak.

This is a development tool, not a mail server: it binds to loopback only,
speaks no TLS, and asks for no authentication.

    python backend/tools/mail-catcher.py

Stdlib only. Python 3.12 removed the smtpd module and aiosmtpd is a
dependency this project does not otherwise need, so the protocol is spoken
directly — it is a small protocol.
"""
import email
import email.policy
import re
import socketserver
import sys
import threading
from datetime import datetime
from pathlib import Path

HOST, PORT = "127.0.0.1", 1025
OUT = Path(__file__).resolve().parent.parent / "storage" / "app" / "mail"

# Deliberately no STARTTLS and no AUTH in the EHLO banner: advertising them
# would make the client negotiate something this server cannot do.
EHLO_LINES = ["250-localhost", "250-8BITMIME", "250 SIZE 35882577"]


class Handler(socketserver.StreamRequestHandler):
    def respond(self, line):
        self.wfile.write((line + "\r\n").encode())

    def handle(self):
        self.respond("220 localhost SLS mail catcher")
        recipients = []

        while True:
            line = self.rfile.readline()
            if not line:
                return

            command = line.decode("utf-8", "replace").strip()
            verb = command.split(" ")[0].upper()

            if verb in ("EHLO", "HELO"):
                for reply in (EHLO_LINES if verb == "EHLO" else ["250 localhost"]):
                    self.respond(reply)
            elif verb == "MAIL":
                self.respond("250 2.1.0 Ok")
            elif verb == "RCPT":
                match = re.search(r"<([^>]*)>", command)
                if match:
                    recipients.append(match.group(1))
                self.respond("250 2.1.5 Ok")
            elif verb == "DATA":
                self.respond("354 End data with <CR><LF>.<CR><LF>")
                self.save(self.read_message(), recipients)
                recipients = []
                self.respond("250 2.0.0 Ok: queued")
            elif verb == "RSET":
                recipients = []
                self.respond("250 2.0.0 Ok")
            elif verb == "NOOP":
                self.respond("250 2.0.0 Ok")
            elif verb == "QUIT":
                self.respond("221 2.0.0 Bye")
                return
            else:
                self.respond("502 5.5.2 Command not implemented")

    def read_message(self):
        """Read until the lone dot, undoing the transparency dot-stuffing."""
        lines = []

        while True:
            line = self.rfile.readline()
            if not line or line in (b".\r\n", b".\n"):
                break
            if line.startswith(b".."):
                line = line[1:]
            lines.append(line)

        return b"".join(lines)

    def save(self, raw, recipients):
        message = email.message_from_bytes(raw, policy=email.policy.default)
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")[:-3]
        to = ", ".join(recipients) or message.get("To", "unknown")
        subject = message.get("Subject", "(no subject)")

        # A filename made from the subject, so the directory is readable.
        slug = re.sub(r"[^a-z0-9]+", "-", subject.lower()).strip("-")[:60] or "message"
        base = OUT / f"{stamp}-{slug}"

        OUT.mkdir(parents=True, exist_ok=True)
        base.with_suffix(".eml").write_bytes(raw)

        body = message.get_body(preferencelist=("html", "plain"))
        content = body.get_content() if body else ""

        if body and body.get_content_type() == "text/plain":
            content = f"<pre style='white-space:pre-wrap;font:14px system-ui'>{content}</pre>"

        # A header strip above the message, so the file answers "who was this
        # actually addressed to?" without opening the .eml.
        base.with_suffix(".html").write_text(
            "<!doctype html><meta charset='utf-8'>"
            "<div style=\"font:13px system-ui;padding:12px 16px;background:#111;color:#eee\">"
            f"<b>To:</b> {to} &nbsp; <b>From:</b> {message.get('From', '')}<br>"
            f"<b>Subject:</b> {subject}</div>" + content,
            encoding="utf-8",
        )

        print(f"  mail -> {to}  |  {subject}")
        print(f"     {base.with_suffix('.html')}")
        sys.stdout.flush()


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    # Subjects are bilingual, and a Windows console defaults to cp1252 —
    # printing a Greek subject would otherwise raise inside the handler.
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    OUT.mkdir(parents=True, exist_ok=True)
    print(f"SLS mail catcher on {HOST}:{PORT}")
    print(f"Writing to {OUT}")
    print("Set MAIL_MAILER=smtp, MAIL_HOST=127.0.0.1, MAIL_PORT=1025. Ctrl+C to stop.\n")
    sys.stdout.flush()

    with Server((HOST, PORT), Handler) as server:
        threading.current_thread().name = "mail-catcher"
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
