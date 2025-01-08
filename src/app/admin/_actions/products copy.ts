// "use client";

// import Image from "next/image";
// import { Label } from "@radix-ui/react-label";
// import { Input } from "@/components/ui/input";
// import { useState } from "react";
// import { formatCurrency } from "@/lib/formatters";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { addProduct, updateProduct } from "../../_actions/products";
// import { useActionState } from "react";
// import { useFormStatus } from "react-dom";
// import { Product } from "@prisma/client";
// import { useEdgeStore } from "@/lib/edgestore";
// import Link from "next/link";
// import { SingleImageDropzone } from "@/components/ImageUpload";
// import { SingleFileDropzone } from "@/components/FileUpload";

// interface ProductFormProps {
//   product?: Product | null;
// }

// export function ProductForm({ product }: ProductFormProps) {
//   // Determine the action function based on whether we have a product or not
//   const actionFn = product
//     ? updateProduct.bind(null, product.id) // Assuming your product model uses `id` field
//     : addProduct;

//   // Initialize action state
//   const [error, action] = useActionState(actionFn, {});

//   // State for priceInCents
//   const [priceInCents, setPriceInCents] = useState<number | undefined>(
//     product?.priceInCents
//   );

//   // File handler
//   const [file, setFile] = useState<File>();
//   const [image, setImage] = useState<File>();
//   const { edgestore } = useEdgeStore();
//   const [imageProgress, setImageProgress] = useState(0);
//   const [fileProgress, setFileProgress] = useState(0);

  
//   const [imageUrls, setImageUrls] = useState<{
//     url: string | null;
//     thumbnailUrl: string | null;
//   }>(() => ({
//     url: product?.imagePath || "",
//     thumbnailUrl: null,
//   }));

//   const [fileUrls, setFileUrls] = useState<{
//     url: string | null;
//     size: number | null;
//   }>(() => ({
//     url: product?.filePath || "",
//     size: null,
//   }));

//   return (
//     <form action={action} className="space-y-8">
//       {/* Name Field */}
//       <div className="space-y-2">
//         <Label htmlFor="name">Name</Label>
//         <Input
//           type="text"
//           id="name"
//           name="name"
//           required
//           defaultValue={product?.name || ""}
//         />
//         {error?.name && <div className="text-destructive">{error.name}</div>}
//       </div>

//       {/* Category Field */}
//       <div className="space-y-2">
//         <Label htmlFor="category">Category</Label>
//         <Input
//           type="text"
//           id="category"
//           name="category"
//           required
//           defaultValue={product?.category || ""}
//         />
//         {error?.name && <div className="text-destructive">{error.name}</div>}
//       </div>

//       {/* Price Field */}
//       <div className="space-y-2">
//         <Label htmlFor="priceInCents">Price In Cents</Label>
//         <Input
//           type="number"
//           id="priceInCents"
//           name="priceInCents"
//           required
//           value={priceInCents ?? ""}
//           onChange={(e) => setPriceInCents(Number(e.target.value) || undefined)}
//         />
//         <div className="text-muted-foreground">
//           {formatCurrency((priceInCents || 0) / 100)}
//         </div>
//         {error?.priceInCents && (
//           <div className="text-destructive">{error.priceInCents}</div>
//         )}
//       </div>

//       {/* Description Field */}
//       <div className="space-y-2">
//         <Label htmlFor="description">Description</Label>
//         <Textarea
//           id="description"
//           name="description"
//           required
//           defaultValue={product?.description || ""}
//         />
//         {error?.description && (
//           <div className="text-destructive">{error.description}</div>
//         )}
//       </div>

//       {/* File Field */}
//       <div className="space-y-2">
//         <Label htmlFor="file">File</Label>
//         {/* <Input
//           type="file"
//           id="file"
//           name="file"
//           required={!product}
//           onChange={(e) => {
//             setFile(e.target.files?.[0]);
//           }}
//         /> */}

//         <SingleFileDropzone
//           width={200}
//           height={200}
//           value={file}
//           onChange={(file) => {
//             setFile(file);
//           }}
//         />

//         <div className="h-[6px] w-44 border rounded overflow-hidden">
//           <div
//             className="h-full bg-black duration-150"
//             style={{
//               width: `${fileProgress}%`,
//             }}
//           ></div>
//         </div>

//         <Button
//           type="button"
//           onClick={async () => {
//             if (file) {
//               const res = await edgestore.myPublicFiles.upload({
//                 file,
//                 onProgressChange: (progress) => {
//                   setFileProgress(progress);
//                 },
//               });

//               setFileUrls({
//                 url: res.url,
//                 size: res.size,
//               });
//             }
//           }}
//         >
//           Upload
//         </Button>
//         {fileUrls?.url && (
//           <Link href={fileUrls.url} target="_blank">
//             URL File
//           </Link>
//         )}
//         {fileUrls?.size && <h1>{fileUrls.size / 1024} KB </h1>}
//       </div>

//       {/* Image Field */}
//       <div className="space-y-2">
//         <Label htmlFor="image">Image</Label>
//         {/* <Input
//           type="file"
//           id="image"
//           name="image"
//           required={!product}
//           onChange={(e) => {
//             setFile(e.target.files?.[0]);
//           }}
//         /> */}
//         <SingleImageDropzone
//           width={200}
//           height={200}
//           value={image}
//           onChange={(file) => setImage(file)}
//         />

//         <div className="h-[6px] w-44 border rounded overflow-hidden">
//           <div
//             className="h-full bg-black duration-150"
//             style={{
//               width: `${imageProgress}%`,
//             }}
//           ></div>
//         </div>

//         <Button
//           type="button"
//           onClick={async () => {
//             if (image) {
//               const res = await edgestore.myPublicImages.upload({
//                 file: image,
//                 onProgressChange: (progress) => {
//                   setImageProgress(progress);
//                 },
//               });

//               setImageUrls({
//                 url: res.url,
//                 thumbnailUrl: res.thumbnailUrl,
//               });
//             }
//           }}
//         >
//           Upload Image
//         </Button>

//         {imageUrls?.url && (
//           <Link href={imageUrls.url} target="_blank">
//             URL
//           </Link>
//         )}
//         {imageUrls?.thumbnailUrl && (
//           <Link href={imageUrls.thumbnailUrl} target="_blank">
//             THUMBNAILURL
//           </Link>
//         )}
//       </div>

//       <SubmitButton />
//     </form>
//   );
// }

// function SubmitButton() {
//   const { pending } = useFormStatus();
//   return (
//     <Button type="submit" disabled={pending}>
//       {pending ? "Saving..." : "Save"}
//     </Button>
//   );
// }
