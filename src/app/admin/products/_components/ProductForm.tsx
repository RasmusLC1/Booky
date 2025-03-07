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
import { useEdgeStore } from "@/lib/edgestore";
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
  const [priceInCents, setPriceInCents] = useState<number | undefined>(product?.priceInCents);
  const [file, setFile] = useState<File | undefined>();
  const [image, setImage] = useState<File | undefined>();

  // EdgeStore setup
  const { edgestore } = useEdgeStore();
  const [fileProgress, setFileProgress] = useState(0);
  const [imageProgress, setImageProgress] = useState(0);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  
    // Ensure event.currentTarget is a form element
    const form = event.currentTarget as HTMLFormElement;
    if (!form) {
      console.error("Form element not found.");
      return;
    }
  
    // Upload file to EdgeStore if it exists
    let uploadedFileUrl = "";
    if (file) {
      const fileRes = await edgestore.myPublicFiles.upload({
        file,
        onProgressChange: (progress) => setFileProgress(progress),
      });
      uploadedFileUrl = fileRes.url;
    }
  
    // Upload image to EdgeStore if it exists
    let uploadedImageUrl = "";
    if (image) {
      const imageRes = await edgestore.myPublicImages.upload({
        file: image,
        onProgressChange: (progress) => setImageProgress(progress),
      });
      uploadedImageUrl = imageRes.url;
    }
  
    // Ensure both URLs are available before proceeding
    if (!uploadedFileUrl || !uploadedImageUrl) {
      alert("Please upload both the file and image before submitting.");
      return;
    }
  
    // Create a FormData object to submit all fields
    const formData = new FormData(form);
    formData.append("filePath", uploadedFileUrl);
    formData.append("imagePath", uploadedImageUrl);
  
    // Submit the form data using startTransition
    startTransition(() => {
      try {
        action(formData);
      } catch (err) {
        console.error("Error submitting form:", err);
      }
    });
  };
  

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <PageHeader>{product ? "Update Product" : "Add Product"}</PageHeader>

        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input type="text" id="name" name="name" required defaultValue={product?.name || ""} />
          {error?.name && <div className="text-destructive">{error.name}</div>}
        </div>

        {/* Author Field */}
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input type="text" id="author" name="author" required defaultValue={product?.author || ""} />
          {error?.author && <div className="text-destructive">{error.author}</div>}
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
          {error?.priceInCents && <div className="text-destructive">{error.priceInCents}</div>}
        </div>

        {/* Category Field */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input type="text" id="category" name="category" required defaultValue={product?.category || ""} />
          {error?.category && <div className="text-destructive">{error.category}</div>}
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" required defaultValue={product?.description || ""} />
          {error?.description && <div className="text-destructive">{error.description}</div>}
        </div>

        {/* File Upload Field */}
        <div className="space-y-2">
          <Label htmlFor="file">File</Label>
          <SingleFileDropzone width={200} height={200} value={file} onChange={setFile} />

          <div className="h-[6px] w-44 border rounded overflow-hidden">
            <div
              className="h-full bg-black duration-150"
              style={{ width: `${fileProgress}%` }}
            ></div>
          </div>

          {file && <div className="text-muted-foreground">{file.name}</div>}
        </div>

        {/* Image Upload Field */}
        <div className="space-y-2">
          <Label htmlFor="image">Image</Label>
          <SingleImageDropzone width={200} height={200} value={image} onChange={setImage} />

          <div className="h-[6px] w-44 border rounded overflow-hidden">
            <div
              className="h-full bg-black duration-150"
              style={{ width: `${imageProgress}%` }}
            ></div>
          </div>

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
