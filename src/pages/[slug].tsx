import Head from "next/head";
import { GetStaticProps, type NextPage } from "next";
import Link from "next/link";
import { UserButton, useUser} from "@clerk/nextjs";
import {LoadingSpinner, LoadingPage} from "~/components/loading"
import { toast } from "react-hot-toast";
import { RouterOutputs, api } from "~/utils/api";
import { appRouter } from "~/server/api/root";
import SuperJSON from "superjson";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { PageLayout } from "~/components/layout";
import Image from "next/image";


const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data } = api.profile.getUserbyUsername.useQuery({
    username,
  });
  if(!data) return <div>404</div>
  return (
    <>
      <Head>
        <title>{data.name}</title>
      </Head>
      <PageLayout>
        <div className="border-slate-400 h-36 relative bg-slate-600">
          <Image 
          src = { data.profilePicutre} 
          alt= {`${data.name ?? ""}'s profile pic`}
          width = {128}
          height={128}
          className="-mb-[64px] absolute bottom-0 left-0 ml-4 rounded-full
          border-2 border-black"
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold">{`@${data.name ?? ""}`}</div>
        <div className="w-full border-b border-slate-400"></div>
      </PageLayout>
    </>
  );
}
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserbyUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
  
};
export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};
export default ProfilePage;
