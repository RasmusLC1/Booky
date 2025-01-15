export default async function CreateOrder(productid: string): Promise<{ message?: string; error?: string }> {
  try {
    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productid }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "Failed to create order" };
    }

    return { message: data.message || "Order created successfully!" };
  } catch (error) {
    console.error("Error creating order:", error);
    return { error: "SOMETHING WENT WRONG." };
  }
}
