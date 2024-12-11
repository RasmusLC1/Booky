"use server"

import db from "@/db/db"

// Checks if there already this product ID on the user email, to check if user has already bought this
export async function userOrderExists(email: string, productID: string){
    return (await db.order.findFirst({where: {user: {email}, productID}, select: {id: true}})) != null
}