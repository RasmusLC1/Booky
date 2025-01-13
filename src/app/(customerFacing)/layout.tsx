// app/(auth)/layout.tsx or app/layout.tsx (wherever you wrap your pages)

import { Nav, NavLink } from "../../components/ui/Nav";
import SignInOrOutButton from "./_components/SignInAndOut";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Top Nav */}
      <Nav>
        <SignInOrOutButton />
        <NavLink href="/"> Home</NavLink>
        <NavLink href="/products"> Products</NavLink>
        <NavLink href="/orders"> My Orders</NavLink>
      </Nav>

      {/* Center content (login form, etc.) horizontally below the nav */}
      <div className="container mx-auto my-6 flex justify-center">
        {children}
      </div>
    </>
  );
}
