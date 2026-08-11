import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles as s } from "./EmailLayout";

export type SubscribeConfirmProps = {
  confirmUrl: string;
};

export function SubscribeConfirm({ confirmUrl }: SubscribeConfirmProps) {
  return (
    <EmailLayout preview="Confirm your subscription to the notes">
      <Text style={s.heading}>One more click</Text>
      <Text style={s.text}>
        You asked to receive the notes — working posts on Business Central
        integration, sent when something is worth reading. Confirm your email to
        finish subscribing.
      </Text>
      <Section style={{ margin: "8px 0 4px" }}>
        <Button style={s.button} href={confirmUrl}>
          Confirm subscription
        </Button>
      </Section>
      <Text style={s.muted}>
        Or paste this link into your browser:
        <br />
        {confirmUrl}
      </Text>
      <Text style={s.muted}>
        If you didn&apos;t request this, you can safely ignore it — no
        subscription is created until you confirm.
      </Text>
    </EmailLayout>
  );
}

export default SubscribeConfirm;
