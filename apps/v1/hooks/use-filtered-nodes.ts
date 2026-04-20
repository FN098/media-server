"use client";

import {
  FavoriteFilterMode,
  MediaTypeFilterValue,
  QueryFilterValue,
  RatingFilterValue,
  TagFilterValue,
} from "@/lib/filter/types";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode, MediaNodeFilter } from "@/lib/media/types";
import { isMatchJapanese } from "@/lib/utils/japanese";
import { useMemo } from "react";

// helpers

function createSearchFilter(value: QueryFilterValue): MediaNodeFilter {
  const trimmed = value.query?.trim();
  return (node) => !trimmed || isMatchJapanese(node.name, trimmed);
}

function createTagFilter(value: TagFilterValue): MediaNodeFilter {
  return (node) => {
    const nodeTagNames = node.tags?.map((t) => t.name) || [];

    switch (value.mode) {
      case "OR":
        // 選択したタグのいずれか1つでも含まれていればOK
        return value.tags.some((tag) => nodeTagNames.includes(tag.name));
      case "NOT":
        // 選択したタグがいずれも含まれていない場合のみOK
        return !value.tags.some((tag) => nodeTagNames.includes(tag.name));
      case "AND":
        // すべて含まれている場合のみOK
        return value.tags.every((tag) => nodeTagNames.includes(tag.name));
      case "EMPTY":
        // 1つもタグを含まなければOK
        return nodeTagNames.length === 0;
      default:
        return true;
    }
  };
}

function createRatingFilter(value: RatingFilterValue): MediaNodeFilter {
  return (node: MediaNode) => {
    const rating = node.rating;

    switch (value.mode) {
      case "all":
        return true;

      case "unrated":
        return rating == null;

      case "rated": {
        if (rating == null) return false;

        const c = value.condition;

        switch (c.operator) {
          case "gte":
            return rating >= c.value;
          case "lte":
            return rating <= c.value;
          case "eq":
            return rating === c.value;
          case "between":
            return rating >= c.min && rating <= c.max;
        }
      }
    }
  };
}

function createMediaTypeFilter(value: MediaTypeFilterValue): MediaNodeFilter {
  return (node) => {
    if (value.types.length === 0) return true;
    return value.types.includes(node.type);
  };
}

function createFavoriteFilter(mode: FavoriteFilterMode): MediaNodeFilter {
  return (node) => {
    switch (mode) {
      case "only_favorites":
        return !!node.favoritedAt;
      case "exclude_favorites":
        return !node.favoritedAt;
      case "all":
      default:
        return true;
    }
  };
}

export function useFilteredNodes({
  allNodes,
  queryFilterValue,
  tagFilterValue,
  mediaTypeFilterValue,
  ratingFilterValue,
  favoriteFilterMode,
  activated = true,
}: {
  allNodes: MediaNode[];
  queryFilterValue?: QueryFilterValue;
  tagFilterValue?: TagFilterValue;
  mediaTypeFilterValue?: MediaTypeFilterValue;
  ratingFilterValue?: RatingFilterValue;
  favoriteFilterMode?: FavoriteFilterMode;
  activated?: boolean;
}) {
  const pipeline = useMemo(
    () => [
      mediaTypeFilterValue ? createMediaTypeFilter(mediaTypeFilterValue) : null,
      ratingFilterValue ? createRatingFilter(ratingFilterValue) : null,
      tagFilterValue ? createTagFilter(tagFilterValue) : null,
      favoriteFilterMode ? createFavoriteFilter(favoriteFilterMode) : null,
      queryFilterValue ? createSearchFilter(queryFilterValue) : null,
    ],
    [
      favoriteFilterMode,
      mediaTypeFilterValue,
      queryFilterValue,
      ratingFilterValue,
      tagFilterValue,
    ]
  );

  // フィルタリング実行
  const filtered = useMemo(() => {
    if (!activated) return allNodes;

    // フィルタの適用
    return allNodes.filter((node) => {
      if (node.isDirectory) return true; // フォルダは対象外

      return pipeline.filter((f) => !!f).every((filter) => filter(node));
    });
  }, [activated, allNodes, pipeline]);

  // 「メディアのみ」のリスト
  const mediaOnly = useMemo(
    () => filtered.filter((n) => isMedia(n.type)),
    [filtered]
  );

  const filteredCount = filtered.length;
  const totalCount = allNodes.length;
  const isFiltered = filteredCount != totalCount;

  return {
    filtered,
    mediaOnly,
    filteredCount,
    totalCount,
    isFiltered,
  };
}
