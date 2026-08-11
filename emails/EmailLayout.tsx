import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const main = {
  backgroundColor: "#f3f5f7",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "32px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8ee",
  maxWidth: "560px",
  margin: "0 auto",
};

const accent = {
  backgroundColor: "#f0a63c",
  height: "3px",
};

const inner = { padding: "28px 32px" };

const brand = {
  fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace",
  fontSize: "13px",
  letterSpacing: "0.06em",
  color: "#0a1017",
  margin: "0 0 24px",
};

const hr = { borderColor: "#e2e8ee", margin: "28px 0 16px" };

const footer = {
  fontSize: "12px",
  lineHeight: "1.6",
  color: "#6b8299",
  margin: "0",
};

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={accent} />
          <Section style={inner}>
            <Text style={brand}>
              R.<span style={{ color: "#f0a63c" }}>NJONJO</span>
            </Text>
            {children}
            <Hr style={hr} />
            <Text style={footer}>
              Robert Kamau Njonjo · Business Central Integration Engineer ·
              Nairobi, Kenya
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  heading: {
    fontSize: "20px",
    fontWeight: 700 as const,
    color: "#0a1017",
    margin: "0 0 16px",
    lineHeight: "1.3",
  },
  text: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#22303c",
    margin: "0 0 16px",
  },
  label: {
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    fontSize: "11px",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "#6b8299",
    margin: "0 0 4px",
  },
  value: {
    fontSize: "15px",
    lineHeight: "1.5",
    color: "#0a1017",
    margin: "0 0 18px",
    whiteSpace: "pre-wrap" as const,
  },
  button: {
    backgroundColor: "#f0a63c",
    color: "#0a1017",
    fontSize: "14px",
    fontWeight: 600 as const,
    textDecoration: "none",
    padding: "12px 22px",
    display: "inline-block",
  },
  muted: {
    fontSize: "13px",
    lineHeight: "1.6",
    color: "#6b8299",
    margin: "16px 0 0",
    wordBreak: "break-all" as const,
  },
};
