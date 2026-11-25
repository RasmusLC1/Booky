import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { PageHeader } from "../_components/PageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { DeleteDropDownItem } from "./_components/UserActions";

interface AdminUserDto {
  id: string;
  email: string;
  username: string;
  orderCount: number;
  totalSpentCents: number;
}

async function getUsers(): Promise<AdminUserDto[]> {
  const res = await fetch(`${process.env.API_URL}/api/admin/users`, {
    headers: {
      "X-Internal-Key": process.env.INTERNAL_API_KEY!,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch users: ${res.status}`);
  }

  return (await res.json()) as AdminUserDto[];
}

export default function UsersPage() {
  return (
    <>
      <PageHeader>Customers</PageHeader>
      <UsersTable />
    </>
  );
}

async function UsersTable() {
  const users = await getUsers();

  if (users.length === 0) return <p>No customers found</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Orders</TableHead>
          <TableHead>Value</TableHead>
          <TableHead className="w-0">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.username}</TableCell>
            <TableCell>{formatNumber(user.orderCount)}</TableCell>
            <TableCell>{formatCurrency(user.totalSpentCents / 100)}</TableCell>
            <TableCell className="text-center">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MoreVertical>
                    <span className="sr-only">Actions</span>
                  </MoreVertical>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DeleteDropDownItem id={user.id} />
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}