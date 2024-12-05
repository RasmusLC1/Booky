
// Takes a password and a stored hash of a password
export async function isValidPassword(password: string, hashedPassword: string) {

    console.log(await hashpassword(password), hashedPassword)
    console.log("TEST")
    return (await hashpassword(password)) == hashedPassword
    
}

// Takes a plain text password, hashes it and returns a hash, if the hash mathches the stored hash we have the correct password
async function hashpassword(password: string){
    const arrayBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(password))
    
    // Reduce the size by converting to base64
    return Buffer.from(arrayBuffer).toString("base64")
}