import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

export const profileRouter = createTRPCRouter({
    getUserbyUsername: publicProcedure.input(z.object({username: z.string()})).
    query(async ({input}) => {
        const [user] = await clerkClient.users.getUserList({
            username: [input.username],
        })
        if(!user) {
            throw new TRPCError ({
                code: "INTERNAL_SERVER_ERROR",
                message: "User not Found",
            });
        }

        return filterUserForClient(user);
    }),
});
