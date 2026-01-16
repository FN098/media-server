import { Keys } from "@/lib/shortcut/keys";
import { Modifiers } from "@/lib/shortcut/modifiers";

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
  callback: (e: KeyboardEvent) => void;
  condition?: boolean | (() => boolean);
};

export type ParsedKeyAction = {
  key: string;
  modifiers: Modifiers;
  callback: (e: KeyboardEvent) => void;
  condition?: boolean | (() => boolean);
};
