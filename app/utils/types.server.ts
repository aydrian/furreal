export type ActionErrors<T> = Partial<Record<keyof T, string>>;

export type ActionData<T> = {
  formError?: string;
  fieldErrors?: ActionErrors<T>;
  fields?: T;
};
