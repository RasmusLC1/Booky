import { Nav, NavLink } from "../../components/ui/Nav";
import SignInOrOutButton from "./_components/SignInAndOut";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav>
        <SignInOrOutButton />
        <NavLink href="/">Home</NavLink>
        <NavLink href="/products">Products</NavLink>
        <NavLink href="/orders">My Orders</NavLink>
      </Nav>

      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </>
  );
}