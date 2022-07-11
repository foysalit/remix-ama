export const ErrorMessage = ({ error }: { error: string }) => {
  return <p className="px-3 py-2 bg-red-300">{error}</p>;
};
