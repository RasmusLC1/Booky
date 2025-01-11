import { Nav, NavLink } from "../../components/ui/Nav";
import SignInOrOutButton from "./_components/SignInAndOut";



// Prevents cache to prevent storage conflict in case of updates for admin
// website is therefore always refreshing on admin page
export const dynamic = "force-dynamic";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // href link that th ebutton goes to, Dashboard etc is name
  return (
    <>
      <div suppressHydrationWarning>
        <Nav>
          <SignInOrOutButton></SignInOrOutButton>
          {/* <NavLink
            href="/login"
            style={{
              position: "absolute",
              left: 0,
              background: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="1em"
              height="1em"
              viewBox="0 0 26 26"
              stroke="white"
              fill="white"
            >
              <path d="M 16 0 C 13.789063 0 11.878906 0.917969 10.6875 2.40625 C 9.496094 3.894531 9 5.824219 9 7.90625 L 9 9 L 12 9 L 12 7.90625 C 12 6.328125 12.390625 5.085938 13.03125 4.28125 C 13.671875 3.476563 14.542969 3 16 3 C 17.460938 3 18.328125 3.449219 18.96875 4.25 C 19.609375 5.050781 20 6.308594 20 7.90625 L 20 9 L 23 9 L 23 7.90625 C 23 5.8125 22.472656 3.863281 21.28125 2.375 C 20.089844 0.886719 18.207031 0 16 0 Z M 9 10 C 7.34375 10 6 11.34375 6 13 L 6 23 C 6 24.65625 7.34375 26 9 26 L 23 26 C 24.65625 26 26 24.65625 26 23 L 26 13 C 26 11.34375 24.65625 10 23 10 Z M 16 15 C 17.105469 15 18 15.894531 18 17 C 18 17.738281 17.597656 18.371094 17 18.71875 L 17 21 C 17 21.550781 16.550781 22 16 22 C 15.449219 22 15 21 L 15 18.71875 C 14.402344 18.371094 14 17.738281 14 17 C 14 15.894531 14.894531 15 16 15 Z"></path>
            </svg>
            <span style={{ color: "white", fontSize: "1rem" }}>Login</span>
          </NavLink> */}

          <NavLink href="/"> Home</NavLink>
          <NavLink href="/products"> Products</NavLink>
          <NavLink href="/orders"> My Orders</NavLink>
        </Nav>

        <div className="container my-6">{children}</div>
      </div>
    </>
  );
}
