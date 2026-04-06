"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shadcn/components/ui/alert-dialog";
import { Button } from "@/shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, LucideIcon } from "lucide-react";

interface MaintenanceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  isPending: boolean;
  hasScanned: boolean;
  recordCount: number;
  message: string;
  buttonText: string;
  onExecute: () => void;
  variant?: "default" | "destructive";
}

export function MaintenanceCard({
  title,
  description,
  icon: Icon,
  isPending,
  hasScanned,
  recordCount,
  message,
  buttonText,
  onExecute,
  variant = "default",
}: MaintenanceCardProps) {
  const isDestructive = variant === "destructive";

  return (
    <Card className={isDestructive ? "border-destructive/50" : ""}>
      <CardHeader>
        <CardTitle
          className={`flex items-center gap-2 ${isDestructive ? "text-destructive" : ""}`}
        >
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="min-h-[40px] flex items-center">
          {!hasScanned ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              スキャン中...
            </div>
          ) : recordCount > 0 ? (
            <div
              className={`flex items-center gap-2 text-sm font-medium animate-in zoom-in-95 ${isDestructive ? "text-orange-600" : "text-primary"}`}
            >
              <AlertCircle className="w-4 h-4" />
              {message}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 animate-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4" />
              クリーンな状態です。
            </div>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant={variant}
              className="w-full"
              disabled={isPending || !hasScanned || recordCount === 0}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {buttonText}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>最終確認</AlertDialogTitle>
              <AlertDialogDescription>
                対象の {recordCount}{" "}
                件のデータを処理します。この操作は元に戻せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={onExecute}
                className={
                  isDestructive
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : ""
                }
              >
                実行
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
