"use client";

import { Lock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

type Props = {
  open: boolean;
  action: string;
  onOpenChange: (open: boolean) => void;
  onLoginClick: () => void;
};

const actionLabels: Record<string, string> = {
  post: "发帖",
  like: "点赞",
  comment: "评论",
};

export function AuthGuardModal({
  open,
  action,
  onOpenChange,
  onLoginClick,
}: Props) {
  const actionLabel = actionLabels[action] || action;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            需要登录
          </DialogTitle>
          <DialogDescription>
            请先登录后再进行「{actionLabel}」操作
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onLoginClick}>去登录</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}