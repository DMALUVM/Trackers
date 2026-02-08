"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Routines tab has been merged into Today.
// Redirect anyone who has this bookmarked or cached.
export default function RoutinesPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/app/today"); }, [router]);
  return null;
}
