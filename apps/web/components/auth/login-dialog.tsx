"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type Props = {
  open: boolean;
  mode: "login" | "register";
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: "login" | "register") => void;
  authAction: (formData: FormData) => void;
  isAuthPending: boolean;
  authState: { ok: boolean; message: string };
};

export function LoginDialog({
  open,
  mode,
  onOpenChange,
  onModeChange,
  authAction,
  isAuthPending,
  authState,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "登录" : "注册"}</DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "登录后可发帖、点赞、评论"
              : "注册账号参与社区互动"}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 flex gap-2">
          <Button
            variant={mode === "login" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("login")}
          >
            登录
          </Button>
          <Button
            variant={mode === "register" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("register")}
          >
            注册
          </Button>
        </div>

        <form action={authAction} className="space-y-4">
          {mode === "register" && (
            <Input
              name="username"
              type="text"
              placeholder="用户名（至少2位）"
              required
              minLength={2}
            />
          )}
          <Input
            name="email"
            type="email"
            placeholder="邮箱"
            required
            defaultValue={mode === "login" ? "lishuna616@gmail.com" : ""}
          />
          <Input
            name="password"
            type="password"
            placeholder="密码（至少6位）"
            required
            minLength={6}
            defaultValue={mode === "login" ? "test123456" : ""}
          />
          <div className="flex items-center justify-end">
            <p className="text-sm text-red-600">
              {!authState.ok && authState.message}
            </p>
            <Button type="submit" loading={isAuthPending}>
              {mode === "register" ? "注册" : "登录"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}