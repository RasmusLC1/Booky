"use client";

import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addProduct, updateProduct } from "../../_actions/products";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Product } from "@prisma/client";
import { SingleImageDropzone } from "@/components/ImageUpload";
import { SingleFileDropzone } from "@/components/FileUpload";
import { startTransition } from "react";
import { PageHeader } from "../../_components/PageHeader";


interface ProductFormProps {
  product?: Product | null;
}

export function ProductForm({ product }: ProductFormProps) {
  // Determine the action function based on whether we have a product or not
  const actionFn = product ? updateProduct.bind(null, product.id) : addProduct;

  // Initialize action state
  const [error, action] = useActionState(actionFn, {});

  // State for form fields
  const [priceInCents, setPriceInCents] = useState<number | undefined>(
    product?.priceInCents
  );
  const [file, setFile] = useState<File | undefined>();
  const [image, setImage] = useState<File | undefined>();

  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Create a FormData object to submit all fields
    const formData = new FormData(event.currentTarget as HTMLFormElement);

    // Append file and image if they are uploaded
    if (file) formData.append("file", file);
    if (image) formData.append("image", image);

    // Use startTransition to handle the action function call
    startTransition(() => {
      action(formData); // No .then() needed
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
    {/* Header */}
    <PageHeader>Add Product</PageHeader>
    
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={product?.name || ""}
        />
        {error?.name && <div className="text-destructive">{error.name}</div>}
      </div>

      {/* Price Field */}
      <div className="space-y-2">
        <Label htmlFor="priceInCents">Price In Cents</Label>
        <Input
          type="number"
          id="priceInCents"
          name="priceInCents"
          required
          value={priceInCents ?? ""}
          onChange={(e) => setPriceInCents(Number(e.target.value) || undefined)}
        />
        <div className="text-muted-foreground">
          {formatCurrency((priceInCents || 0) / 100)}
        </div>
        {error?.priceInCents && (
          <div className="text-destructive">{error.priceInCents}</div>
        )}
      </div>

      {/* Category Field */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          type="text"
          id="category"
          name="category"
          required
          defaultValue={product?.category || ""}
        />
        {error?.category && (
          <div className="text-destructive">{error.category}</div>
        )}
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          required
          defaultValue={product?.description || ""}
        />
        {error?.description && (
          <div className="text-destructive">{error.description}</div>
        )}
      </div>

      {/* File Upload Field */}
      <div className="space-y-2">
        <Label htmlFor="file">File</Label>
        <SingleFileDropzone
          width={200}
          height={200}
          value={file ?? undefined}
          onChange={(file) => setFile(file)}
        />
        {file && <div className="text-muted-foreground">{file.name}</div>}
      </div>

      {/* Image Upload Field */}
      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>
        <SingleImageDropzone
          width={200}
          height={200}
          value={image ?? undefined} // Ensure it's never null
          onChange={(file) => setImage(file)}
        />
        {image && <div className="text-muted-foreground">{image.name}</div>}
      </div>

      <SubmitButton />
    </form>
    </div>
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
