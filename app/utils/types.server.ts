export type LoginForm = {
  email: string;
  password: string;
};

export type SignUpForm = {
  email: string;
  password: string;
  username: string;
};

export type ActionErrors<T> = Partial<Record<keyof T, string>>;

export type ActionData<T> = {
  formError?: string;
  fieldErrors?: ActionErrors<T>;
  fields?: T;
};
