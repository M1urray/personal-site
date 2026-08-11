import { Section, Text } from "@react-email/components";
import { EmailLayout, emailStyles as s } from "./EmailLayout";
import { PROJECT_TYPES } from "@/lib/validation";

export type ContactNotificationProps = {
  name: string;
  email: string;
  company?: string;
  projectType: string;
  message: string;
};

function projectLabel(value: string): string {
  return PROJECT_TYPES.find((p) => p.value === value)?.label ?? value;
}

export function ContactNotification({
  name,
  email,
  company,
  projectType,
  message,
}: ContactNotificationProps) {
  return (
    <EmailLayout preview={`New enquiry from ${name}`}>
      <Text style={s.heading}>New enquiry</Text>
      <Text style={s.text}>Someone reached out through the site.</Text>

      <Section>
        <Text style={s.label}>Name</Text>
        <Text style={s.value}>{name}</Text>

        <Text style={s.label}>Email</Text>
        <Text style={s.value}>{email}</Text>

        {company ? (
          <>
            <Text style={s.label}>Company</Text>
            <Text style={s.value}>{company}</Text>
          </>
        ) : null}

        <Text style={s.label}>Project type</Text>
        <Text style={s.value}>{projectLabel(projectType)}</Text>

        <Text style={s.label}>Message</Text>
        <Text style={s.value}>{message}</Text>
      </Section>
    </EmailLayout>
  );
}

export default ContactNotification;
