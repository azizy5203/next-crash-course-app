import { NextResponse } from 'next/server';

type User = {
    id: number;
    name: string;
    email: string;
}

const users: User[] = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
    },
    {
        id: 2,
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
    }
]

export async function GET (): Promise<NextResponse<User[]>> {
    return NextResponse.json(users);
}