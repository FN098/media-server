export type SignUpResult = {
  ok: false;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message: string;
};
