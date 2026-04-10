"use client";

import { User, LogIn, UserPlus, LogOut, Settings } from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { UserView } from "../../app/actions";

type Props = {
  currentUser: UserView | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
};

function isUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function UserDropdown({
  currentUser,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onLogout,
}: Props) {
  if (!currentUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={onLoginClick}>
            <LogIn className="mr-2 h-4 w-4" />
            登录
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRegisterClick}>
            <UserPlus className="mr-2 h-4 w-4" />
            注册
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const avatarValue = currentUser.avatar || "🙂";
  const avatarIsUrl = isUrl(avatarValue);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 rounded-lg px-2 py-1">
          {avatarIsUrl ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarValue} alt={currentUser.displayName} />
              <AvatarFallback>🙂</AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-avatar)] text-lg">
              {avatarValue}
            </div>
          )}
          <span className="text-sm font-semibold">{currentUser.displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{currentUser.displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick}>
          <Settings className="mr-2 h-4 w-4" />
          个人资料
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}