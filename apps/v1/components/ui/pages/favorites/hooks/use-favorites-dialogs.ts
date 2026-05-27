export type FavoritesDialogs = ReturnType<typeof useFavoritesDialogs>;

export function useFavoritesDialogs() {
  return {
    isOpen: false,
  };
}
