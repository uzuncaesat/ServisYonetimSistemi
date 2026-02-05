"use client";

import { useSession } from "next-auth/react";
import { User } from "lucide-react";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 sm:px-6">
      <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{title}</h1>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>{session?.user?.name || session?.user?.email}</span>
        </div>
      </div>
    </header>
  );
}
