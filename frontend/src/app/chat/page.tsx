"use client";
import { useAppData } from "@/src/context/AppContext";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Loading from "../components/Loading";

const ChatApp = () => {
  const { loading, isAuth } = useAppData();
  const router = useRouter();
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, router, loading]);
  if (loading) return <Loading />;
  return <div>ChatApp</div>;
};

export default ChatApp;
