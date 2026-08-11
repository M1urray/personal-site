import { Text } from "@react-email/components";
import { EmailLayout, emailStyles as s } from "./EmailLayout";

export type ContactAcknowledgementProps = {
  name: string;
};

export function ContactAcknowledgement({ name }: ContactAcknowledgementProps) {
  const first = name.split(" ")[0] || name;
  return (
    <EmailLayout preview="Thanks — your message reached me">
      <Text style={s.heading}>Thanks, {first}</Text>
      <Text style={s.text}>
        Your message reached me and I read every one personally. I&apos;ll reply
        as soon as I can — usually within a couple of working days.
      </Text>
      <Text style={s.text}>
        If it&apos;s time-sensitive, you can also reach me directly at{" "}
        rknjonjo@gmail.com.
      </Text>
      <Text style={s.muted}>
        You&apos;re receiving this because you submitted the contact form at
        robertnjonjo.com. No further action is needed.
      </Text>
    </EmailLayout>
  );
}

export default ContactAcknowledgement;
