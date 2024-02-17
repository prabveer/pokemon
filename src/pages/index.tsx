import Link from "next/link";
import { SignInButton, UserButton, useUser} from "@clerk/nextjs";
import {LoadingSpinner, LoadingPage} from "~/components/loading"
import { toast } from "react-hot-toast";
import { type RouterOutputs, api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import dayjs from "dayjs";
dayjs.extend(relativeTime);
import relativeTime from "dayjs/plugin/relativeTime"
import Image from "next/image";
import { useState } from "react";

const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.post.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.post.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post! Please try again later.");
      }
    },
  });

  if (!user) return null;

  return (

    <div className="flex w-full gap-3">
      <UserButton appearance={{
        elements: {
          userButtonAvatarBox: {
            width: 56,
            height: 56
          }
        }
      }} />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }}
        disabled={isPosting}
      />
      {input !== "" && !isPosting && (
        <button onClick={() => mutate({ content: input })}>Post</button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};
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
          <Link href = {`/@${author.name}`}><span>{`@${author.name}`}</span></Link>
          <Link href = {`/post/${post.id}`}><span className="font-thin">{` · ${dayjs(post.createdAt).fromNow()}`}</span></Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  )

}
const Feed = () => {
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (postsLoading)
    return (
      <div className="flex grow">
        <LoadingPage />
      </div>
    );

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex grow flex-col overflow-y-scroll">
      {[...data, ...data, ...data, ...data].map((fullPost) => (
        <PostsView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
}

export default function Home() {

  const {isLoaded: userLoaded, isSignedIn} = useUser();
  api.post.getAll.useQuery();
  if(!userLoaded) return <div></div>
  return (
    <PageLayout>
      <div className="flex border-b border-slate-400 p-4">
        {!isSignedIn && (
          <div className="flex justify-center">
            <SignInButton />
          </div>
        )}
        {isSignedIn && <CreatePostWizard />}
      </div>
      <Feed />
    </PageLayout>  
  );
}
