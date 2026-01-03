import { Keys } from "@/lib/shortcut-keys/keys";
import { Modifiers } from "@/lib/shortcut-keys/modifiers";

export type KeyValue = (typeof Keys)[keyof typeof Keys];
export type ModValue = (typeof Modifiers)[keyof typeof Modifiers];

export type Shortcut =
  | KeyValue
  | `${ModValue}+${KeyValue}`
  | `${ModValue}+${ModValue}+${KeyValue}`
  | `${ModValue}+${ModValue}+${ModValue}+${KeyValue}`;

export type Modifiers = {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export type KeyAction = {
  key: Shortcut | Shortcut[];
  callback: () => void;
  condition?: boolean | (() => boolean);
};

export type ParsedKeyAction = {
  key: string;
  modifiers: Modifiers;
  callback: () => void;
  condition?: boolean | (() => boolean);
};

export type RegisterFn = (actions: KeyAction | KeyAction[]) => () => void;
export type RegisterParsedFn = (action: ParsedKeyAction) => () => void;
