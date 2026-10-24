export type SignInResult = {
  ok: false;
  errors?: {
    email?: string[];
    password?: string[];
  };
  message: string;
};
