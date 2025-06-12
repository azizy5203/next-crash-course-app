// import { useRouter } from "next/router";
import { User } from "@/app/types/user.type";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function ProjectDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="app-loader"></div>}>
      <UserDetails id={id} />
    </Suspense>
  );
}

async function UserDetails({ id }: { id: string }) {
  try {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`,{
      next:{
        revalidate:120
      }
    });
    const data: User = await res.json();
    if(!data.id){
      throw new Error("User not found");
    }
    return (
      <div className="container mx-auto p-4 flex flex-col gap-4 items-center justify-center">
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <p className="">{data.email}</p>
        <p className="">{data.phone}</p>
        <p className="">{data.website}</p>
      </div>
    );
  } catch (error) {
    console.error(error);
    return notFound();
  }
}

export default ProjectDetails;
