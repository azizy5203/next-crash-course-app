import Link from 'next/link'
// import { GetServerSidePropsContext } from 'next'
import {User} from '@/app/types/user.type'


async function getUsers() {
  const res = await fetch('https://jsonplaceholder.typicode.com/users')
  const data:User[] = await res.json()
  return data
}

async function Projects() {
  const usersList = await getUsers()
  if (!usersList) {
    return (
      <div>
        <h1 className='text-4xl font-bold text-center'>Projects List</h1>
        <div className='app-loader'></div>
      </div>
    )
  }

  return (
    <div>
        <h1 className='text-4xl font-bold text-center mb-4'>Projects List</h1>
        <div className='grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {
            usersList.map((user:User)=>(
            <Link prefetch={true} href={`/projects/${user.id}`} className='block border border-slate-500 hover:border-pink-500 hover:bg-white/10 transition-all duration-300 rounded-md p-6'  key={user.id}>
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>
            </Link>
          ))
        }
      </div>
    </div>
  )
}

export default Projects