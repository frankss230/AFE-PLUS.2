import { prisma } from "@/lib/db/prisma";
import TransactionList from "./transaction-list";


async function getTransactions(
  view: "borrow" | "return",
  search?: string,
  status?: string
) {
  let statusFilter: any = {};

  if (view === "borrow") {
    if (status) {
      if (status === "APPROVED") {
        statusFilter = { status: { in: ["APPROVED", "RETURN_PENDING", "RETURNED", "RETURN_FAILED"] } };
      } else {
        statusFilter = { status: status };
      }
    } else {
      statusFilter = { status: { in: ["PENDING", "APPROVED", "REJECTED", "RETURN_PENDING", "RETURNED", "RETURN_FAILED"] } };
    }
  } else {
    if (status) {
      statusFilter = { status: status };
    } else {
      statusFilter = { status: { in: ["RETURN_PENDING", "RETURNED", "RETURN_FAILED"] } };
    }
  }

  
  

  const items = await prisma.borrowEquipment.findMany({
    where: {
      ...statusFilter,
      OR: search
        ? [
            { borrower: { firstName: { contains: search, mode: "insensitive" } } },
            { borrower: { lastName: { contains: search, mode: "insensitive" } } },
            { dependent: { firstName: { contains: search, mode: "insensitive" } } },
          ]
        : undefined,
    },
    include: {
      borrower: true,
      dependent: true,
      items: { include: { equipment: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return items;
}

interface TransactionTableSectionProps {
  view: "borrow" | "return";
  search: string;
  status: string;
}

export default async function TransactionTableSection({ view, search, status }: TransactionTableSectionProps) {
  
  const transactions = await getTransactions(view, search, status);

  return <TransactionList data={transactions} view={view} />;
}