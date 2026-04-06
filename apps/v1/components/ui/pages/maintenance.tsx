"use client";

import {
  cleanupGhostMediaAction,
  scanGhostMediaAction,
} from "@/actions/media-actions";
import { GhostMediaCleanupCard } from "@/components/ui/cards/ghost-media-cleanup-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { Info } from "lucide-react";

export function Maintenance() {
  return (
    <div className="p-8 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <GhostMediaCleanupCard
          autoScan={true}
          onScan={scanGhostMediaAction}
          onExecute={cleanupGhostMediaAction}
        />

        {/* システム情報（プレースホルダー） */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              システム情報
            </CardTitle>
            <CardDescription>
              DBの状態やインデックスの再構築など（予定）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              現在実装されている項目はありません。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
