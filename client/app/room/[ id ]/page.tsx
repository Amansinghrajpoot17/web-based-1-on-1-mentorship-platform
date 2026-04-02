"use client";

import { useParams } from "next/navigation";

export default function RoomPage() {
  const params = useParams();
  const id = params?.id;

  return (
    <div className="h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold">
        roomId: {id}
      </h1>
    </div>
  );
}