"use client";

import { useTransition } from "react";
import {
  deleteProduct,
  toggleProductAvailability,
} from "../../_actions/products";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
export function ActiveToggleDropdownItem({
  ID,
  isAvailabelForPurchase,
}: {
  ID: string;
  isAvailabelForPurchase: boolean;
}) {
  const [isPending, startTransition] = useTransition();

    const router = useRouter() 

  return (
    <DropdownMenuItem
      onClick={() => {
        startTransition(async () => {
          await toggleProductAvailability(ID, !isAvailabelForPurchase);
          router.refresh() // Refreshes the page when triggered

        });
      }}
    >
      {isAvailabelForPurchase ? "Deactive" : "Activate"}
    </DropdownMenuItem>
  );
}

// Checks to see if the product has orders, if yes disables the product
export function DeleteDropdownItem({
  ID,
  disabled,
}: {
  ID: string;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter()

  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={disabled || isPending}
      onClick={() => {
        startTransition(async () => {
          await deleteProduct(ID);
          router.refresh()
        });
      }}
    >
      Delete
    </DropdownMenuItem>
  );
}
