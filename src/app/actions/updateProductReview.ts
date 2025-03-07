// "use server";

// import db from "@/db/db";
// import { redirect } from "next/navigation";
// import { getServerSession } from "next-auth";



// export async function updateProductReviews(productID: string, reviewScore: number) {

//   // 1. Ensure user is logged in
//   const session = await getServerSession();
//   console.log("UPDATE PRODUCT REVIEW")
//   if (!session || !session.user) {
//     redirect("/login");
//   }

//   const product = await db.product.findUnique({
//     where: {id: productID}
//   })
//   if (!product){
//     console.log("PRODUCT NOT FOUND")
//     return false
//   }

//   await db.product.update({
//     where: {id: productID},
//     data : {
//         reviewsnum: {
//             increment: 1
//         },
//         reviewscore: {
//             increment: reviewScore
//         }
//     }
//   })

//   return true
// }