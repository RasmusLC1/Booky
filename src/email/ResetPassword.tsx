import { Button } from "@/components/ui/button";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
} from "@react-email/components";

type PasswordResetProps = {
  user: {
    username: string;
    email: string;
  };
  resetUrl: string;
};


export default function Reset_Password({
  user,
  resetUrl,
}: PasswordResetProps) {
  return (
    <Html>
      <Preview>Reset your Booky Password</Preview>
      <Tailwind>
        <Head />
        <Body className="font-sans bg-white">
          <Container className="max-w-xl">
            <Heading>Hello, {user.username}</Heading>
            <div>
              <p className="mb-4">
                We heard that your lost access to your password, please click the link below to reset your password
              </p>
              <Button>
              <a href={resetUrl} className="space-x-2">
                Reset Password
              </a>
                </Button>
              <p>Best regards,</p>
              <p>The Booky Team</p>
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
