// app/actions/getUserId.ts
import db from '@/db/db'; // Your Prisma client
import { getServerSession } from "next-auth";


export async function getUserIdFromSession() {
  // Retrieve the session
  const session = await getServerSession();
  
  if (!session || !session.user?.email) {
    throw new Error('User is not authenticated');
  }

  // Retrieve the user ID based on the email
  const userEmail = session.user.email;
  const user = await db.user.findUnique({
    where: {
      email: userEmail,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user.id; // Return the user ID
}
