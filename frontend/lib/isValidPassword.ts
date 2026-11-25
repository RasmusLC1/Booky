// Compares a plain text password with a stored hash using your original SHA-512 + base64 logic
export async function isValidPassword(password: string, hashedPassword: string): Promise<boolean> {
    return (await hashpassword(password)) === hashedPassword;
}

// Takes a plain text password, hashes it, and returns a base64-encoded SHA-512 hash
async function hashpassword(password: string) {
    const arrayBuffer = await crypto.subtle.digest(
        "SHA-512", 
        new TextEncoder().encode(password)
    );
    
    // Convert the ArrayBuffer to a binary string, then to base64 using Edge-safe btoa
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = "";
    for (let i = 0; i < uint8Array.byteLength; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }
    console.log(btoa(binaryString))
    return btoa(binaryString);
}