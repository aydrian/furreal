interface props {
  htmlFor: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  defaultValue?: any;
  required?: boolean;
  error?: string;
}

export const FormField: React.FC<props> = ({
  htmlFor,
  label,
  type = "text",
  defaultValue,
  required,
  error = ""
}) => {
  return (
    <>
      <label htmlFor={htmlFor}>{label}</label>
      <input
        id={htmlFor}
        type={type}
        name={htmlFor}
        required={required}
        defaultValue={defaultValue}
        aria-errormessage={error ? `${htmlFor}-error` : undefined}
      />
      {error ? <div className="pt-1 text-red-700">{error}</div> : undefined}
    </>
  );
};