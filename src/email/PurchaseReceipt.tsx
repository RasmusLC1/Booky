import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
} from "@react-email/components";
import { OrderInformation } from "./components/OrderInformation";

type PurchaseReceiptEmailProps = {
  product: {
    name: string;
    imagePath: string;
    description: string;
  };
  order: { id: string; createdAt: Date; priceInCents: number };
  downloadVerificationId: string;
  serverUrl: string
};

PurchaseReceiptEmail.PreviewProps = {
  product: {
    name: "Product name",
    description: "Some description",
    imagePath: "/products/c3eab1c6-72ec-4981-94f1-9326e9285b49-dinosaur.png",
  },
  order: {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    priceInCents: 10000,
  },
  downloadVerificationId: crypto.randomUUID(),
  serverUrl: "https://booky-mu.vercel.app/"
} satisfies PurchaseReceiptEmailProps;

export default function PurchaseReceiptEmail({
  product,
  order,
  downloadVerificationId,
  serverUrl
}: PurchaseReceiptEmailProps) {
  return (
    <Html>
      <Preview>Download {product.name} and view receipt</Preview>
      <Tailwind>
        <Head />
        <Body className="font-sans bg-white">
          <Container className="max-w-xl">
            <Heading>Purchase Receipt</Heading>
            <OrderInformation
              order={order}
              product={product}
              downloadVerificationId={downloadVerificationId}
              serverUrl = {serverUrl}
            />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
