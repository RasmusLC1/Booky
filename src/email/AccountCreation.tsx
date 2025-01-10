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

AccountCreationEmail.PreviewProps = {
  user: {
    username: "Product name",
    email: "Given Email",
  },
  serverUrl: "http://localhost:3000",
} satisfies AccountCreationEmailProps;

export default function AccountCreationEmail({
  user,
  serverUrl,
}: AccountCreationEmailProps) {
  return (
    <Html>
      <Preview>Welcome to Booky {user.username}!</Preview>
      <Tailwind>
        <Head />
        <Body className="font-sans bg-white">
          <Container className="max-w-xl">
            <Heading>Welcome to Booky {user.username}!</Heading>
            <Body>
              <p className="mb-4">
                We hope you will have a great time here and find a lot of
                interesting books.
              </p>
              <p>
                Best regards,
              </p>
              <p>
                The Booky Team
              </p>
            </Body>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
