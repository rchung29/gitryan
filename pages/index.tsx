import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Inter } from "next/font/google";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Terminal } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [repositories, setRepositories] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // State for loading status

  useEffect(() => {
    setIsLoading(true); // Start loading
    fetch("https://api.rchung.dev/repo/list")
      .then((response) => response.json())
      .then((data) => {
        setRepositories(data);
        setIsLoading(false); // Stop loading after data is fetched
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false); // Stop loading if there's an error
      });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-zinc-50 relative">
      <div className="flex flex-row border bg-zinc-100 border border-zinc-300 rounded overflow-hidden">
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
          <div>
            <Image
              src="/cowboy.svg" // Ensure the path to the image is correct
              alt="Cowboy" // Always include an alt attribute for accessibility
              width={50}
              height={50}
              className="mb-2"
            />
            <h1 className="text-2xl font-bold text-zinc-600">GitRyan</h1>
            <p className="mb-2 text-zinc-400">
              I was so bored and now here we are
            </p>
          </div>
          <div>
            <Button className="border border-zinc-300 rounded text-zinc-600 hover:border-zinc-600 hover:text-zinc-600 transition ease-in-out">
              API I Built for This
            </Button>
          </div>
        </div>
        <div className="w-full md:w-1/2 p-8 border-l border-zinc-300">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              {/* Replace with your own loading animation component */}
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zinc-600"></div>
            </div>
          ) : (
            <ul className="space-y-4 overflow-auto">
              {repositories.map((repo, index) => (
                <li key={index} className="">
                  <Button className="w-full text-left border border-zinc-300 hover:border-zinc-600 text-zinc-600 py-6 rounded transition ease-in-out">
                    <Link
                      key={index}
                      href={`/repos/${encodeURIComponent(repo)}`}
                      className="w-full"
                    >
                      {repo}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="fixed bottom-2 left-2">
        <Alert className="rounded bg-red-200">
          <Terminal className="h-4 w-4 bg-red-500" />
          <AlertTitle className="text-red-600">Heads up!</AlertTitle>
          <AlertDescription className="text-red-400">
            Not responsive yet. Use on desktop!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
