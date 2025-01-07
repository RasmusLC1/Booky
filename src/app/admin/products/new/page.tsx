import { PageHeader } from "../../_components/PageHeader";
import { ProductForm } from "../_components/ProductForm";

export const config = {
    api: {
      bodyParser: {
        sizeLimit: "100mb",
      },
    },
  };
  
  export default function NewProductPage() {
    return (
      <>
        <PageHeader> Add Product </PageHeader>
        <ProductForm />
      </>
    );
  }