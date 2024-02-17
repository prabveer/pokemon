
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters
import type { Post } from "@prisma/client";

const addUserDataToPosts = async (posts: Post[]) => {
  const userId = posts.map((post) => post.authorId);
  const users = (
    await clerkClient.users.getUserList({
      userId: userId,
      limit: 110,
    })
  ).map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author) {
      console.error("AUTHOR NOT FOUND", post);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Author for post not found. POST ID: ${post.id}, USER ID: ${post.authorId}`,
      });
    }
    if (!author.name) {
      // user the ExternalUsername
      if (!author.name) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Author has no GitHub Account: ${author.id}`,
        });
      }
      author.name = author.name;
    }
    return {
      post,
      author: {
        ...author,
        username: author.name ?? "(username not found)",
      },
    };
  });
};
// Create a new ratelimiter, that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});
export const postRouter = createTRPCRouter({
  
  getLatest: publicProcedure.query(({ ctx }) => {
    return ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany( {
      take: 100,
      orderBy: [
        {createdAt: "desc"}
      ]
    });

    const users = (await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
    ).map(filterUserForClient)
    
    console.log(users)

    return posts.map(post => {

      const author = users.find((user) => user.id === post.authorId)

      if(!author) throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Author for post not found"})
      if (!author.name) {
        // user the ExternalUsername
        if (!author.externalUsername) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Author has no GitHub Account: ${author.id}`,
          });
        }
        author.name = author.externalUsername;
      }
      return {
        post,
        author
      }
    })

  }),
  getPostsByUserId: publicProcedure
  .input(
    z.object({
      userId: z.string(),
    })
  )
  .query(({ ctx, input }) =>
    ctx.db.post
      .findMany({
        where: {
          authorId: input.userId,
        },
        take: 6,
        orderBy: [{ createdAt: "desc" }],
      })
      .then(addUserDataToPosts)
  ),
  create: privateProcedure.input(z.object({
    content: z.string().emoji("only emoji's allowed").min(1).max(280)
  })).mutation(async ({ctx, input}) => {
    
    const authorId = ctx.userId

    const { success } = await ratelimit.limit(authorId);

    if (!success) throw new TRPCError({code: "TOO_MANY_REQUESTS"});

    const post = await ctx.db.post.create({
      data: {
        authorId,
        content: input.content,
      },
  
    })
    return post;
  })
});
