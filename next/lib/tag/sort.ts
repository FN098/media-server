export const tagSortTagStrategies = ["default", "by-name"] as const;

export type TagSortStrategy = (typeof tagSortTagStrategies)[number];
