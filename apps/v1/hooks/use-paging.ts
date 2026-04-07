"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface UsePagingOptions {
  defaultPageSize?: number;
  useUrlParams?: boolean; // URL同期を有効にするか
  pageKey?: string; // パラメータ名（デフォルト "page"）
}

export function usePaging(totalItems: number, options: UsePagingOptions = {}) {
  const {
    defaultPageSize = 48,
    useUrlParams = false,
    pageKey = "page",
  } = options;

  const searchParams = useSearchParams();

  // 初回マウント時のみURLからページ番号を読み取る
  const getInitialPage = () => {
    if (useUrlParams) {
      const p = searchParams.get(pageKey);
      return p ? Math.max(1, parseInt(p, 10) || 1) : 1;
    }
    return 1;
  };

  // 内部ステート（URLを使わない場合のフォールバック）
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  );

  // ページ番号の補正ロジック
  const fixedCurrentPage = useMemo(() => {
    if (totalPages > 0 && currentPage > totalPages) return totalPages;
    return Math.max(1, currentPage);
  }, [currentPage, totalPages]);

  // URLを履歴に残しつつ同期する（Next.jsのrouterを介さずブラウザAPIを使用）
  const updateUrl = useCallback(
    (page: number) => {
      if (!useUrlParams) return;

      const params = new URLSearchParams(window.location.search);
      params.set(pageKey, page.toString());

      // pushState で履歴に追加、replaceState なら上書き（戻るボタンを汚さない）
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, "", newUrl);
    },
    [useUrlParams, pageKey]
  );

  // ページ更新関数
  const setPage = useCallback(
    (page: number) => {
      const targetPage = Math.max(1, Math.min(page, totalPages || 1));

      // 先にステートを更新して即座に再レンダリング（高速化の肝）
      setCurrentPage(targetPage);

      // 裏でURLを更新
      updateUrl(targetPage);
    },
    [totalPages, updateUrl]
  );

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size);
      setPage(1);
    },
    [setPage]
  );

  const paginate = useCallback(
    <T>(items: T[]): T[] => {
      const start = (fixedCurrentPage - 1) * pageSize;
      return items.slice(start, start + pageSize);
    },
    [fixedCurrentPage, pageSize]
  );

  // ブラウザの「戻る・進む」ボタンに対応するための処理
  useEffect(() => {
    if (!useUrlParams) return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = params.get(pageKey);
      if (p) setCurrentPage(parseInt(p, 10) || 1);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [useUrlParams, pageKey]);

  return {
    currentPage: fixedCurrentPage,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    paginate,
  };
}
