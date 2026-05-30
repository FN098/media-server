export type ChildProcessExitStatus = {
  code: number | null;
  signal: string | null;
};

export type DumpDatabaseResult = {
  ok: boolean;
  exitStatus: ChildProcessExitStatus;
  error?: string;
};

export type RestoreDatabaseResult = {
  ok: boolean;
  exitStatus: ChildProcessExitStatus;
  error?: string;
};
