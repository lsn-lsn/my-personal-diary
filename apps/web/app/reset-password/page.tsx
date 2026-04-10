"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect, useState } from "react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { resetPasswordAction } from "../actions";

const initialState = { ok: false, message: "" };

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [countdown, setCountdown] = useState<number | null>(null);

  const [state, formAction, isPending] = useActionState(
    async (_prevState: typeof initialState, formData: FormData) => {
      return resetPasswordAction(formData);
    },
    initialState,
  );

  useEffect(() => {
    if (!state.ok) {
      return;
    }
    setCountdown(3);
  }, [state.ok]);

  useEffect(() => {
    if (countdown === null) {
      return;
    }
    if (countdown <= 0) {
      router.push("/");
      return;
    }
    const timer = window.setTimeout(() => {
      setCountdown((prev) => (prev === null ? null : prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm">
      <h1 className="mb-2 text-2xl font-black text-[var(--text-primary)]">重置密码</h1>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        请输入新密码（至少 6 位）。
      </p>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="token" value={token} />
        <Input
          name="password"
          type="password"
          placeholder="新密码"
          required
          minLength={6}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-red-500">
            {!state.ok && state.message}
          </p>
          <Button
            type="submit"
            loading={isPending}
            disabled={!token || state.ok}
          >
            提交
          </Button>
        </div>
        {state.ok && countdown !== null ? (
          <p className="text-xs text-green-500">
            密码重置成功，{countdown} 秒后自动跳转首页...
          </p>
        ) : null}
      </form>

      <div className="mt-4 text-xs text-[var(--text-muted)]">
        <Link href="/" className="underline hover:text-[var(--text-primary)]">
          返回首页
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm">
      <h1 className="mb-2 text-2xl font-black text-[var(--text-primary)]">重置密码</h1>
      <p className="text-sm text-[var(--text-secondary)]">加载中...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-main)] px-4 py-10">
      <Suspense fallback={<LoadingFallback />}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}