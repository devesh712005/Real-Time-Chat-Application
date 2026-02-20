"use client";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useState } from "react";

const VerifyOtp = () => {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {};
  const searchParams = useSearchParams();
  const email: string = searchParams.get("email") || "";
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6 ">
              <Lock size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Verify Your Email
            </h1>
            <p className="text-gray-300 text-lg">
              We have sent a six digit code to
            </p>
            <p className="text-blue-600 font-medium">{email}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 "
                placeholder="Enter your email address"
                required
                // value={email}
                // onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                // disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-2" />
                    Verifying..
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Send Verify</span>
                    <ArrowRight className="w-5 h-2" />
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
