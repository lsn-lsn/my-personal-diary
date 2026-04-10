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
  forgotAction: (formData: FormData) => void;
  isForgotPending: boolean;
  forgotState: { ok: boolean; message: string };
  showForgotPassword: boolean;
  onShowForgotPasswordChange: (show: boolean) => void;
};

export function LoginDialog({
  open,
  mode,
  onOpenChange,
  onModeChange,
  authAction,
  isAuthPending,
  authState,
  forgotAction,
  isForgotPending,
  forgotState,
  showForgotPassword,
  onShowForgotPasswordChange,
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
          />
          <Input
            name="password"
            type="password"
            placeholder="密码（至少6位）"
            required
            minLength={6}
          />
          <div className="flex items-center justify-between">
            <p
              className={
                authState.ok ? "text-sm text-green-600" : "text-sm text-red-600"
              }
            >
              {authState.message}
            </p>
            <Button type="submit" loading={isAuthPending}>
              {mode === "register" ? "注册" : "登录"}
            </Button>
          </div>
        </form>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => onShowForgotPasswordChange(!showForgotPassword)}
            className="text-sm text-muted-foreground underline"
          >
            {showForgotPassword ? "收起忘记密码" : "忘记密码？"}
          </button>
        )}

        {showForgotPassword && mode === "login" && (
          <form action={forgotAction} className="mt-4 space-y-4">
            <Input
              name="email"
              type="email"
              placeholder="输入注册邮箱接收重置链接"
              required
            />
            <div className="flex items-center justify-between">
              <p
                className={
                  forgotState.ok
                    ? "text-sm text-green-600"
                    : "text-sm text-red-600"
                }
              >
                {forgotState.message}
              </p>
              <Button type="submit" loading={isForgotPending} size="sm">
                发送重置邮件
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}