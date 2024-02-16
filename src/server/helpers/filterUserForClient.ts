import type { User } from "@clerk/nextjs/server";
export const filterUserForClient = (user: User) => {

  return { 
    id: user.id, 
    name: user.username, 
    profilePicutre: user.imageUrl
    };
};