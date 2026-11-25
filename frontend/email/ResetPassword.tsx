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
                We heard you lost access to your password. Please click the link
                below to reset it:
              </p>
              <a
                href={resetUrl}
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded"
                style={{ textDecoration: "none" }}
              >
                Reset Password
              </a>
              <p className="mt-4">Best regards,</p>
              <p>The Booky Team</p>
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
