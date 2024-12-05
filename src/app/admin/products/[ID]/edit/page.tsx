import db from "@/db/db";
import { PageHeader } from "../../../_components/PageHeader";
import { ProductForm } from "../../_components/ProductForm";

export default async function EditProductPage( {params: {ID}, }: {
    params: {ID: string}
}){
    const product = await db.product.findUnique({where: {ID}}) 

    return <>
    <PageHeader> Edit Product </PageHeader>
    <ProductForm product = {product}/>
    </>
}