import { Nav, NavLink } from "../../components/ui/Nav";

// Prevents cache to prevent storage conflict in case of updates for admin
// website is therefore always refreshing on admin page
export const dynamic = "force-dynamic"


export default function AdminLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>){

    // href link that th ebutton goes to, Dashboard etc is name
    return <>
    <div suppressHydrationWarning>

      <Nav>
          <NavLink href="/admin"> Dashboard</NavLink>
          <NavLink href="/admin/products"> Products</NavLink>
          <NavLink href="/admin/users"> Customers</NavLink>
          <NavLink href="/admin/orders"> Sales</NavLink>
      </Nav>

      <div className = "container my-6">
          {children}
      </div>
    </div>

    </>
  }
