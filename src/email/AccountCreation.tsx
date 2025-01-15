import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
} from "@react-email/components";

type AccountCreationEmailProps = {
  user: {
    username: string;
    email: string;
  };
  serverUrl: string;
};

export default function AccountCreationEmail({
  user,
  serverUrl,
}: AccountCreationEmailProps) {
  return (
    <Html>
      <Preview>Welcome to Booky, {user.username}!</Preview>
      <Tailwind>
        <Head />
        <Body className="font-sans bg-white">
          <Container className="max-w-xl">
            <Heading>Welcome to Booky, {user.username}!</Heading>
            <div>
              <p className="mb-4">
                We hope you will have a great time here and find a lot of
                interesting books.
              </p>

              {/* Quick Link Button */}
              <a
                href={`${serverUrl}/products`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-center no-underline"
                style={{
                  display: "inline-block",
                  margin: "16px 0",
                  textDecoration: "none",
                }}
              >
                Go check out our products
              </a>

              <p>Best regards,</p>
              <p>The Booky Team</p>
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
