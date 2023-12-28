import Head from "next/head";
import Link from "next/link";
import { UserButton, useUser} from "@clerk/nextjs";
import {LoadingSpinner, LoadingPage} from "src/components/loading"

import { RouterOutputs, api } from "~/utils/api";

import dayjs from "dayjs";
dayjs.extend(relativeTime);
import relativeTime from "dayjs/plugin/relativeTime"
import Image from "next/image";
import { useState } from "react";

const CreatePostWizard = () => {
  const {user} = useUser();

  const[input, setInput] = useState("");

  const ctx = api.useContext();

  const {mutate, isLoading: isPosting} = api.post.create.useMutation({
    onSuccess: () => {
      setInput("")
      void ctx.post.getAll.invalidate()
    }
  });

  console.log(user)
  if(!user) return null;

  return (
      <div className="flex gap-3 w-full p-4">
        <UserButton afterSignOutUrl="/" appearance={{
        elements: {
          userButtonAvatarBox: {
            width: 56,
            height: 56
          }
        }
      }}/>
        <input placeholder="Type some emojis!" className=" bg-transparent grow"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled = {isPosting}
        ></input>
        <button onClick={() => mutate({content: input})}>Post</button>
      </div>
  )
}
type PostWithUser = RouterOutputs["post"]["getAll"][number];

const PostsView = (props:  PostWithUser) => {
  const {post, author} = props;
  return (
    <div key={post.id} className=" border-b border-slate-400 p-8 flex gap-3">
      <Image src = {author.profilePicutre} className=" h-14 w-14 rounded-full" 
        width={56} height={56} alt={`@${author.name}'s profile picture`
        } />
      <div className="flex flex-col">
        <div className="flex text-slate-300 gap-1">
          <span>{`@${author.name}`}</span>
          <span className="font-thin">{` · ${dayjs(post.createdAt).fromNow()}`}</span>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  )

}
const Feed = () => {
  const { data, isLoading } = api.post.getAll.useQuery();
  if(isLoading) return <LoadingPage />
  if(!data) return <div>Something went wrong</div>

  return (
    <div>
      {data.map((fullPost) => (<PostsView {...fullPost} />))}
    </div>
)

}

export default function Home() {

  const {user, isLoaded: userLoaded} = useUser();
  api.post.getAll.useQuery();
  if(!userLoaded) return <div></div>
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className = "flex justify-center h-screen">
        <div className="w-full md:max-w-2xl border-x h-full border-slate-200">
          <div className="border-b border-slate-400 p-4 flex justify-center">
              {<CreatePostWizard />}
          </div>

          <Feed />
        </div>
      </main>
    </>
  );
}
