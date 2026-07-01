export type SignInResult = {
  ok: false;
  errors?: {
    email?: string[];
    password?: string[];
  };
  message: string;
};

export type SignUpResult = {
  ok: false;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message: string;
};
