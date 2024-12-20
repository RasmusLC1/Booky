import { Nav, NavLink } from "../../components/ui/Nav";

// Prevents cache to prevent storage conflict in case of updates for admin
// website is therefore always refreshing on admin page
export const dynamic = "force-dynamic"


export default function CustomerLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>){

    // href link that th ebutton goes to, Dashboard etc is name
    return <>
    <div suppressHydrationWarning>
    <Nav>
        <NavLink href="/"> Home</NavLink>
        <NavLink href="/products"> Products</NavLink>
        <NavLink href="/orders"> My Orders</NavLink>
    </Nav>

    <div className = "container my-6">
        {children}
    </div>
    </div>
    </>
  }
