"use client";

import Image from "next/image";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addProduct, updateProduct } from "../../_actions/products";
import { useFormState, useFormStatus } from "react-dom"
import { Product } from "@prisma/client";

export function ProductForm({product}: {product? : Product | null}) {
  // If product is null we add the product otherwise we bind the product ID to the update product function
  const [error, action] = useFormState(product == null? addProduct : updateProduct.bind(null, product.ID), {});

  // If there is no product the state is undefined
  const [priceInCents, setPriceInCents] = useState<number | undefined>(product?.priceInCents);

  return (
    <form action={action} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input type="text" id="name" name="name" required defaultValue={product?.name || ""}/>
        {error.name && <div className="text-destruictive">{error.name}</div>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Price In Cents</Label>
        <Input
          type="number"
          id="priceInCents"
          name="priceInCents"
          required
          value={priceInCents}
          onChange={(e) => setPriceInCents(Number(e.target.value) || undefined)}
        />

        <div className="text-muted-foreground">
          {formatCurrency((priceInCents || 0) / 100)}
        </div>
        {error.priceInCents && (
          <div className="text-destruictive">{error.priceInCents}</div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required defaultValue={product?.description}/>
        {error.description && (
          <div className="text-destruictive">{error.description}</div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">File</Label>
        <Input type="file" id="file" name="file" required = {product == null} />
        {product != null && (
          <div className = "text-muted-foreground">{product.filePath}</div>
        )}
        {error.file && (
          <div className="text-destruictive">{error.file}</div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>
        <Input type="file" id="image" name="image" required  = {product == null} />
        {product != null && ( //Shows the image that we have uploaded
          <Image src = {product.imagePath} height = "400" width = "400" alt="Product" />
        )}
        {error.image && (
          <div className="text-destruictive">{error.image}</div>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save"}
    </Button>
  );
}
