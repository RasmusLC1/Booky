"use client";

import { Label } from "@radix-ui/react-label";
import { Input } from "../../../../components/ui/input";
import { startTransition, useActionState, useState } from "react";
import { formatCurrency } from "../../../../lib/formatters";
import { Textarea } from "../../../../components/ui/textarea";
import { Button } from "../../../../components/ui/button";
import { addProduct, updateProduct } from "../../_actions/products";
import { useFormStatus } from "react-dom";
import { SingleImageDropzone } from "../../../../components/ImageUpload";
import { SingleFileDropzone } from "../../../../components/FileUpload";
import { useEdgeStore } from "../../../../lib/edgestore";
import { PageHeader } from "../../_components/PageHeader";

export interface ProductDto {
  id: string;
  name: string;
  author: string;
  priceInCents: number;
  filePath: string;
  imagePath: string;
  description: string;
  category: string;
  length: number;
  isAvailableForPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductFormProps {
  product?: ProductDto | null;
}

export function ProductForm({ product }: ProductFormProps) {
  const actionFn = product ? updateProduct.bind(null, product.id) : addProduct;
  const [error, action] = useActionState(actionFn, {});

  const [priceInCents, setPriceInCents] = useState<number | undefined>(
    product?.priceInCents
  );
  const [file, setFile] = useState<File | undefined>();
  const [image, setImage] = useState<File | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  const { edgestore } = useEdgeStore();
  const [fileProgress, setFileProgress] = useState(0);
  const [imageProgress, setImageProgress] = useState(0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    setIsUploading(true);

    try {
      let uploadedFileUrl = product?.filePath ?? "";
      if (file) {
        const fileRes = await edgestore.myPublicFiles.upload({
          file,
          onProgressChange: (progress) => setFileProgress(progress),
        });
        uploadedFileUrl = fileRes.url;
      }

      let uploadedImageUrl = product?.imagePath ?? "";
      if (image) {
        const imageRes = await edgestore.myPublicImages.upload({
          file: image,
          onProgressChange: (progress) => setImageProgress(progress),
        });
        uploadedImageUrl = imageRes.url;
      }

      if (!uploadedFileUrl || !uploadedImageUrl) {
        alert("Please upload both the file and image before submitting.");
        return;
      }

      const formData = new FormData(form);
      formData.set("filePath", uploadedFileUrl);
      formData.set("imagePath", uploadedImageUrl);

      startTransition(() => {
        action(formData);
      });
    } catch (err) {
      console.error("Error submitting form:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-8 bg-white p-10 rounded-lg shadow-lg w-full max-w-md"
      >
        <PageHeader>{product ? "Update Product" : "Add Product"}</PageHeader>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={product?.name ?? ""}
          />
          {error?.name && <div className="text-destructive">{error.name}</div>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            type="text"
            id="author"
            name="author"
            required
            defaultValue={product?.author ?? ""}
          />
          {error?.author && (
            <div className="text-destructive">{error.author}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="priceInCents">Price In Cents</Label>
          <Input
            type="number"
            id="priceInCents"
            name="priceInCents"
            required
            value={priceInCents ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setPriceInCents(val === "" ? undefined : Number(val));
            }}
          />
          <div className="text-muted-foreground">
            {formatCurrency((priceInCents ?? 0) / 100)}
          </div>
          {error?.priceInCents && (
            <div className="text-destructive">{error.priceInCents}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            type="text"
            id="category"
            name="category"
            required
            defaultValue={product?.category ?? ""}
          />
          {error?.category && (
            <div className="text-destructive">{error.category}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            required
            defaultValue={product?.description ?? ""}
          />
          {error?.description && (
            <div className="text-destructive">{error.description}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="file">File</Label>
          <SingleFileDropzone
            width={200}
            height={200}
            value={file}
            onChange={setFile}
          />
          <div className="h-[6px] w-44 border rounded overflow-hidden">
            <div
              className="h-full bg-black duration-150"
              style={{ width: `${fileProgress}%` }}
            />
          </div>
          {file && <div className="text-muted-foreground">{file.name}</div>}
          {!file && product?.filePath && (
            <div className="text-xs text-muted-foreground truncate">
              Current file: {product.filePath}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Image</Label>
          <SingleImageDropzone
            width={200}
            height={200}
            value={image}
            onChange={setImage}
          />
          <div className="h-[6px] w-44 border rounded overflow-hidden">
            <div
              className="h-full bg-black duration-150"
              style={{ width: `${imageProgress}%` }}
            />
          </div>
          {image && <div className="text-muted-foreground">{image.name}</div>}
          {!image && product?.imagePath && (
            <div className="text-xs text-muted-foreground truncate">
              Current image: {product.imagePath}
            </div>
          )}
        </div>

        <SubmitButton isUploading={isUploading} />
      </form>
    </div>
  );
}

function SubmitButton({ isUploading }: { isUploading: boolean }) {
  const { pending } = useFormStatus();
  const busy = pending || isUploading;
  return (
    <Button type="submit" disabled={busy}>
      {busy ? "Saving..." : "Save"}
    </Button>
  );
}