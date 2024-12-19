"use server"

import db from "@/db/db"

// Checks if there already this product id on the user email, to check if user has already bought this
export async function userOrderExists(email: string, productid: string){
    return (await db.order.findFirst({where: {user: {email}, productid}, select: {id: true}})) != null
}