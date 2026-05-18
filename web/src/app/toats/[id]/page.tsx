"use client";

import { useParams, useRouter } from "next/navigation";
import { ToatDetailView } from "./ToatDetailView";

export default function ToatDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  return <ToatDetailView id={params.id} onClose={() => router.back()} />;
}
