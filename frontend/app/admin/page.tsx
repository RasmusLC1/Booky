import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardTitle,
} from "../../components/ui/card";
import { formatNumber, formatCurrency } from "../../lib/formatters";

interface AdminDashboardDto {
  sales: {
    totalCents: number;
    numberOfSales: number;
  };
  customers: {
    userCount: number;
    totalOrderCents: number;
  };
  products: {
    activeCount: number;
    inactiveCount: number;
  };
}

async function getDashboardData(): Promise<AdminDashboardDto> {
  const res = await fetch(`${process.env.API_URL}/api/admin/dashboard`, {
    headers: {
      "X-Internal-Key": process.env.INTERNAL_API_KEY!,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to load dashboard stats: ${res.status}`);
  }

  return (await res.json()) as AdminDashboardDto;
}

export default async function AdminDashboard() {
  const { sales, customers, products } = await getDashboardData();

  const totalSalesAmount = sales.totalCents / 100;
  const averageValuePerUser =
    customers.userCount === 0
      ? 0
      : customers.totalOrderCents / customers.userCount / 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DashboardCard
        title="Sale"
        subtitle={`${formatNumber(sales.numberOfSales)} Orders`}
        body={`Total Sales: ${formatCurrency(totalSalesAmount)}`}
      />

      <DashboardCard
        title="Customer"
        subtitle={`${formatCurrency(averageValuePerUser)} Average Value`}
        body={formatNumber(customers.userCount)}
      />

      <DashboardCard
        title="Active Products"
        subtitle={`Inactive: ${formatNumber(products.inactiveCount)}`}
        body={`Active: ${formatNumber(products.activeCount)}`}
      />
    </div>
  );
}

type DashboardCardProps = {
  title: string;
  subtitle: string;
  body: string;
};

function DashboardCard({ title, subtitle, body }: DashboardCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{body}</p>
      </CardContent>
    </Card>
  );
}